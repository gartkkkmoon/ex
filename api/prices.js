// Vercel serverless function: live spot prices + 24h change from CoinGecko
// (keyless public endpoint). The wallet uses these for accurate USD prices and
// per-transaction USD values. Token amounts still come from Ankr.
//
// Returns { prices: { <coingeckoId>: { usd, change } } }.

export default async function handler(req, res) {
  const ids = String((req.query && req.query.ids) || "").trim();
  if (!ids) {
    res.status(200).json({ prices: {} });
    return;
  }
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_24hr_change=true`;
    const upstream = await fetch(url, { headers: { accept: "application/json" } });
    if (!upstream.ok) throw new Error(`coingecko HTTP ${upstream.status}`);
    const data = await upstream.json();
    const prices = {};
    for (const [id, value] of Object.entries(data || {})) {
      prices[id] = { usd: Number(value.usd), change: Number(value.usd_24h_change) };
    }
    res.setHeader("cache-control", "s-maxage=30, stale-while-revalidate=120");
    res.status(200).json({ prices });
  } catch (error) {
    // Pricing errors stay server-side; the app falls back to its built-ins.
    console.error("[api/prices]", error && error.message);
    res.status(200).json({ prices: {} });
  }
}
