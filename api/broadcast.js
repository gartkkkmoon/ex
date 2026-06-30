// Vercel serverless function: broadcast a signed raw UTXO transaction.
// The wallet signs client-side; this only relays the hex to the network.
// Returns { txid } on success, { error } otherwise (kept server-side).

const SOURCES = {
  bitcoin: "https://mempool.space",
  litecoin: "https://litecoinspace.org",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }
  const coin = String((req.query && req.query.coin) || "").toLowerCase();
  const body = typeof req.body === "string" ? safeParse(req.body) : (req.body || {});
  const raw = String(body.raw || "").trim();
  if (!/^[0-9a-fA-F]+$/.test(raw)) {
    res.status(200).json({ error: "bad request" });
    return;
  }
  // Dogecoin broadcasts via Blockchair's push endpoint.
  if (coin === "dogecoin") {
    try {
      const r = await fetch("https://api.blockchair.com/dogecoin/push/transaction", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: `data=${raw}`,
      });
      const d = await r.json().catch(() => ({}));
      const txid = d && d.data && d.data.transaction_hash;
      if (!txid) {
        console.error("[api/broadcast] dogecoin:", JSON.stringify(d).slice(0, 200));
        res.status(200).json({ error: "broadcast failed" });
        return;
      }
      res.status(200).json({ txid });
    } catch (error) {
      console.error("[api/broadcast] dogecoin:", error && error.message);
      res.status(200).json({ error: "upstream" });
    }
    return;
  }
  const base = SOURCES[coin];
  if (!base) {
    res.status(200).json({ error: "bad request" });
    return;
  }
  try {
    const r = await fetch(`${base}/api/tx`, { method: "POST", headers: { "content-type": "text/plain" }, body: raw });
    const text = (await r.text()).trim();
    if (!r.ok) {
      console.error("[api/broadcast]", coin, text);
      res.status(200).json({ error: "broadcast failed", detail: text });
      return;
    }
    res.status(200).json({ txid: text });
  } catch (error) {
    console.error("[api/broadcast]", coin, error && error.message);
    res.status(200).json({ error: "upstream" });
  }
}

function safeParse(value) {
  try { return JSON.parse(value); } catch { return {}; }
}
