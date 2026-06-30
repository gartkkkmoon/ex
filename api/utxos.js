// Vercel serverless function: confirmed UTXOs + a sane fee rate for a UTXO
// chain address, so the wallet can build a spend client-side. Read-only.
// Returns { utxos: [{ txid, vout, value }], feePerByte }.

const SOURCES = {
  bitcoin: "https://mempool.space",
  litecoin: "https://litecoinspace.org",
};

export default async function handler(req, res) {
  const coin = String((req.query && req.query.coin) || "").toLowerCase();
  const address = String((req.query && req.query.address) || "").trim();
  const base = SOURCES[coin];
  if (!base || !address) {
    res.status(200).json({ utxos: [], feePerByte: 0 });
    return;
  }
  try {
    const [utxoRes, feeRes] = await Promise.all([
      fetch(`${base}/api/address/${encodeURIComponent(address)}/utxo`, { headers: { accept: "application/json" } }),
      fetch(`${base}/api/v1/fees/recommended`, { headers: { accept: "application/json" } }),
    ]);
    const rawUtxos = await utxoRes.json();
    const fees = await feeRes.json().catch(() => ({}));
    // Spend only confirmed UTXOs to avoid building on unconfirmed inputs.
    const utxos = (Array.isArray(rawUtxos) ? rawUtxos : [])
      .filter((u) => u && u.status && u.status.confirmed)
      .map((u) => ({ txid: u.txid, vout: u.vout, value: Number(u.value) }));
    const feePerByte = Number(fees.halfHourFee || fees.hourFee || fees.economyFee || 2) || 2;
    res.setHeader("cache-control", "no-store");
    res.status(200).json({ utxos, feePerByte });
  } catch (error) {
    console.error("[api/utxos]", coin, error && error.message);
    res.status(200).json({ utxos: [], feePerByte: 0, error: "upstream" });
  }
}
