// Vercel serverless function: real confirmed transaction history for the
// wallet, aggregated across chains and normalized (newest first). Read-only.
//
// Returns { transactions: [{ token, network, direction, symbol, amount,
//   hash, timestamp, counterparty, status }] }.
// Add ?debug=1 to also get per-source counts/errors for troubleshooting.

const SYMBOL_TO_TOKEN = {
  BTC: "bitcoin", ETH: "ethereum", USDT: "tether", USDC: "usd-coin",
  BNB: "bnb", SOL: "solana", XRP: "xrp", TRX: "tron", DOGE: "dogecoin", LTC: "litecoin",
};
const ANKR_NET = { eth: "ethereum", bsc: "bsc", polygon: "polygon", arbitrum: "arbitrum", optimism: "optimism" };

// fetch with a hard timeout so one slow provider can't blow the function budget.
async function fetchJson(url, opts = {}, timeoutMs = 7000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

function pushEntry(list, e) {
  if (!e || !e.hash || !SYMBOL_TO_TOKEN[e.symbol]) return;
  const amount = Number(e.amount);
  if (!Number.isFinite(amount) || amount <= 0) return;
  list.push({
    token: SYMBOL_TO_TOKEN[e.symbol],
    network: e.network,
    direction: e.direction,
    symbol: e.symbol,
    amount: String(amount),
    hash: e.hash,
    timestamp: Number(e.timestamp) || 0,
    counterparty: e.counterparty || "",
    status: "confirmed",
  });
}

async function ankrCall(method, params) {
  const key = process.env.ANKR_API_KEY || "";
  const endpoint = key ? `https://rpc.ankr.com/multichain/${key}` : "https://rpc.ankr.com/multichain";
  const data = await fetchJson(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  }, 8000);
  if (data && data.error) throw new Error(data.error.message || "ankr error");
  return data.result || {};
}

async function evmHistory(address, out, dbg) {
  const want = address.toLowerCase();
  const blockchain = Object.keys(ANKR_NET);
  // Run token + native lookups in parallel so they don't stack timeouts.
  await Promise.allSettled([evmTokenHistory(want, blockchain, out, dbg), evmNativeHistory(want, blockchain, out, dbg)]);
}

async function evmTokenHistory(want, blockchain, out, dbg) {
  // Token transfers (USDT/USDC/etc) — usually the most relevant.
  try {
    const res = await ankrCall("ankr_getTokenTransfers", { address: [want], blockchain, pageSize: 25, descOrder: true });
    let n = 0;
    for (const t of res.transfers || []) {
      const to = (t.toAddress || "").toLowerCase();
      const from = (t.fromAddress || "").toLowerCase();
      if (to !== want && from !== want) continue;
      pushEntry(out, {
        symbol: String(t.tokenSymbol || "").toUpperCase(),
        network: ANKR_NET[t.blockchain] || t.blockchain,
        direction: to === want ? "incoming" : "outgoing",
        amount: Number(t.value),
        hash: t.transactionHash,
        timestamp: (Number(t.timestamp) || 0) * 1000,
        counterparty: to === want ? t.fromAddress : t.toAddress,
      });
      n += 1;
    }
    dbg.evmTokens = n;
  } catch (error) { dbg.evmTokensErr = error && error.message; console.error("[api/history] evm tokens:", error && error.message); }
}

async function evmNativeHistory(want, blockchain, out, dbg) {
  // Native transfers (ETH / BNB / …)
  try {
    const res = await ankrCall("ankr_getTransactionsByAddress", { address: [want], blockchain, pageSize: 20, descOrder: true });
    let n = 0;
    for (const tx of res.transactions || []) {
      let wei = 0n;
      try { wei = BigInt(tx.value); } catch { wei = 0n; }
      if (wei <= 0n) continue;
      const to = (tx.to || "").toLowerCase();
      const from = (tx.from || "").toLowerCase();
      if (to !== want && from !== want) continue;
      pushEntry(out, {
        symbol: tx.blockchain === "bsc" ? "BNB" : "ETH",
        network: ANKR_NET[tx.blockchain] || tx.blockchain,
        direction: to === want ? "incoming" : "outgoing",
        amount: Number(wei) / 1e18,
        hash: tx.hash,
        timestamp: (Number(tx.timestamp) || 0) * 1000,
        counterparty: to === want ? tx.from : tx.to,
      });
      n += 1;
    }
    dbg.evmNative = n;
  } catch (error) { dbg.evmNativeErr = error && error.message; console.error("[api/history] evm native:", error && error.message); }
}

async function esploraHistory(base, address, symbol, network, out, dbg) {
  try {
    const txs = await fetchJson(`${base}/api/address/${encodeURIComponent(address)}/txs`, { headers: { accept: "application/json" } });
    let n = 0;
    for (const tx of (Array.isArray(txs) ? txs : []).slice(0, 25)) {
      let incoming = 0, outgoing = 0;
      for (const vout of tx.vout || []) if (vout.scriptpubkey_address === address) incoming += Number(vout.value) || 0;
      for (const vin of tx.vin || []) if (vin.prevout && vin.prevout.scriptpubkey_address === address) outgoing += Number(vin.prevout.value) || 0;
      const net = incoming - outgoing;
      if (net === 0) continue;
      pushEntry(out, {
        symbol, network,
        direction: net > 0 ? "incoming" : "outgoing",
        amount: Math.abs(net) / 1e8,
        hash: tx.txid,
        timestamp: (tx.status && tx.status.block_time ? tx.status.block_time : Math.floor(Date.now() / 1000)) * 1000,
      });
      n += 1;
    }
    dbg[symbol] = n;
  } catch (error) { dbg[`${symbol}Err`] = error && error.message; console.error(`[api/history] ${symbol}:`, error && error.message); }
}

async function xrpHistory(address, out, dbg) {
  try {
    const d = await fetchJson("https://xrplcluster.com/", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ method: "account_tx", params: [{ account: address, ledger_index_min: -1, ledger_index_max: -1, limit: 20 }] }),
    });
    let n = 0;
    for (const row of (d.result && d.result.transactions) || []) {
      const tx = row.tx || row.tx_json || {};
      if (tx.TransactionType !== "Payment" || typeof tx.Amount !== "string") continue;
      const to = tx.Destination;
      pushEntry(out, {
        symbol: "XRP", network: "xrp",
        direction: to === address ? "incoming" : "outgoing",
        amount: Number(tx.Amount) / 1e6,
        hash: tx.hash,
        timestamp: ((Number(tx.date) || 0) + 946684800) * 1000,
        counterparty: to === address ? tx.Account : to,
      });
      n += 1;
    }
    dbg.XRP = n;
  } catch (error) { dbg.XRPErr = error && error.message; console.error("[api/history] xrp:", error && error.message); }
}

async function tronHistory(address, out, dbg) {
  try {
    const d = await fetchJson(`https://api.trongrid.io/v1/accounts/${encodeURIComponent(address)}/transactions?limit=20`, { headers: { accept: "application/json" } });
    let n = 0;
    for (const tx of d.data || []) {
      const c = tx.raw_data && tx.raw_data.contract && tx.raw_data.contract[0];
      if (!c || c.type !== "TransferContract") continue;
      const v = c.parameter && c.parameter.value;
      if (!v) continue;
      pushEntry(out, {
        symbol: "TRX", network: "tron",
        direction: "outgoing",
        amount: Number(v.amount) / 1e6,
        hash: tx.txID,
        timestamp: Number(tx.raw_data.timestamp) || 0,
      });
      n += 1;
    }
    dbg.TRX = n;
  } catch (error) { dbg.TRXErr = error && error.message; console.error("[api/history] tron:", error && error.message); }
}

// Dogecoin via Blockchair: list of recent tx hashes for the address, then
// per-tx input/output detail to compute the net amount at our address (same
// shape of work as esploraHistory, just a different provider/response shape
// since Dogecoin isn't covered by mempool.space-style explorers).
async function dogeHistory(address, out, dbg) {
  try {
    const listing = await fetchJson(`https://api.blockchair.com/dogecoin/dashboards/address/${encodeURIComponent(address)}?limit=20`, { headers: { accept: "application/json" } });
    const hashes = (listing && listing.data && listing.data[address] && listing.data[address].transactions) || [];
    const details = await Promise.allSettled(hashes.slice(0, 15).map((hash) =>
      fetchJson(`https://api.blockchair.com/dogecoin/dashboards/transaction/${hash}`, { headers: { accept: "application/json" } }),
    ));
    let n = 0;
    for (let i = 0; i < details.length; i += 1) {
      const result = details[i];
      if (result.status !== "fulfilled") continue;
      const hash = hashes[i];
      const entry = result.value && result.value.data && result.value.data[hash];
      if (!entry) continue;
      let incoming = 0, outgoing = 0;
      for (const out_ of entry.outputs || []) if (out_.recipient === address) incoming += Number(out_.value) || 0;
      for (const in_ of entry.inputs || []) if (in_.recipient === address) outgoing += Number(in_.value) || 0;
      const net = incoming - outgoing;
      if (net === 0) continue;
      const timeStr = entry.transaction && entry.transaction.time;
      const timestamp = timeStr ? Date.parse(`${timeStr.replace(" ", "T")}Z`) : Date.now();
      pushEntry(out, {
        symbol: "DOGE", network: "dogecoin",
        direction: net > 0 ? "incoming" : "outgoing",
        amount: Math.abs(net) / 1e8,
        hash,
        timestamp: Number.isFinite(timestamp) ? timestamp : Date.now(),
      });
      n += 1;
    }
    dbg.DOGE = n;
  } catch (error) { dbg.DOGEErr = error && error.message; console.error("[api/history] doge:", error && error.message); }
}

async function solRpc(method, params) {
  const key = process.env.ANKR_API_KEY || "";
  const endpoints = [];
  if (key) endpoints.push(`https://rpc.ankr.com/solana/${key}`);
  endpoints.push("https://rpc.ankr.com/solana", "https://solana-rpc.publicnode.com");
  let lastErr = "no endpoint";
  for (const endpoint of endpoints) {
    try {
      const data = await fetchJson(endpoint, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      }, 7000);
      if (data && data.result !== undefined) return data.result;
      lastErr = (data && data.error && data.error.message) || "no result";
    } catch (error) { lastErr = (error && error.message) || "fetch error"; }
  }
  throw new Error(lastErr);
}

async function solHistory(address, out, dbg) {
  try {
    const sigs = await solRpc("getSignaturesForAddress", [address, { limit: 10 }]);
    if (!Array.isArray(sigs)) { dbg.SOL = 0; return; }
    const details = await Promise.all(sigs.slice(0, 8).map((s) =>
      solRpc("getTransaction", [s.signature, { maxSupportedTransactionVersion: 0, encoding: "jsonParsed" }]).catch(() => null),
    ));
    let n = 0;
    for (let i = 0; i < details.length; i += 1) {
      const tx = details[i];
      const sig = sigs[i];
      if (!tx || !tx.meta || !tx.transaction) continue;
      const keys = (tx.transaction.message.accountKeys || []).map((k) => (typeof k === "string" ? k : k.pubkey));
      const idx = keys.indexOf(address);
      if (idx < 0) continue;
      const delta = (Number(tx.meta.postBalances[idx]) - Number(tx.meta.preBalances[idx])) / 1e9;
      if (delta === 0) continue;
      pushEntry(out, {
        symbol: "SOL", network: "solana",
        direction: delta > 0 ? "incoming" : "outgoing",
        amount: Math.abs(delta),
        hash: sig.signature,
        timestamp: (Number(sig.blockTime) || 0) * 1000,
      });
      n += 1;
    }
    dbg.SOL = n;
  } catch (error) { dbg.SOLErr = error && error.message; console.error("[api/history] sol:", error && error.message); }
}

export default async function handler(req, res) {
  const q = req.query || {};
  const out = [];
  const dbg = {};
  const jobs = [];
  const evm = String(q.evm || "").trim();
  if (/^0x[0-9a-fA-F]{40}$/.test(evm)) jobs.push(evmHistory(evm, out, dbg));
  if (q.btc) jobs.push(esploraHistory("https://mempool.space", String(q.btc).trim(), "BTC", "bitcoin", out, dbg));
  if (q.ltc) jobs.push(esploraHistory("https://litecoinspace.org", String(q.ltc).trim(), "LTC", "litecoin", out, dbg));
  if (q.doge) jobs.push(dogeHistory(String(q.doge).trim(), out, dbg));
  if (q.xrp) jobs.push(xrpHistory(String(q.xrp).trim(), out, dbg));
  if (q.trx) jobs.push(tronHistory(String(q.trx).trim(), out, dbg));
  if (q.sol) jobs.push(solHistory(String(q.sol).trim(), out, dbg));
  await Promise.allSettled(jobs);
  const transactions = out
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 80);
  res.setHeader("cache-control", "s-maxage=20, stale-while-revalidate=40");
  const body = { transactions };
  if (q.debug) { body.debug = dbg; body.hasKey = Boolean(process.env.ANKR_API_KEY); }
  res.status(200).json(body);
}
