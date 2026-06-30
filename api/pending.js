// Vercel serverless function: returns UNCONFIRMED (mempool) incoming transfers
// for a wallet, so the app can show them as pending receives.
//
//  • BTC  — from mempool.space (free, keyless): unconfirmed txs paying the
//           wallet's bech32 address.
//  • ETH  — native incoming via Ankr RPC eth_getBlockByNumber("pending", true)
//           using the server-side ANKR_API_KEY (Ankr has no mempool in its
//           Advanced API; the pending block is the stateless way to read it).
//
// Returns { pending: [ { token, network, symbol, amount, hash } ] }.

// ERC-20 contracts we decode from the pending block (lower-cased keys).
const ERC20 = {
  "0xdac17f958d2ee523a2206206994597c13d831ec7": { token: "tether", symbol: "USDT", decimals: 6 },
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": { token: "usd-coin", symbol: "USDC", decimals: 6 },
};

function decodeErc20Incoming(tx, want) {
  const input = typeof tx.input === "string" ? tx.input : "";
  if (input.length < 138) return null;
  const meta = ERC20[(tx.to || "").toLowerCase()];
  if (!meta) return null;
  const selector = input.slice(0, 10).toLowerCase();
  let recipient = "";
  let amountHex = "";
  if (selector === "0xa9059cbb") { // transfer(to, amount)
    recipient = `0x${input.slice(34, 74)}`;
    amountHex = input.slice(74, 138);
  } else if (selector === "0x23b872dd" && input.length >= 202) { // transferFrom(from, to, amount)
    recipient = `0x${input.slice(98, 138)}`;
    amountHex = input.slice(138, 202);
  } else {
    return null;
  }
  if (recipient.toLowerCase() !== want) return null;
  let raw = 0n;
  try { raw = BigInt(`0x${amountHex}`); } catch { return null; }
  if (raw <= 0n) return null;
  const amount = Number(raw) / 10 ** meta.decimals;
  return { token: meta.token, network: "ethereum", symbol: meta.symbol, amount: String(amount), hash: tx.hash };
}

async function fetchJson(url, body, timeoutMs = 7000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: ctrl.signal });
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

// Is this mempool tx an incoming native/ERC-20 transfer to `want`? (any gas)
function matchIncoming(tx, want) {
  if (!tx || !tx.to) return null;
  const to = tx.to.toLowerCase();
  if (to === want) {
    let wei = 0n;
    try { wei = BigInt(tx.value); } catch { wei = 0n; }
    if (wei > 0n) return { token: "ethereum", network: "ethereum", symbol: "ETH", amount: String(Number(wei) / 1e18), hash: tx.hash };
    return null;
  }
  if (ERC20[to]) return decodeErc20Incoming(tx, want);
  return null;
}

// Full mempool via txpool_content — catches LOW-GAS pending txs that never
// appear in the "pending" block. Most managed RPCs disable this, so we try
// several community nodes that allow it.
async function ethPendingViaTxpool(want, dbg) {
  const endpoints = [
    "https://ethereum-rpc.publicnode.com",
    "https://eth.llamarpc.com",
    "https://rpc.mevblocker.io",
    "https://eth.drpc.org",
  ];
  for (const endpoint of endpoints) {
    try {
      const data = await fetchJson(endpoint, { jsonrpc: "2.0", id: 1, method: "txpool_content", params: [] }, 8000);
      const result = data && data.result;
      const buckets = result && (result.pending || result.queued) ? [result.pending, result.queued] : null;
      if (!buckets) { dbg.txpool = (dbg.txpool || "") + `${endpoint}:no-txpool;`; continue; }
      const out = [];
      const seen = new Set();
      for (const bucket of buckets) {
        for (const byNonce of Object.values(bucket || {})) {
          for (const tx of Object.values(byNonce || {})) {
            const entry = matchIncoming(tx, want);
            if (entry && entry.hash && !seen.has(entry.hash)) { seen.add(entry.hash); out.push(entry); }
          }
        }
      }
      dbg.txpoolSource = endpoint;
      dbg.txpoolMatched = out.length;
      return out; // a working txpool node — authoritative
    } catch (error) {
      dbg.txpool = (dbg.txpool || "") + `${endpoint}:${error && error.message};`;
    }
  }
  return null; // no node exposed txpool
}

// Fallback: the "pending" block (only top-gas txs that will be mined next).
async function ethPendingViaBlock(want, dbg) {
  const key = process.env.ANKR_API_KEY || "";
  const endpoint = key ? `https://rpc.ankr.com/eth/${key}` : "https://rpc.ankr.com/eth";
  const out = [];
  try {
    const payload = await fetchJson(endpoint, { jsonrpc: "2.0", id: 1, method: "eth_getBlockByNumber", params: ["pending", true] }, 8000);
    const txs = (payload.result && payload.result.transactions) || [];
    for (const tx of txs) {
      const entry = matchIncoming(tx, want);
      if (entry) out.push(entry);
    }
    dbg.block = txs.length;
  } catch (error) {
    dbg.blockErr = error && error.message;
    console.error("[api/pending] eth block:", error && error.message);
  }
  return out;
}

async function ethPending(address, dbg = {}) {
  const want = address.toLowerCase();
  const viaTxpool = await ethPendingViaTxpool(want, dbg);
  if (viaTxpool) return viaTxpool; // full mempool available (low-gas included)
  return ethPendingViaBlock(want, dbg); // fall back to the pending block
}

async function btcPending(btcAddress) {
  const out = [];
  try {
    const r = await fetch(`https://mempool.space/api/address/${encodeURIComponent(btcAddress)}/txs/mempool`, {
      headers: { accept: "application/json" },
    });
    if (!r.ok) throw new Error(`mempool.space HTTP ${r.status}`);
    const txs = await r.json();
    for (const tx of txs || []) {
      let incoming = 0;
      let outgoing = 0;
      for (const vout of tx.vout || []) {
        if (vout.scriptpubkey_address === btcAddress) incoming += Number(vout.value) || 0;
      }
      for (const vin of tx.vin || []) {
        if (vin.prevout && vin.prevout.scriptpubkey_address === btcAddress) outgoing += Number(vin.prevout.value) || 0;
      }
      const net = incoming - outgoing; // sats
      if (net > 0) {
        out.push({ token: "bitcoin", network: "bitcoin", symbol: "BTC", amount: String(net / 1e8), hash: tx.txid });
      }
    }
  } catch (error) {
    console.error("[api/pending] btc:", error && error.message);
  }
  return out;
}

export default async function handler(req, res) {
  const address = String((req.query && req.query.address) || "").trim();
  const btc = String((req.query && req.query.btc) || "").trim();
  const pending = [];
  const dbg = {};
  const tasks = [];
  if (/^0x[0-9a-fA-F]{40}$/.test(address)) tasks.push(ethPending(address, dbg).then((r) => pending.push(...r)));
  if (/^bc1[0-9a-z]{20,}$/.test(btc)) tasks.push(btcPending(btc).then((r) => pending.push(...r)));
  await Promise.allSettled(tasks);
  res.setHeader("cache-control", "s-maxage=10, stale-while-revalidate=20");
  const body = { pending };
  if (req.query && req.query.debug) body.debug = dbg;
  res.status(200).json(body);
}
