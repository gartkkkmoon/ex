// Vercel serverless function: resolve the on-chain status of a single
// transaction (any chain we can send/receive on), so the wallet can turn a
// stuck/dropped "Pending" entry into a definitive "Failed" instead of
// leaving it pending forever or silently disappearing.
//
// GET /api/txstatus?network=<id>&hash=<hash>
// Returns one of:
//   { found:false, confirmed:false, failed:false }                — unknown to every provider we asked (likely dropped)
//   { found:true,  confirmed:false, failed:false }                — still in flight (mempool/unvalidated)
//   { found:true,  confirmed:true,  failed:false }                — confirmed success
//   { found:true,  confirmed:true,  failed:true  }                — confirmed but failed/reverted on-chain
//
// The caller decides what "stale" means per chain (e.g. give Solana ~2
// minutes but Bitcoin an hour) — this endpoint only reports ground truth.

const EVM_RPC_SLUG = {
  ethereum: "eth", bsc: "bsc", polygon: "polygon", arbitrum: "arbitrum", optimism: "optimism",
};

async function fetchJson(url, body, timeoutMs = 7000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

async function evmStatus(network, hash) {
  const slug = EVM_RPC_SLUG[network];
  const key = process.env.ANKR_API_KEY || "";
  const endpoint = key ? `https://rpc.ankr.com/${slug}/${key}` : `https://rpc.ankr.com/${slug}`;
  const receiptData = await fetchJson(endpoint, { jsonrpc: "2.0", id: 1, method: "eth_getTransactionReceipt", params: [hash] });
  const receipt = receiptData && receiptData.result;
  if (receipt && receipt.blockNumber) {
    return { found: true, confirmed: true, failed: receipt.status === "0x0" };
  }
  const txData = await fetchJson(endpoint, { jsonrpc: "2.0", id: 2, method: "eth_getTransactionByHash", params: [hash] });
  if (txData && txData.result) return { found: true, confirmed: false, failed: false };
  return { found: false, confirmed: false, failed: false };
}

async function utxoStatus(base, hash) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const r = await fetch(`${base}/api/tx/${encodeURIComponent(hash)}`, { headers: { accept: "application/json" }, signal: ctrl.signal });
    if (r.status === 404) return { found: false, confirmed: false, failed: false };
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    return { found: true, confirmed: Boolean(d.status && d.status.confirmed), failed: false };
  } finally {
    clearTimeout(timer);
  }
}

async function dogeStatus(hash) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const r = await fetch(`https://api.blockchair.com/dogecoin/dashboards/transaction/${encodeURIComponent(hash)}`, { headers: { accept: "application/json" }, signal: ctrl.signal });
    const d = await r.json();
    const entry = d && d.data && d.data[hash];
    if (!entry || !entry.transaction) return { found: false, confirmed: false, failed: false };
    const blockId = Number(entry.transaction.block_id);
    return { found: true, confirmed: blockId > 0, failed: false };
  } finally {
    clearTimeout(timer);
  }
}

async function solStatus(hash) {
  const key = process.env.ANKR_API_KEY || "";
  const endpoints = [];
  if (key) endpoints.push(`https://rpc.ankr.com/solana/${key}`);
  endpoints.push("https://rpc.ankr.com/solana", "https://solana-rpc.publicnode.com");
  for (const endpoint of endpoints) {
    try {
      const data = await fetchJson(endpoint, { jsonrpc: "2.0", id: 1, method: "getSignatureStatuses", params: [[hash], { searchTransactionHistory: true }] }, 6000);
      const value = data && data.result && data.result.value && data.result.value[0];
      if (value === undefined) continue; // this endpoint failed — try the next
      if (!value) return { found: false, confirmed: false, failed: false };
      return { found: true, confirmed: true, failed: Boolean(value.err) };
    } catch { /* try next endpoint */ }
  }
  return { found: false, confirmed: false, failed: false };
}

async function xrpStatus(hash) {
  const d = await fetchJson("https://xrplcluster.com/", { method: "tx", params: [{ transaction: hash }] });
  const result = d && d.result;
  if (!result || result.error === "txnNotFound") return { found: false, confirmed: false, failed: false };
  if (result.validated) {
    const txResult = result.meta && result.meta.TransactionResult;
    return { found: true, confirmed: true, failed: txResult !== "tesSUCCESS" };
  }
  return { found: true, confirmed: false, failed: false };
}

async function tronStatus(hash) {
  const d = await fetchJson("https://api.trongrid.io/wallet/gettransactioninfobyid", { value: hash });
  if (!d || !d.id) return { found: false, confirmed: false, failed: false };
  const confirmed = Boolean(d.blockNumber);
  const receiptResult = d.receipt && d.receipt.result;
  const failed = confirmed && Boolean(receiptResult) && receiptResult !== "SUCCESS" && receiptResult !== "DEFAULT";
  return { found: true, confirmed, failed };
}

export default async function handler(req, res) {
  const network = String((req.query && req.query.network) || "").toLowerCase();
  const hash = String((req.query && req.query.hash) || "").trim();
  if (!hash) {
    res.status(200).json({ found: false, confirmed: false, failed: false });
    return;
  }
  try {
    let status;
    if (EVM_RPC_SLUG[network]) status = await evmStatus(network, hash);
    else if (network === "bitcoin") status = await utxoStatus("https://mempool.space", hash);
    else if (network === "litecoin") status = await utxoStatus("https://litecoinspace.org", hash);
    else if (network === "dogecoin") status = await dogeStatus(hash);
    else if (network === "solana") status = await solStatus(hash);
    else if (network === "xrp") status = await xrpStatus(hash);
    else if (network === "tron") status = await tronStatus(hash);
    else status = { found: false, confirmed: false, failed: false };
    res.setHeader("cache-control", "no-store");
    res.status(200).json(status);
  } catch (error) {
    console.error("[api/txstatus]", network, hash, error && error.message);
    res.status(200).json({ found: false, confirmed: false, failed: false, error: "upstream" });
  }
}
