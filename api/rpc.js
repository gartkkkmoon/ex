// Vercel serverless JSON-RPC proxy. Forwards a single JSON-RPC call to Ankr
// using the server-side ANKR_API_KEY so the key never reaches the browser.
// Used by the wallet to read nonce/gas and broadcast signed transactions
// (eth_getTransactionCount, eth_gasPrice, eth_sendRawTransaction, …).

// Map our network ids to Ankr RPC slugs.
const CHAINS = {
  ethereum: "eth",
  polygon: "polygon",
  bsc: "bsc",
  arbitrum: "arbitrum",
  optimism: "optimism",
  base: "base",
  avalanche: "avalanche",
  fantom: "fantom",
  gnosis: "gnosis",
  linea: "linea",
  scroll: "scroll",
  solana: "solana",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: { message: "POST only" } });
    return;
  }
  const chain = String((req.query && req.query.chain) || "ethereum").toLowerCase();
  const slug = CHAINS[chain];
  if (!slug) {
    res.status(200).json({ error: { message: "unsupported chain" } });
    return;
  }
  const key = process.env.ANKR_API_KEY || "";
  const endpoint = key ? `https://rpc.ankr.com/${slug}/${key}` : `https://rpc.ankr.com/${slug}`;
  try {
    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });
    const data = await upstream.json().catch(() => ({ error: { message: "bad upstream response" } }));
    res.setHeader("cache-control", "no-store");
    res.status(200).json(data);
  } catch (error) {
    // Provider errors stay server-side only.
    console.error("[api/rpc]", chain, error && error.message);
    res.status(200).json({ error: { message: "upstream" } });
  }
}
