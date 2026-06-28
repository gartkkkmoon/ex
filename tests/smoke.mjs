import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { webcrypto } from "node:crypto";

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

let renderedHtml = "";
const appNode = {
  addEventListener() {},
  set innerHTML(value) {
    renderedHtml = value;
  },
  get innerHTML() {
    return renderedHtml;
  },
};

globalThis.document = {
  title: "",
  querySelector(selector) {
    if (selector === "#app") return appNode;
    return null;
  },
};

globalThis.window = {};
globalThis.setInterval = () => 0;

await import(`${pathToFileURL(new URL("../src/app.js", import.meta.url).pathname).href}?smoke=${Date.now()}`);

assert.match(renderedHtml, /Wallet App/);
assert.match(renderedHtml, /MAIN_BALANCE/);
assert.equal(window.EXX_DEBUG.state.mode, "wallet");

const { computeMainBalance } = await import("../src/services/balanceEngine.js");
assert.equal(computeMainBalance({ confirmed: 100, pendingIncoming: 20, pendingOutgoing: 7 }), 113);

const { EVM_CHAIN_IDS, TOKEN_API_CHAIN_IDS, buildAnkrMultichainUrl, buildAnkrUrl } = await import("../src/services/chains.js");
assert.equal(buildAnkrUrl("ethereum", "token"), "https://rpc.ankr.com/eth/token");
assert.equal(buildAnkrUrl("bsc", "token"), "https://rpc.ankr.com/bsc/token");
assert.equal(buildAnkrUrl("arbitrum", "token"), "https://rpc.ankr.com/arbitrum/token");
assert.equal(buildAnkrMultichainUrl("token"), "https://rpc.ankr.com/multichain/token");
assert.equal(EVM_CHAIN_IDS.includes("base"), true);
assert.equal(EVM_CHAIN_IDS.includes("stellar"), false);
assert.equal(TOKEN_API_CHAIN_IDS.includes("stellar"), true);

const { encryptWalletPreview, decryptWalletPreview } = await import("../src/services/vault.js");
const vault = await encryptWalletPreview({ privateKey: "secret" }, "test-passphrase");
const decrypted = await decryptWalletPreview(vault, "test-passphrase");
assert.equal(vault.algorithm, "AES-256-GCM");
assert.equal(decrypted.privateKey, "secret");

renderedHtml = "";
globalThis.window = {
  EXX_FORCED_DEVICE: "ios",
  innerWidth: 420,
  navigator: { userAgent: "iPhone", platform: "iPhone", maxTouchPoints: 5 },
  addEventListener() {},
};

await import(`${pathToFileURL(new URL("../src/generated/exactAssets.js", import.meta.url).pathname).href}?smoke=${Date.now()}`);
await import(`${pathToFileURL(new URL("../src/exactApp.js", import.meta.url).pathname).href}?smoke=${Date.now()}`);

const exactDebug = window.EXX_EXACT_DEBUG;
exactDebug.exactState.screen = "home";
exactDebug.exactRender();

for (const id of ["bitcoin", "ethereum", "bnb", "xrp", "solana", "tron", "dogecoin", "cardano"]) {
  const token = exactDebug.exactTokens.find((item) => item.id === id);
  assert.ok(token, `missing ${id}`);
  assert.match(exactDebug.exactIcon(token), /has-image/, `${id} should use screenshot-style image badge`);
}

for (const [id, markClass] of Object.entries({
  tether: "brand-tether-mark",
  aave: "brand-aave-ghost",
  stellar: "brand-stellar-mark",
  uniswap: "brand-uniswap-mark",
  chainlink: "brand-chainlink-mark",
  polygon: "brand-polygon-mark",
})) {
  const token = exactDebug.exactTokens.find((item) => item.id === id);
  assert.ok(token, `missing ${id}`);
  const icon = exactDebug.exactIcon(token);
  assert.match(icon, /has-vector/, `${id} should use a custom Exodus-style vector badge`);
  assert.match(icon, new RegExp(markClass), `${id} should use the corrected brand glyph`);
}

console.log("smoke ok");
