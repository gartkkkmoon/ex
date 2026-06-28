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
import { bytesToHex } from "@noble/hashes/utils";
import { bech32 } from "@scure/base";

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
};

if (typeof window !== "undefined") window.EXX_CRYPTO = api;
export default api;
