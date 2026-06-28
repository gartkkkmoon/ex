// Vercel serverless function: proxies wallet balance lookups to the Ankr
// Advanced API using the server-side key (env var ANKR_API_KEY). The key is
// never exposed to the browser. Set ANKR_API_KEY in the Vercel project's
// Environment Variables.

const CHAINS = [
  "eth", "polygon", "bsc", "arbitrum", "optimism", "base", "avalanche",
  "fantom", "gnosis", "linea", "scroll", "flare", "syscoin", "xlayer",
];

export default async function handler(req, res) {
  const address = String((req.query && req.query.address) || "").trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    res.status(400).json({ error: "invalid address" });
    return;
  }

  const key = process.env.ANKR_API_KEY || "";
  const endpoint = key
    ? `https://rpc.ankr.com/multichain/${key}`
    : "https://rpc.ankr.com/multichain";

  try {
    const assets = [];
    let totalUsd = 0;
    let pageToken = "";
    let id = 1;
    do {
      const upstream = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: id++,
          method: "ankr_getAccountBalance",
          params: { walletAddress: address, blockchain: CHAINS, onlyWhitelisted: true, pageSize: 100, pageToken },
        }),
      });
      if (!upstream.ok) throw new Error(`Ankr HTTP ${upstream.status}`);
      const payload = await upstream.json();
      if (payload.error) throw new Error(payload.error.message || "Ankr error");
      const result = payload.result || {};
      totalUsd += Number(result.totalBalanceUsd || 0) || 0;
      for (const a of result.assets || []) {
        assets.push({
          blockchain: a.blockchain,
          tokenSymbol: a.tokenSymbol,
          tokenName: a.tokenName,
          balance: a.balance,
          balanceUsd: a.balanceUsd,
          tokenPrice: a.tokenPrice,
          contractAddress: a.contractAddress,
          thumbnail: a.thumbnail,
        });
      }
      pageToken = result.nextPageToken || "";
    } while (pageToken);

    res.setHeader("cache-control", "s-maxage=20, stale-while-revalidate=40");
    res.status(200).json({ totalUsd, assets });
  } catch (error) {
    // Keep provider errors server-side (visible in Vercel logs); the client
    // just shows zero balances rather than an error. `hasKey`/`detail` are safe
    // diagnostics (they never include the key itself).
    const detail = (error && error.message) || "unknown";
    console.error("[api/balances] upstream failure:", detail, "hasKey=", Boolean(key));
    res.status(200).json({ totalUsd: 0, assets: [], error: "upstream", hasKey: Boolean(key), detail });
  }
}
