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

async function ethPending(address) {
  const key = process.env.ANKR_API_KEY || "";
  const endpoint = key ? `https://rpc.ankr.com/eth/${key}` : "https://rpc.ankr.com/eth";
  const out = [];
  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBlockByNumber", params: ["pending", true] }),
    });
    if (!r.ok) throw new Error(`Ankr HTTP ${r.status}`);
    const payload = await r.json();
    const txs = (payload.result && payload.result.transactions) || [];
    const want = address.toLowerCase();
    for (const tx of txs) {
      if (!tx || !tx.to || tx.to.toLowerCase() !== want) continue;
      let wei = 0n;
      try { wei = BigInt(tx.value); } catch { wei = 0n; }
      if (wei <= 0n) continue;
      const eth = Number(wei) / 1e18;
      out.push({ token: "ethereum", network: "ethereum", symbol: "ETH", amount: String(eth), hash: tx.hash });
    }
  } catch (error) {
    console.error("[api/pending] eth:", error && error.message);
  }
  return out;
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
  const tasks = [];
  if (/^0x[0-9a-fA-F]{40}$/.test(address)) tasks.push(ethPending(address).then((r) => pending.push(...r)));
  if (/^bc1[0-9a-z]{20,}$/.test(btc)) tasks.push(btcPending(btc).then((r) => pending.push(...r)));
  await Promise.allSettled(tasks);
  res.setHeader("cache-control", "s-maxage=10, stale-while-revalidate=20");
  res.status(200).json({ pending });
}
