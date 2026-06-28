// Audited, dependency-free crypto vendored into a single browser global.
// Exposes window.EXX_CRYPTO with standard BIP39/BIP44 helpers so generated
// phrases are interoperable with MetaMask/Exodus/Trust, and external phrases
// can be imported to the same addresses.
import { generateMnemonic as genMnemonic, validateMnemonic as valMnemonic, mnemonicToSeedSync } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { HDKey } from "@scure/bip32";
import { secp256k1 } from "@noble/curves/secp256k1";
import { keccak_256 } from "@noble/hashes/sha3";
import { sha256 } from "@noble/hashes/sha256";
import { ripemd160 } from "@noble/hashes/ripemd160";
import { bytesToHex, hexToBytes as nobleHexToBytes } from "@noble/hashes/utils";
import { bech32 } from "@scure/base";

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

const api = {
  generateMnemonic: (words = 12) => genMnemonic(wordlist, words === 24 ? 256 : 128),
  validateMnemonic: (m) => {
    try { return valMnemonic(String(m || "").trim().replace(/\s+/g, " "), wordlist); } catch { return false; }
  },
  ethAddressFromMnemonic,
  btcAddressFromMnemonic,
  toChecksumAddress: (a) => toChecksumAddress(String(a).replace(/^0x/, "").toLowerCase()),
  buildEvmTransfer,
  erc20TransferData,
};

if (typeof window !== "undefined") window.EXX_CRYPTO = api;
export default api;
