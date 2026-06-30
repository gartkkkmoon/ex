// Vercel serverless function: native balances for the non-EVM chains the
// wallet supports (Ankr's token balance API is EVM-only, so these are fetched
// from each chain's own provider). Returns { balances: [{ token, symbol, amount }] }.
//
// Every provider call is best-effort and isolated — one chain failing never
// blocks the others, and errors stay server-side.

async function solBalance(address) {
  const key = process.env.ANKR_API_KEY || "";
  // Try several endpoints so a key/endpoint issue can't silently zero the balance.
  const endpoints = [];
  if (key) endpoints.push(`https://rpc.ankr.com/solana/${key}`);
  endpoints.push("https://rpc.ankr.com/solana");
  endpoints.push("https://solana-rpc.publicnode.com");
  endpoints.push("https://api.mainnet-beta.solana.com");
  let lastErr = "no endpoint";
  for (const endpoint of endpoints) {
    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getBalance", params: [address] }),
      });
      if (!r.ok) { lastErr = `HTTP ${r.status}`; continue; }
      const data = await r.json();
      if (data && data.result && typeof data.result.value === "number") return data.result.value / 1e9;
      lastErr = (data && data.error && data.error.message) || "no result";
    } catch (error) {
      lastErr = (error && error.message) || "fetch error";
    }
  }
  throw new Error(`solana: ${lastErr}`);
}

async function btcLikeBalance(base, address) {
  // mempool.space / litecoinspace style address stats (confirmed + mempool).
  const r = await fetch(`${base}/api/address/${encodeURIComponent(address)}`, { headers: { accept: "application/json" } });
  const d = await r.json();
  const chain = d.chain_stats || {};
  const mem = d.mempool_stats || {};
  const sats = (Number(chain.funded_txo_sum || 0) - Number(chain.spent_txo_sum || 0))
    + (Number(mem.funded_txo_sum || 0) - Number(mem.spent_txo_sum || 0));
  return sats / 1e8;
}

async function dogeBalance(address) {
  const r = await fetch(`https://api.blockchair.com/dogecoin/dashboards/address/${encodeURIComponent(address)}`, { headers: { accept: "application/json" } });
  const d = await r.json();
  const info = d && d.data && d.data[address] && d.data[address].address;
  return Number((info && info.balance) || 0) / 1e8;
}

async function xrpBalance(address) {
  const r = await fetch("https://xrplcluster.com/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ method: "account_info", params: [{ account: address, ledger_index: "validated" }] }),
  });
  const d = await r.json();
  const drops = d && d.result && d.result.account_data && d.result.account_data.Balance;
  return Number(drops || 0) / 1e6;
}

async function trxBalance(address) {
  const r = await fetch(`https://api.trongrid.io/v1/accounts/${encodeURIComponent(address)}`, { headers: { accept: "application/json" } });
  const d = await r.json();
  const acct = d && d.data && d.data[0];
  return Number((acct && acct.balance) || 0) / 1e6;
}

const TASKS = {
  sol: { token: "solana", symbol: "SOL", run: (a) => solBalance(a) },
  btc: { token: "bitcoin", symbol: "BTC", run: (a) => btcLikeBalance("https://mempool.space", a) },
  ltc: { token: "litecoin", symbol: "LTC", run: (a) => btcLikeBalance("https://litecoinspace.org", a) },
  doge: { token: "dogecoin", symbol: "DOGE", run: (a) => dogeBalance(a) },
  xrp: { token: "xrp", symbol: "XRP", run: (a) => xrpBalance(a) },
  trx: { token: "tron", symbol: "TRX", run: (a) => trxBalance(a) },
};

export default async function handler(req, res) {
  const q = req.query || {};
  const balances = [];
  const jobs = [];
  for (const [param, meta] of Object.entries(TASKS)) {
    const address = String(q[param] || "").trim();
    if (!address) continue;
    jobs.push(
      meta.run(address)
        .then((amount) => { if (Number.isFinite(amount)) balances.push({ token: meta.token, symbol: meta.symbol, amount: String(amount) }); })
        .catch((error) => { console.error(`[api/chainbalances] ${param}:`, error && error.message); }),
    );
  }
  await Promise.allSettled(jobs);
  res.setHeader("cache-control", "s-maxage=15, stale-while-revalidate=30");
  res.status(200).json({ balances });
}
