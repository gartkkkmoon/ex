// Vercel serverless function: proxy XRP Ledger JSON-RPC (account_info,
// ledger_current, fee, submit) to a public rippled cluster. Read/relay only —
// signing happens client-side. Forwards the POST body verbatim.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }
  try {
    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    const upstream = await fetch("https://xrplcluster.com/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });
    const data = await upstream.json().catch(() => ({ error: "bad upstream response" }));
    res.setHeader("cache-control", "no-store");
    res.status(200).json(data);
  } catch (error) {
    console.error("[api/xrp]", error && error.message);
    res.status(200).json({ error: "upstream" });
  }
}
