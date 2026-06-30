// Vercel serverless function: confirmed UTXOs + a sane fee rate for a UTXO
// chain address, so the wallet can build a spend client-side. Read-only.
// Returns { utxos: [{ txid, vout, value }], feePerByte }.

const SOURCES = {
  bitcoin: "https://mempool.space",
  litecoin: "https://litecoinspace.org",
};

// Dogecoin (legacy P2PKH) via Blockchair — needs each input's previous tx hex
// for non-SegWit signing, so it's handled separately.
async function dogeUtxos(address) {
  const r = await fetch(`https://api.blockchair.com/dogecoin/dashboards/address/${encodeURIComponent(address)}?limit=100`, { headers: { accept: "application/json" } });
  const d = await r.json();
  const list = (d && d.data && d.data[address] && d.data[address].utxo) || [];
  const utxos = [];
  for (const u of list.slice(0, 25)) {
    const hash = u.transaction_hash;
    try {
      const tr = await fetch(`https://api.blockchair.com/dogecoin/raw/transaction/${hash}`, { headers: { accept: "application/json" } });
      const td = await tr.json();
      const rawHex = td && td.data && td.data[hash] && td.data[hash].raw_transaction;
      if (rawHex) utxos.push({ txid: hash, vout: Number(u.index), value: Number(u.value), prevTxHex: rawHex });
    } catch (error) {
      console.error("[api/utxos] doge prevtx:", hash, error && error.message);
    }
  }
  let feePerByte = 1000;
  try {
    const sr = await fetch("https://api.blockchair.com/dogecoin/stats", { headers: { accept: "application/json" } });
    const sd = await sr.json();
    feePerByte = Number(sd && sd.data && sd.data.suggested_transaction_fee_per_byte_sat) || 1000;
  } catch { /* default */ }
  return { utxos, feePerByte };
}

export default async function handler(req, res) {
  const coin = String((req.query && req.query.coin) || "").toLowerCase();
  const address = String((req.query && req.query.address) || "").trim();
  if (coin === "dogecoin" && address) {
    try {
      const out = await dogeUtxos(address);
      res.setHeader("cache-control", "no-store");
      res.status(200).json(out);
    } catch (error) {
      console.error("[api/utxos] dogecoin:", error && error.message);
      res.status(200).json({ utxos: [], feePerByte: 0, error: "upstream" });
    }
    return;
  }
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
