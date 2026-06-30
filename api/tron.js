// Vercel serverless function: proxy Tron (TronGrid) full-node calls. The node
// builds the raw tx (createtransaction) and broadcasts it (broadcasttransaction);
// the wallet signs the txID client-side. Relay only.

const PATHS = {
  create: "/wallet/createtransaction",
  broadcast: "/wallet/broadcasttransaction",
  account: "/wallet/getaccount",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }
  const action = String((req.query && req.query.action) || "").toLowerCase();
  const path = PATHS[action];
  if (!path) {
    res.status(200).json({ error: "bad action" });
    return;
  }
  try {
    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    const upstream = await fetch(`https://api.trongrid.io${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });
    const data = await upstream.json().catch(() => ({ error: "bad upstream response" }));
    res.setHeader("cache-control", "no-store");
    res.status(200).json(data);
  } catch (error) {
    console.error("[api/tron]", action, error && error.message);
    res.status(200).json({ error: "upstream" });
  }
}
