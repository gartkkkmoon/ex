// Audited, dependency-free crypto vendored into a single browser global.
// Exposes window.EXX_CRYPTO with standard BIP39/BIP44 helpers so generated
// phrases are interoperable with MetaMask/Exodus/Trust, and external phrases
// can be imported to the same addresses.
import { generateMnemonic as genMnemonic, validateMnemonic as valMnemonic, mnemonicToSeedSync } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { HDKey } from "@scure/bip32";
import { secp256k1 } from "@noble/curves/secp256k1";
import { ed25519 } from "@noble/curves/ed25519";
import { keccak_256 } from "@noble/hashes/sha3";
import { sha256 } from "@noble/hashes/sha256";
import { sha512 } from "@noble/hashes/sha512";
import { ripemd160 } from "@noble/hashes/ripemd160";
import { hmac } from "@noble/hashes/hmac";
import { bytesToHex, hexToBytes as nobleHexToBytes } from "@noble/hashes/utils";
import { bech32 } from "@scure/base";
import qrcode from "qrcode-generator";

// Proper QR encoder (byte mode, error-correction level M, auto version).
// Returns a square matrix of booleans (true = dark module) so the UI can draw a
// scannable SVG. Replaces the previous hand-rolled encoder.
function qrMatrix(text) {
  const qr = qrcode(0, "M");
  qr.addData(String(text == null ? "" : text));
  qr.make();
  const count = qr.getModuleCount();
  const rows = [];
  for (let r = 0; r < count; r += 1) {
    const row = [];
    for (let c = 0; c < count; c += 1) row.push(qr.isDark(r, c));
    rows.push(row);
  }
  return rows;
}

// --- minimal helpers for EIP-1559 transaction signing -----------------------
function hexToBytes(hex) {
  let h = String(hex == null ? "" : hex).replace(/^0x/i, "");
  if (h.length % 2) h = `0${h}`;
  if (h.length === 0) return new Uint8Array(0);
  return nobleHexToBytes(h);
}

// Big-endian, minimal-length byte array for an unsigned integer (0 -> empty).
function bigToBytes(value) {
  let v = BigInt(value);
  if (v < 0n) throw new Error("negative value");
  if (v === 0n) return new Uint8Array(0);
  let hex = v.toString(16);
  if (hex.length % 2) hex = `0${hex}`;
  return nobleHexToBytes(hex);
}

function concatBytes(arrays) {
  let length = 0;
  for (const arr of arrays) length += arr.length;
  const out = new Uint8Array(length);
  let offset = 0;
  for (const arr of arrays) { out.set(arr, offset); offset += arr.length; }
  return out;
}

function rlpLengthPrefix(length, offset) {
  if (length < 56) return Uint8Array.of(offset + length);
  let hex = length.toString(16);
  if (hex.length % 2) hex = `0${hex}`;
  const lenBytes = nobleHexToBytes(hex);
  return concatBytes([Uint8Array.of(offset + 55 + lenBytes.length), lenBytes]);
}

function rlpEncode(input) {
  if (Array.isArray(input)) {
    const body = concatBytes(input.map(rlpEncode));
    return concatBytes([rlpLengthPrefix(body.length, 0xc0), body]);
  }
  const bytes = input; // Uint8Array
  if (bytes.length === 1 && bytes[0] < 0x80) return bytes;
  return concatBytes([rlpLengthPrefix(bytes.length, 0x80), bytes]);
}

function evmPrivateKey(mnemonic, index = 0) {
  const seed = mnemonicToSeedSync(String(mnemonic).trim());
  const hd = HDKey.fromMasterSeed(seed);
  const child = hd.derive(`m/44'/60'/0'/0/${index}`);
  return child.privateKey;
}

// Build + sign an EIP-1559 (type 0x02) transaction. Values may be decimal
// strings, 0x-hex, numbers or bigints. `to`/`data` are 0x-hex strings.
// Returns { raw, hash } — raw is ready for eth_sendRawTransaction.
function buildEvmTransfer({ mnemonic, index = 0, chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value = 0, data = "" }) {
  const privateKey = evmPrivateKey(mnemonic, index);
  const fields = [
    bigToBytes(chainId),
    bigToBytes(nonce),
    bigToBytes(maxPriorityFeePerGas),
    bigToBytes(maxFeePerGas),
    bigToBytes(gasLimit),
    to ? hexToBytes(to) : new Uint8Array(0),
    bigToBytes(value),
    data ? hexToBytes(data) : new Uint8Array(0),
    [], // empty accessList
  ];
  const unsigned = concatBytes([Uint8Array.of(0x02), rlpEncode(fields)]);
  const sig = secp256k1.sign(keccak_256(unsigned), privateKey); // RFC6979, lowS
  const signed = concatBytes([Uint8Array.of(0x02), rlpEncode([
    ...fields,
    bigToBytes(sig.recovery),
    bigToBytes(sig.r),
    bigToBytes(sig.s),
  ])]);
  return { raw: `0x${bytesToHex(signed)}`, hash: `0x${bytesToHex(keccak_256(signed))}` };
}

// ERC-20 transfer(address,uint256) calldata. amountRaw is the base-unit integer.
function erc20TransferData(to, amountRaw) {
  const addr = String(to).replace(/^0x/i, "").toLowerCase().padStart(64, "0");
  const amount = BigInt(amountRaw).toString(16).padStart(64, "0");
  return `0xa9059cbb${addr}${amount}`;
}

function toChecksumAddress(hexNo0x) {
  const addr = hexNo0x.toLowerCase();
  const hash = bytesToHex(keccak_256(new TextEncoder().encode(addr)));
  let out = "0x";
  for (let i = 0; i < addr.length; i += 1) {
    out += parseInt(hash[i], 16) >= 8 ? addr[i].toUpperCase() : addr[i];
  }
  return out;
}

function ethAddressFromMnemonic(mnemonic, index = 0) {
  const seed = mnemonicToSeedSync(String(mnemonic).trim());
  const hd = HDKey.fromMasterSeed(seed);
  const child = hd.derive(`m/44'/60'/0'/0/${index}`);
  const pub = secp256k1.getPublicKey(child.privateKey, false); // uncompressed (65 bytes)
  const addrBytes = keccak_256(pub.slice(1)).slice(-20); // drop 0x04, last 20 bytes
  return toChecksumAddress(bytesToHex(addrBytes));
}

// Native SegWit (P2WPKH, bc1...) BTC address — BIP84 m/84'/0'/0'/0/index.
function btcAddressFromMnemonic(mnemonic, index = 0) {
  const seed = mnemonicToSeedSync(String(mnemonic).trim());
  const hd = HDKey.fromMasterSeed(seed);
  const child = hd.derive(`m/84'/0'/0'/0/${index}`);
  const pub = secp256k1.getPublicKey(child.privateKey, true); // compressed (33 bytes)
  const program = ripemd160(sha256(pub)); // hash160
  return bech32.encode("bc", [0, ...bech32.toWords(program)]); // witness v0
}

// --- base58 / base58check (Bitcoin + Ripple alphabets) ----------------------
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const XRP58 = "rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz";

function base58encode(bytes, alphabet = B58) {
  const digits = [0];
  for (let i = 0; i < bytes.length; i += 1) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j += 1) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry) { digits.push(carry % 58); carry = (carry / 58) | 0; }
  }
  let out = "";
  for (let k = 0; k < bytes.length && bytes[k] === 0; k += 1) out += alphabet[0];
  for (let q = digits.length - 1; q >= 0; q -= 1) out += alphabet[digits[q]];
  return out;
}

function base58check(payload, alphabet = B58) {
  const checksum = sha256(sha256(payload)).slice(0, 4);
  return base58encode(concatBytes([payload, checksum]), alphabet);
}

// --- SLIP-0010 hardened ed25519 derivation (for Solana) ---------------------
function ser32(index) {
  const out = new Uint8Array(4);
  out[0] = (index >>> 24) & 0xff;
  out[1] = (index >>> 16) & 0xff;
  out[2] = (index >>> 8) & 0xff;
  out[3] = index & 0xff;
  return out;
}

function slip10Ed25519(seed, pathIndexes) {
  let I = hmac(sha512, new TextEncoder().encode("ed25519 seed"), seed);
  let key = I.slice(0, 32);
  let chain = I.slice(32);
  for (const idx of pathIndexes) {
    const data = concatBytes([Uint8Array.of(0), key, ser32((idx | 0x80000000) >>> 0)]);
    I = hmac(sha512, chain, data);
    key = I.slice(0, 32);
    chain = I.slice(32);
  }
  return key;
}

// --- non-EVM address derivations (standard paths, interoperable) ------------
// Solana — ed25519, m/44'/501'/0'/0' (Phantom/Solflare default).
function solAddressFromMnemonic(mnemonic) {
  const seed = mnemonicToSeedSync(String(mnemonic).trim());
  const priv = slip10Ed25519(seed, [44, 501, 0, 0]);
  const pub = ed25519.getPublicKey(priv);
  return base58encode(pub, B58);
}

// XRP — secp256k1, m/44'/144'/0'/0/0, classic r-address.
function xrpAddressFromMnemonic(mnemonic) {
  const seed = mnemonicToSeedSync(String(mnemonic).trim());
  const hd = HDKey.fromMasterSeed(seed);
  const child = hd.derive("m/44'/144'/0'/0/0");
  const pub = secp256k1.getPublicKey(child.privateKey, true);
  const accountId = ripemd160(sha256(pub));
  return base58check(concatBytes([Uint8Array.of(0x00), accountId]), XRP58);
}

// Tron — secp256k1, m/44'/195'/0'/0/0, base58check address starting with 'T'.
function tronAddressFromMnemonic(mnemonic) {
  const seed = mnemonicToSeedSync(String(mnemonic).trim());
  const hd = HDKey.fromMasterSeed(seed);
  const child = hd.derive("m/44'/195'/0'/0/0");
  const pub = secp256k1.getPublicKey(child.privateKey, false); // uncompressed
  const hash = keccak_256(pub.slice(1)).slice(-20);
  return base58check(concatBytes([Uint8Array.of(0x41), hash]), B58);
}

// Dogecoin — secp256k1, m/44'/3'/0'/0/0, P2PKH (version 0x1e), starts with 'D'.
function dogeAddressFromMnemonic(mnemonic) {
  const seed = mnemonicToSeedSync(String(mnemonic).trim());
  const hd = HDKey.fromMasterSeed(seed);
  const child = hd.derive("m/44'/3'/0'/0/0");
  const pub = secp256k1.getPublicKey(child.privateKey, true);
  const h160 = ripemd160(sha256(pub));
  return base58check(concatBytes([Uint8Array.of(0x1e), h160]), B58);
}

// Litecoin — native segwit (BIP84), m/84'/2'/0'/0/0, ltc1... bech32.
function ltcAddressFromMnemonic(mnemonic) {
  const seed = mnemonicToSeedSync(String(mnemonic).trim());
  const hd = HDKey.fromMasterSeed(seed);
  const child = hd.derive("m/84'/2'/0'/0/0");
  const pub = secp256k1.getPublicKey(child.privateKey, true);
  const program = ripemd160(sha256(pub));
  return bech32.encode("ltc", [0, ...bech32.toWords(program)]);
}

const api = {
  generateMnemonic: (words = 12) => genMnemonic(wordlist, words === 24 ? 256 : 128),
  validateMnemonic: (m) => {
    try { return valMnemonic(String(m || "").trim().replace(/\s+/g, " "), wordlist); } catch { return false; }
  },
  ethAddressFromMnemonic,
  btcAddressFromMnemonic,
  solAddressFromMnemonic,
  xrpAddressFromMnemonic,
  tronAddressFromMnemonic,
  dogeAddressFromMnemonic,
  ltcAddressFromMnemonic,
  toChecksumAddress: (a) => toChecksumAddress(String(a).replace(/^0x/, "").toLowerCase()),
  buildEvmTransfer,
  erc20TransferData,
  qrMatrix,
};

if (typeof window !== "undefined") window.EXX_CRYPTO = api;
export default api;
