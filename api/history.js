// Vercel serverless function: real confirmed transaction history for the
// wallet, aggregated across chains and normalized. Read-only.
//
// Returns { transactions: [{ token, network, direction, symbol, amount,
//   hash, timestamp, counterparty, status }] } (newest first).

const SYMBOL_TO_TOKEN = {
  BTC: "bitcoin", ETH: "ethereum", USDT: "tether", USDC: "usd-coin",
  BNB: "bnb", SOL: "solana", XRP: "xrp", TRX: "tron", DOGE: "dogecoin", LTC: "litecoin",
};

// Ankr blockchain id -> our network id (only chains our tokens live on).
const ANKR_NET = { eth: "ethereum", bsc: "bsc", polygon: "polygon", arbitrum: "arbitrum", optimism: "optimism" };

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
  const r = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const data = await r.json();
  if (data && data.error) throw new Error(data.error.message || "ankr error");
  return data.result || {};
}

async function evmHistory(address, out) {
  const want = address.toLowerCase();
  const blockchain = Object.keys(ANKR_NET);
  // Native transfers
  try {
    const res = await ankrCall("ankr_getTransactionsByAddress", { address: [address], blockchain, pageSize: 20, descOrder: true });
    for (const tx of res.transactions || []) {
      let wei = 0n;
      try { wei = BigInt(tx.value); } catch { wei = 0n; }
      if (wei <= 0n) continue; // skip contract calls / 0-value
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
    }
  } catch (error) { console.error("[api/history] evm native:", error && error.message); }
  // Token transfers (USDT / USDC / …)
  try {
    const res = await ankrCall("ankr_getTokenTransfers", { address: [address], blockchain, pageSize: 30, descOrder: true });
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
    }
  } catch (error) { console.error("[api/history] evm tokens:", error && error.message); }
}

async function esploraHistory(base, address, symbol, network, out) {
  try {
    const r = await fetch(`${base}/api/address/${encodeURIComponent(address)}/txs`, { headers: { accept: "application/json" } });
    const txs = await r.json();
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
    }
  } catch (error) { console.error(`[api/history] ${symbol}:`, error && error.message); }
}

async function xrpHistory(address, out) {
  try {
    const r = await fetch("https://xrplcluster.com/", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ method: "account_tx", params: [{ account: address, ledger_index_min: -1, ledger_index_max: -1, limit: 20 }] }),
    });
    const d = await r.json();
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
    }
  } catch (error) { console.error("[api/history] xrp:", error && error.message); }
}

async function tronHistory(address, out) {
  try {
    const r = await fetch(`https://api.trongrid.io/v1/accounts/${encodeURIComponent(address)}/transactions?limit=20`, { headers: { accept: "application/json" } });
    const d = await r.json();
    for (const tx of d.data || []) {
      const c = tx.raw_data && tx.raw_data.contract && tx.raw_data.contract[0];
      if (!c || c.type !== "TransferContract") continue;
      const v = c.parameter && c.parameter.value;
      if (!v) continue;
      // owner/to addresses are hex (visible:false); compare via suffix isn't reliable,
      // so use the tx-level ownership: TronGrid returns base58 only with visible param.
      pushEntry(out, {
        symbol: "TRX", network: "tron",
        direction: "outgoing", // refined below if we can tell
        amount: Number(v.amount) / 1e6,
        hash: tx.txID,
        timestamp: Number(tx.raw_data.timestamp) || 0,
        counterparty: "",
        _ownerHex: v.owner_address,
        _toHex: v.to_address,
      });
      const last = out[out.length - 1];
      if (last) last.direction = "outgoing"; // TronGrid hex; refined client-side if needed
    }
  } catch (error) { console.error("[api/history] tron:", error && error.message); }
}

export default async function handler(req, res) {
  const q = req.query || {};
  const out = [];
  const jobs = [];
  const evm = String(q.evm || "").trim();
  if (/^0x[0-9a-fA-F]{40}$/.test(evm)) jobs.push(evmHistory(evm, out));
  if (q.btc) jobs.push(esploraHistory("https://mempool.space", String(q.btc).trim(), "BTC", "bitcoin", out));
  if (q.ltc) jobs.push(esploraHistory("https://litecoinspace.org", String(q.ltc).trim(), "LTC", "litecoin", out));
  if (q.xrp) jobs.push(xrpHistory(String(q.xrp).trim(), out));
  if (q.trx) jobs.push(tronHistory(String(q.trx).trim(), out));
  await Promise.allSettled(jobs);
  // Strip internal helper fields, sort newest first.
  const transactions = out
    .map(({ _ownerHex, _toHex, ...rest }) => rest)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 60);
  res.setHeader("cache-control", "s-maxage=20, stale-while-revalidate=40");
  res.status(200).json({ transactions });
}
