const exactRoot = document.querySelector("#app");
const exactAssets = window.EXX_EXACT_ASSETS || {};

function exactDetectedDevice() {
  if (window.EXX_FORCED_DEVICE === "android" || window.EXX_FORCED_DEVICE === "ios") return window.EXX_FORCED_DEVICE;
  try {
    const saved = window.localStorage?.getItem("exx.exact.device");
    if (saved === "android" || saved === "ios") return saved;
  } catch {
    /* storage unavailable */
  }
  const nav = window.navigator || {};
  const userAgent = nav.userAgent || "";
  if (/android/i.test(userAgent)) return "android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  return "android"; // desktop/preview default — focused on Android for now
}

const exactTokens = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    assetKey: "btc",
    tokenKind: "native",
    price: "$59,474.35",
    detailPrice: "$59,488.06",
    change: "-2.6%",
    detailChange: "+0.4%",
    color: "#ffc629",
    icon: "₿",
    networks: [{ id: "bitcoin", label: "Bitcoin", tag: "BTC", feeSymbol: "BTC", address: "bc1qexoduspreviewwallet9h8a2f6r7m4z" }],
    chart: [58, 76, 70, 68, 73, 79, 98, 80, 54, 70, 44, 47, 63, 56, 55, 35, 34, 28, 61, 63, 69, 78],
  },
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    assetKey: "eth",
    tokenKind: "native",
    price: "$1,560.86",
    detailPrice: "$1,562.19",
    change: "-3.5%",
    detailChange: "+0.3%",
    color: "#94a1ff",
    icon: "◆",
    networks: [
      { id: "ethereum", label: "Ethereum", tag: "ETH", feeSymbol: "ETH", address: "0xDe7bbd62f739210C43FF1f6845B55aAeEEaa8289" },
      { id: "arbitrum", label: "Arbitrum One", tag: "ARB1", feeSymbol: "ETH", address: "0xDe7bbd62f739210C43FF1f6845B55aAeEEaa8289" },
      { id: "optimism", label: "Optimism", tag: "OP", feeSymbol: "ETH", address: "0xDe7bbd62f739210C43FF1f6845B55aAeEEaa8289" },
    ],
    chart: [78, 79, 80, 84, 82, 96, 78, 34, 45, 40, 37, 18, 27, 19, 29, 17, 14, 3, 8, 14, 6, 34, 28, 47, 49, 58],
  },
  {
    id: "tether",
    name: "Tether USD",
    symbol: "USDT",
    assetKey: "usdt",
    tokenKind: "token",
    price: "$1.00",
    detailPrice: "$1.0005",
    change: "+0%",
    detailChange: "+0.0%",
    color: "#45c8bb",
    icon: "₮",
    networks: [
      { id: "ethereum", label: "Ethereum", tag: "ETH", feeSymbol: "ETH", address: "0xDe7bbd62f739210C43FF1f6845B55aAeEEaa8289" },
      { id: "bsc", label: "BNB Smart Chain", tag: "BSC", feeSymbol: "BNB", address: "0xDe7bbd62f739210C43FF1f6845B55aAeEEaa8289" },
      { id: "polygon", label: "Polygon", tag: "POL", feeSymbol: "POL", address: "0xDe7bbd62f739210C43FF1f6845B55aAeEEaa8289" },
      { id: "arbitrum", label: "Arbitrum One", tag: "ARB1", feeSymbol: "ETH", address: "0xDe7bbd62f739210C43FF1f6845B55aAeEEaa8289" },
      { id: "optimism", label: "Optimism", tag: "OP", feeSymbol: "ETH", address: "0xDe7bbd62f739210C43FF1f6845B55aAeEEaa8289" },
    ],
    chart: [70, 100, 58, 14, 43, 53, 35, 58, 51, 52, 72, 54, 79, 53, 52, 52, 56, 52, 52, 88, 88, 61, 59, 52, 63, 52, 54, 53, 55],
  },
  {
    id: "usd-coin",
    name: "USD Coin",
    symbol: "USDC",
    tokenKind: "token",
    price: "$1.00",
    change: "+0%",
    color: "#2775ca",
    icon: "$",
    networks: [
      { id: "ethereum", label: "Ethereum", tag: "ETH", feeSymbol: "ETH", address: "0xDe7bbd62f739210C43FF1f6845B55aAeEEaa8289" },
      { id: "polygon", label: "Polygon", tag: "POL", feeSymbol: "POL", address: "0xDe7bbd62f739210C43FF1f6845B55aAeEEaa8289" },
      { id: "bsc", label: "BNB Smart Chain", tag: "BSC", feeSymbol: "BNB", address: "0xDe7bbd62f739210C43FF1f6845B55aAeEEaa8289" },
      { id: "arbitrum", label: "Arbitrum One", tag: "ARB1", feeSymbol: "ETH", address: "0xDe7bbd62f739210C43FF1f6845B55aAeEEaa8289" },
      { id: "optimism", label: "Optimism", tag: "OP", feeSymbol: "ETH", address: "0xDe7bbd62f739210C43FF1f6845B55aAeEEaa8289" },
    ],
    chart: [52, 54, 53, 52, 56, 52, 54, 53, 52, 55, 53, 54, 52],
  },
  {
    id: "bnb",
    name: "BNB",
    symbol: "BNB",
    assetKey: "bnb",
    tokenKind: "native",
    price: "$604.12",
    change: "+1.6%",
    color: "#f3ba2f",
    icon: "◆",
    networks: [{ id: "bsc", label: "BNB Smart Chain", tag: "BSC", feeSymbol: "BNB", address: "0xDe7bbd62f739210C43FF1f6845B55aAeEEaa8289" }],
    chart: [48, 50, 55, 52, 58, 61, 57, 68, 66, 72, 77, 74],
  },
  { id: "xrp", name: "XRP", symbol: "XRP", assetKey: "xrp", tokenKind: "native", price: "$2.13", change: "+3.2%", color: "#15a7d6", icon: "×", networks: [{ id: "xrp", label: "XRP Ledger", tag: "XRP", feeSymbol: "XRP", address: "rExodusPreviewWallet2m2Y2yjNox" }], chart: [40, 48, 44, 59, 55, 68, 64, 70, 66, 76, 72, 80] },
  { id: "solana", name: "Solana", symbol: "SOL", assetKey: "sol", tokenKind: "native", price: "$66.33", change: "-2.3%", color: "#24dfa6", icon: "≋", networks: [{ id: "solana", label: "Solana", tag: "SOL", feeSymbol: "SOL", address: "ExodusPreviewSolana8oZc7wY6mKiVGm" }], chart: [62, 58, 64, 61, 69, 66, 73, 70, 67, 72, 68, 75] },
  { id: "tron", name: "Tron", symbol: "TRX", assetKey: "trx", tokenKind: "native", price: "$0.3235", change: "-1%", color: "#b31d36", icon: "▽", networks: [{ id: "tron", label: "Tron", tag: "TRX", feeSymbol: "TRX", address: "TExodusPreviewWalletRHNfxyJwqk" }], chart: [42, 44, 41, 47, 45, 52, 50, 48, 53, 51, 55, 54] },
  { id: "dogecoin", name: "Dogecoin", symbol: "DOGE", assetKey: "doge", tokenKind: "native", price: "$0.0738", change: "-2.3%", color: "#c7b348", icon: "Ð", networks: [{ id: "dogecoin", label: "Dogecoin", tag: "DOGE", feeSymbol: "DOGE", address: "DExodusPreviewWallet8bd5e6g3" }], chart: [36, 42, 39, 51, 44, 58, 50, 54, 49, 61, 56, 64] },
  { id: "litecoin", name: "Litecoin", symbol: "LTC", assetKey: "ltc", tokenKind: "native", price: "$40.82", change: "+0%", color: "#d7d8dc", icon: "Ł", networks: [{ id: "litecoin", label: "Litecoin", tag: "LTC", feeSymbol: "LTC", address: "ltc1qexoduspreviewwalletc2wjr8" }], chart: [40, 41, 39, 43, 42, 45, 44, 43, 46, 45, 47, 46] },
];

const exactAnkrNetworkIds = [
  "ethereum",
  "polygon",
  "bsc",
  "arbitrum",
  "optimism",
  "base",
  "avalanche",
  "fantom",
  "gnosis",
  "linea",
  "scroll",
  "flare",
  "story",
  "syscoin",
  "taiko",
  "telos",
  "xai",
  "xlayer",
  "stellar",
];

const exactChainFilters = [
  ["main", "Main"],
  ["all", "All"],
  ["tokens", "Tokens"],
  ["ethereum", "ETH"],
  ["polygon", "POL"],
  ["bsc", "BSC"],
  ["arbitrum", "ARB1"],
  ["optimism", "OP"],
  ["base", "BASE"],
  ["avalanche", "AVAX"],
  ["fantom", "FTM"],
  ["gnosis", "GNO"],
  ["linea", "LINEA"],
  ["scroll", "SCR"],
  ["flare", "FLR"],
  ["story", "IP"],
  ["syscoin", "SYS"],
  ["taiko", "TAIKO"],
  ["telos", "TLOS"],
  ["xai", "XAI"],
  ["xlayer", "XLAYER"],
  ["stellar", "XLM"],
  ["bitcoin", "BTC"],
  ["solana", "SOL"],
  ["tron", "TRX"],
  ["xrp", "XRP"],
  ["dogecoin", "DOGE"],
  ["cardano", "ADA"],
  ["litecoin", "LTC"],
  ["hyperevm", "HYPE"],
  ["zcash", "ZEC"],
  ["ton", "TON"],
];

const exactPortfolioHoldings = {
  bitcoin: { amount: "2.90484389", value: 10689.42 },
  ethereum: { amount: "5.2321", value: 8174.76 },
  bnb: { amount: "12.011", value: 7255.04 },
  solana: { amount: "82.55", value: 5476.23 },
  tether: { amount: "4,250", value: 4250 },
  tron: { amount: "4,000", value: 1293.88 },
  dogecoin: { amount: "11,005", value: 812.2 },
  xrp: { amount: "248.37", value: 529.02 },
};

const exactNetworkMeta = {
  ethereum: { label: "Ethereum", tag: "ETH", badge: "◆", color: "#94a1ff" },
  polygon: { label: "Polygon", tag: "POL", badge: "∞", color: "#8247e5" },
  bsc: { label: "BNB Smart Chain", tag: "BSC", badge: "◆", color: "#f3ba2f" },
  arbitrum: { label: "Arbitrum One", tag: "ARB1", badge: "A", color: "#4d8dff" },
  optimism: { label: "Optimism", tag: "OP", badge: "OP", color: "#ff4b5c" },
  bitcoin: { label: "Bitcoin", tag: "BTC", badge: "₿", color: "#ffc629" },
  solana: { label: "Solana", tag: "SOL", badge: "≋", color: "#24dfa6" },
  tron: { label: "Tron", tag: "TRX", badge: "▽", color: "#b31d36" },
  dogecoin: { label: "Dogecoin", tag: "DOGE", badge: "Ð", color: "#c7b348" },
  cardano: { label: "Cardano", tag: "ADA", badge: "✺", color: "#3479f6" },
  litecoin: { label: "Litecoin", tag: "LTC", badge: "Ł", color: "#d7d8dc" },
  xrp: { label: "XRP Ledger", tag: "XRP", badge: "×", color: "#15a7d6" },
};

Object.assign(exactNetworkMeta, {
  base: { label: "Base", tag: "BASE", badge: "B", color: "#4f8dff" },
  avalanche: { label: "Avalanche", tag: "AVAX", badge: "A", color: "#e84142" },
  fantom: { label: "Fantom", tag: "FTM", badge: "F", color: "#1969ff" },
  gnosis: { label: "Gnosis", tag: "GNO", badge: "G", color: "#48a987" },
  linea: { label: "Linea", tag: "LINEA", badge: "L", color: "#72f0b0" },
  scroll: { label: "Scroll", tag: "SCR", badge: "S", color: "#f4d4aa" },
  flare: { label: "Flare", tag: "FLR", badge: "F", color: "#e62058" },
  story: { label: "Story", tag: "IP", badge: "IP", color: "#72e2ff" },
  syscoin: { label: "Syscoin", tag: "SYS", badge: "S", color: "#00a4ff" },
  taiko: { label: "Taiko", tag: "TAIKO", badge: "T", color: "#e81899" },
  telos: { label: "Telos", tag: "TLOS", badge: "T", color: "#7048e8" },
  xai: { label: "Xai", tag: "XAI", badge: "X", color: "#f24a62" },
  xlayer: { label: "X Layer", tag: "XLAYER", badge: "X", color: "#121212" },
  stellar: { label: "Stellar", tag: "XLM", badge: "S", color: "#dce3ef" },
  hyperevm: { label: "HyperEVM", tag: "HYPE", badge: "H", color: "#18d2a3" },
  zcash: { label: "Zcash", tag: "ZEC", badge: "Z", color: "#f4c431" },
  ton: { label: "Toncoin", tag: "TON", badge: "T", color: "#2fb6e8" },
});

const exactPreviewAddress = "0xDe7bbd62f739210C43FF1f6845B55aAeEEaa8289";
const exactEvmTokenNetworks = [
  { id: "ethereum", label: "Ethereum", tag: "ETH", feeSymbol: "ETH", address: exactPreviewAddress },
  { id: "polygon", label: "Polygon", tag: "POL", feeSymbol: "POL", address: exactPreviewAddress },
  { id: "bsc", label: "BNB Smart Chain", tag: "BSC", feeSymbol: "BNB", address: exactPreviewAddress },
  { id: "arbitrum", label: "Arbitrum One", tag: "ARB1", feeSymbol: "ETH", address: exactPreviewAddress },
  { id: "optimism", label: "Optimism", tag: "OP", feeSymbol: "ETH", address: exactPreviewAddress },
  { id: "base", label: "Base", tag: "BASE", feeSymbol: "ETH", address: exactPreviewAddress },
  { id: "avalanche", label: "Avalanche", tag: "AVAX", feeSymbol: "AVAX", address: exactPreviewAddress },
];

function exactMergeTokenNetworks(tokenId, networks) {
  const token = exactTokens.find((item) => item.id === tokenId);
  if (!token) return;
  const seen = new Set(token.networks.map((network) => network.id));
  token.networks.push(...networks.filter((network) => !seen.has(network.id)));
}

// Major assets only. tether/usd-coin already declare their EVM networks inline
// (Ethereum, BSC, Polygon, Arbitrum, Optimism — the ones we hold token
// contracts for), so no extra network merging is needed.
Object.assign(exactPortfolioHoldings, {
  "usd-coin": { amount: "1,200", value: 1200 },
});

const exactInitialTransactions = [
  {
    id: "tx-pending-usdt-in",
    token: "tether",
    network: "ethereum",
    direction: "incoming",
    status: "pending",
    amount: "+850 USDT",
    value: "$850.00",
    title: "Received",
    day: "Pending",
    time: "Pending",
    address: "0x9858EfFD232B4033E47d90003D41EC34EcaEda94",
    hash: "0x77c1a9b2e2f0e2d4a31188377aa4698a99f3cb932a512f581d44ac9dcad7a01",
  },
  {
    id: "tx-pending-btc-in",
    token: "bitcoin",
    network: "bitcoin",
    direction: "incoming",
    status: "pending",
    amount: "+0.0125 BTC",
    value: "$743.61",
    title: "Received",
    day: "Pending",
    time: "Pending",
    address: "bc1qexoduspreviewwallet9h8a2f6r7m4z",
    hash: "0x5fbd6c0b3a92e2d4a31188377aa4698a99f3cb932a512f581d44ac9dcadb7c2",
  },
  {
    id: "tx-pending-eth-out",
    token: "ethereum",
    network: "ethereum",
    direction: "outgoing",
    status: "pending",
    amount: "-0.0414 ETH",
    value: "$64.75",
    title: "Sent",
    day: "Pending",
    time: "Pending",
    hash: "0xa3f49b299ce7f04d8e861188377aa4698a99f3cb932a512f581d44ac9dcad001",
  },
  {
    id: "tx-pending-eth",
    token: "ethereum",
    network: "ethereum",
    direction: "incoming",
    status: "pending",
    amount: "+0.0825 ETH",
    value: "$128.90",
    title: "Received",
    day: "Pending",
    time: "Pending",
    hash: "0x15a96890e29f22a08d175ccb681aef3208e5be38209abef159f200bd70ad0002",
  },
  {
    id: "tx-received-eth",
    token: "ethereum",
    network: "ethereum",
    direction: "incoming",
    status: "confirmed",
    amount: "+0.214 ETH",
    value: "$334.24",
    title: "Received",
    day: "Yesterday",
    time: "16:42:10 EST",
    hash: "0x4c7a6890e29f22a08d175ccb681aef3208e5be38209abef159f200bd70ad0005",
  },
  {
    id: "tx-sent-eth",
    token: "ethereum",
    network: "ethereum",
    direction: "outgoing",
    status: "confirmed",
    amount: "-0.075 ETH",
    value: "$117.16",
    title: "Sent",
    day: "Yesterday",
    time: "11:08:55 EST",
    hash: "0x7d5e299ce7f04d8e861188377aa4698a99f3cb932a512f581d44ac9dcad006",
  },
  {
    id: "tx-confirmed-btc",
    token: "bitcoin",
    network: "bitcoin",
    direction: "incoming",
    status: "confirmed",
    amount: "+0.03940246 BTC",
    value: "$141.86",
    title: "Received",
    day: "Yesterday",
    time: "15:01:18 EST",
    hash: "0x29ee8a161127120d13f8232cd932248c601da359133a12f4884a1b009dbe0003",
  },
  {
    id: "tx-usdt",
    token: "tether",
    network: "ethereum",
    direction: "incoming",
    status: "pending",
    amount: "+42 USDT",
    value: "$42.00",
    title: "Received",
    day: "Pending",
    time: "Pending",
    hash: "0xb1192a79d227913d62b7f22139fc4120ee51d2da894fa8875de50a6f6fed0004",
  },
  {
    id: "tx-bnb-failed",
    token: "bnb",
    network: "bsc",
    direction: "outgoing",
    status: "confirmed",
    amount: "-0.35 BNB",
    value: "$211.44",
    title: "Sent",
    day: "Today",
    time: "09:42:04 EST",
    hash: "0x5be90d22d338dc640c740534ff1f2dc39dd9fc784802117d98deca000005",
  },
  {
    id: "tx-sol-confirmed",
    token: "solana",
    network: "solana",
    direction: "incoming",
    status: "confirmed",
    amount: "+1.25 SOL",
    value: "$82.91",
    title: "Received",
    day: "Yesterday",
    time: "12:30:19 EST",
    hash: "0x2c3a433bbfcf517471ffbda006",
  },
];

const exactState = {
  preview: "mobile",
  device: exactDetectedDevice(),
  screen: "landing",
  selected: "ethereum",
  landingSlide: 0,
  assetSearch: "",
  expandedAsset: "ethereum",
  onboardingMode: "",
  passwordSet: false,
  sendAmount: "",
  sendTo: "",
  toast: "",
  activeRange: "LIVE",
  returnToScreen: "",
  screenHistory: [],
  holdingsSort: "highest",
  showHoldingsSort: false,
  collapsedAssets: new Set(),
  transactions: exactInitialTransactions.map((transaction) => ({ ...transaction })),
  assetFilter: "main",
  selectedNetworkByToken: {
    bitcoin: "bitcoin",
    ethereum: "ethereum",
    tether: "ethereum",
    "usd-coin": "ethereum",
    dai: "ethereum",
    "wrapped-bitcoin": "ethereum",
    chainlink: "ethereum",
    polygon: "polygon",
    bnb: "bsc",
    arbitrum: "arbitrum",
    optimism: "optimism",
    xrp: "xrp",
    solana: "solana",
    tron: "tron",
    dogecoin: "dogecoin",
    cardano: "cardano",
    litecoin: "litecoin",
    xocash: "ethereum",
    "base-eth": "base",
    avalanche: "avalanche",
    fantom: "fantom",
    gnosis: "gnosis",
    "linea-eth": "linea",
    "scroll-eth": "scroll",
    flare: "flare",
    story: "story",
    syscoin: "syscoin",
    taiko: "taiko",
    telos: "telos",
    xai: "xai",
    xlayer: "xlayer",
    stellar: "stellar",
    "hyper-evm": "hyperevm",
    zcash: "zcash",
    toncoin: "ton",
    uniswap: "ethereum",
    aave: "ethereum",
    "shiba-inu": "ethereum",
    pepe: "ethereum",
    render: "ethereum",
    "the-graph": "ethereum",
    "paypal-usd": "ethereum",
    "euro-coin": "ethereum",
  },
  // Only major assets are enabled by default; everything else is added from
  // the "Add More" / asset manager.
  enabledNetworkKeys: new Set([
    "bitcoin:bitcoin",
    "ethereum:ethereum",
    "tether:ethereum",
    "usd-coin:ethereum",
    "bnb:bsc",
    "solana:solana",
    "xrp:xrp",
    "tron:tron",
    "dogecoin:dogecoin",
    "litecoin:litecoin",
  ]),
  restorePhrase: "",
  restoreAddress: "",
  generatedMnemonic: "",
  restoreResolvedAddress: "",
  // PIN lock state
  locked: false,
  pinMode: "", // "set" | "unlock" | "send"
  pinStage: "", // "first" | "confirm" (during set)
  pinEntry: "",
  pinFirst: "",
  pinError: "",
  pendingSend: null,
  selectedTx: "",
};

const EXACT_PIN_LENGTH = 6;

// ---------------------------------------------------------------------------
// Live wallet runtime (self-contained, no ES imports so the inline bundle works)
// ---------------------------------------------------------------------------
const EXACT_RUNTIME_KEY = "exx.exact.runtime.v1";

const exactRuntime = {
  mode: "preview", // "preview" (placeholder demo data) | "live" (real Ankr balances)
  address: "",
  btcAddress: "",
  solAddress: "",
  xrpAddress: "",
  trxAddress: "",
  dogeAddress: "",
  ltcAddress: "",
  ankrToken: "",
  unlocked: false,
  holdings: {}, // tokenId -> { amount: string, value: number }
  totalUsd: 0,
  status: "",
  error: "",
  loading: false,
  pinSalt: "",
  pinHash: "",
  encryptedSeed: null, // { iv, cipher } — mnemonic encrypted under the PIN (AES-GCM)
};

function exactHasPin() {
  return Boolean(exactRuntime.pinHash && exactRuntime.pinSalt);
}

function exactBytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function exactHexToBytes(hex) {
  const out = new Uint8Array(Math.floor(String(hex).length / 2));
  for (let i = 0; i < out.length; i += 1) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

// Derive a PBKDF2 verifier from the PIN. The PIN itself is never stored — only
// a salted hash, so it can't be read back from localStorage.
async function exactDerivePin(pin, saltHex) {
  const cryptoObj = window.crypto || globalThis.crypto;
  const subtle = cryptoObj && cryptoObj.subtle;
  const salt = saltHex ? exactHexToBytes(saltHex) : cryptoObj.getRandomValues(new Uint8Array(16));
  if (!subtle) {
    // Extremely degraded fallback (no SubtleCrypto) — still salted, not plaintext.
    return { salt: exactBytesToHex(salt), hash: exactBytesToHex(salt) + String(pin).length };
  }
  const keyMaterial = await subtle.importKey("raw", new TextEncoder().encode(String(pin)), "PBKDF2", false, ["deriveBits"]);
  const bits = await subtle.deriveBits({ name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" }, keyMaterial, 256);
  return { salt: exactBytesToHex(salt), hash: exactBytesToHex(new Uint8Array(bits)) };
}

async function exactSetPin(pin) {
  const { salt, hash } = await exactDerivePin(pin);
  exactRuntime.pinSalt = salt;
  exactRuntime.pinHash = hash;
  exactPersistRuntime();
}

async function exactVerifyPin(pin) {
  if (!exactHasPin()) return true;
  const { hash } = await exactDerivePin(pin, exactRuntime.pinSalt);
  return hash === exactRuntime.pinHash;
}

function exactHasEncryptedSeed() {
  return Boolean(exactRuntime.encryptedSeed && exactRuntime.encryptedSeed.iv && exactRuntime.encryptedSeed.cipher);
}

// Derive an AES-GCM key from the PIN (PBKDF2, reusing the PIN salt). The seed is
// only ever held in memory transiently at send time — never persisted in clear.
async function exactDeriveSeedKey(pin, saltHex) {
  const cryptoObj = window.crypto || globalThis.crypto;
  const subtle = cryptoObj && cryptoObj.subtle;
  if (!subtle || !saltHex) return null;
  const keyMaterial = await subtle.importKey("raw", new TextEncoder().encode(String(pin)), "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey(
    { name: "PBKDF2", salt: exactHexToBytes(saltHex), iterations: 120000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function exactEncryptSeed(mnemonic, pin) {
  const cryptoObj = window.crypto || globalThis.crypto;
  const subtle = cryptoObj && cryptoObj.subtle;
  if (!subtle || !mnemonic || !exactRuntime.pinSalt) return;
  try {
    const key = await exactDeriveSeedKey(pin, exactRuntime.pinSalt);
    const iv = cryptoObj.getRandomValues(new Uint8Array(12));
    const cipher = await subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(String(mnemonic).trim()));
    exactRuntime.encryptedSeed = { iv: exactBytesToHex(iv), cipher: exactBytesToHex(new Uint8Array(cipher)) };
    exactPersistRuntime();
  } catch (error) {
    console.error("[exx] seed encrypt failed:", error);
  }
}

async function exactDecryptSeed(pin) {
  const cryptoObj = window.crypto || globalThis.crypto;
  const subtle = cryptoObj && cryptoObj.subtle;
  const enc = exactRuntime.encryptedSeed;
  if (!subtle || !exactHasEncryptedSeed() || !exactRuntime.pinSalt) return "";
  try {
    const key = await exactDeriveSeedKey(pin, exactRuntime.pinSalt);
    const plain = await subtle.decrypt({ name: "AES-GCM", iv: exactHexToBytes(enc.iv) }, key, exactHexToBytes(enc.cipher));
    return new TextDecoder().decode(plain).trim();
  } catch (error) {
    console.error("[exx] seed decrypt failed:", error);
    return "";
  }
}

function exactIsLive() {
  return exactRuntime.mode === "live";
}

function exactValidEvmAddress(value) {
  return /^0x[0-9a-fA-F]{40}$/.test(String(value || "").trim());
}

function exactRandomEvmAddress() {
  const source = window.crypto || globalThis.crypto;
  const bytes = source?.getRandomValues?.(new Uint8Array(20));
  if (!bytes) return `0x${"0".repeat(40)}`;
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function exactPersistRuntime() {
  try {
    window.localStorage?.setItem(EXACT_RUNTIME_KEY, JSON.stringify({
      mode: exactRuntime.mode,
      address: exactRuntime.address,
      btcAddress: exactRuntime.btcAddress,
      solAddress: exactRuntime.solAddress,
      xrpAddress: exactRuntime.xrpAddress,
      trxAddress: exactRuntime.trxAddress,
      dogeAddress: exactRuntime.dogeAddress,
      ltcAddress: exactRuntime.ltcAddress,
      ankrToken: exactRuntime.ankrToken,
      unlocked: exactRuntime.unlocked,
      holdings: exactRuntime.holdings,
      totalUsd: exactRuntime.totalUsd,
      pinSalt: exactRuntime.pinSalt,
      pinHash: exactRuntime.pinHash,
      encryptedSeed: exactRuntime.encryptedSeed,
    }));
  } catch {
    /* storage unavailable (private mode / SSR smoke) — keep in-memory only */
  }
}

function exactRestoreRuntime() {
  let saved;
  try {
    const raw = window.localStorage?.getItem(EXACT_RUNTIME_KEY);
    if (!raw) return;
    saved = JSON.parse(raw);
  } catch {
    return;
  }
  if (!saved || typeof saved !== "object") return;
  exactRuntime.mode = saved.mode === "live" ? "live" : "preview";
  exactRuntime.address = saved.address || "";
  exactRuntime.btcAddress = saved.btcAddress || "";
  exactRuntime.solAddress = saved.solAddress || "";
  exactRuntime.xrpAddress = saved.xrpAddress || "";
  exactRuntime.trxAddress = saved.trxAddress || "";
  exactRuntime.dogeAddress = saved.dogeAddress || "";
  exactRuntime.ltcAddress = saved.ltcAddress || "";
  exactRuntime.ankrToken = saved.ankrToken || "";
  exactRuntime.unlocked = Boolean(saved.unlocked);
  exactRuntime.holdings = saved.holdings && typeof saved.holdings === "object" ? saved.holdings : {};
  exactRuntime.totalUsd = Number(saved.totalUsd) || 0;
  exactRuntime.pinSalt = saved.pinSalt || "";
  exactRuntime.pinHash = saved.pinHash || "";
  exactRuntime.encryptedSeed = saved.encryptedSeed && saved.encryptedSeed.cipher ? saved.encryptedSeed : null;
  if (exactRuntime.mode === "live") {
    // Don't show demo activity in a restored live wallet.
    exactState.transactions = [];
  }
  if (exactRuntime.unlocked) {
    exactState.passwordSet = true;
    if (exactHasPin()) {
      // Returning user with a PIN: lock until they enter it.
      exactState.locked = true;
      exactState.pinMode = "unlock";
      exactState.pinEntry = "";
      exactState.screen = "pin";
    } else {
      exactState.screen = "home";
    }
  }
}

// Ankr Advanced API (multichain) — public endpoint works without a key for light use,
// and `/multichain/<token>` is used when a key is provided.
// Balances are fetched from our own serverless endpoint (/api/balances), which
// holds the Ankr API key in a server env var (ANKR_API_KEY). The key is never
// shipped to the browser.
async function exactAnkrAccountBalance(address) {
  const response = await fetch(`/api/balances?address=${encodeURIComponent(address)}`, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Balance API HTTP ${response.status}`);
  const data = await response.json();
  return {
    totalUsd: Number(data.totalUsd) || 0,
    assets: Array.isArray(data.assets) ? data.assets : [],
  };
}

function exactFormatAmount(amount) {
  if (!Number.isFinite(amount) || amount === 0) return "0";
  const maximumFractionDigits = amount >= 1 ? 4 : 8;
  return amount.toLocaleString("en-US", { maximumFractionDigits });
}

function exactApplyLiveBalances({ assets }) {
  const bySymbol = new Map();
  for (const item of assets || []) {
    const symbol = String(item.tokenSymbol || item.symbol || "").toUpperCase();
    if (!symbol) continue;
    const amount = Number(item.balance || item.tokenBalance || 0) || 0;
    const valueUsd = Number(item.balanceUsd || item.balanceUSD || 0) || 0;
    const previous = bySymbol.get(symbol) || { amount: 0, value: 0 };
    bySymbol.set(symbol, { amount: previous.amount + amount, value: previous.value + valueUsd });
  }
  const holdings = {};
  const assigned = new Set();
  for (const token of exactTokens) {
    const symbol = token.symbol.toUpperCase();
    if (assigned.has(symbol)) continue; // sum a symbol once, under its primary asset
    const aggregate = bySymbol.get(symbol);
    if (aggregate && aggregate.amount > 0) {
      holdings[token.id] = { amount: exactFormatAmount(aggregate.amount), value: aggregate.value };
      assigned.add(symbol);
    }
  }
  exactRuntime.holdings = holdings;
  exactRuntime.totalUsd = Object.values(holdings).reduce((sum, entry) => sum + (entry.value || 0), 0);
}

async function exactSyncLiveBalances() {
  if (!exactIsLive() || !exactRuntime.address) return;
  exactRuntime.loading = true;
  exactRuntime.status = "Syncing balances from Ankr…";
  exactRuntime.error = "";
  exactRender();
  try {
    const data = await exactAnkrAccountBalance(exactRuntime.address);
    exactApplyLiveBalances(data);
    exactRuntime.status = `Synced ${exactShortHash(exactRuntime.address)}`;
    exactRuntime.error = "";
  } catch (error) {
    // Keep provider errors backend-only — never surfaced to the user.
    console.error("[exx] Ankr balance sync failed:", error);
    exactRuntime.error = "";
    exactRuntime.status = `Live · ${exactShortHash(exactRuntime.address)}`;
  } finally {
    exactRuntime.loading = false;
    exactPersistRuntime();
    exactRender();
  }
  exactFetchChainBalances();
  exactFetchPending();
}

// Native balances for the non-EVM chains (BTC, SOL, XRP, LTC, DOGE, TRX),
// which Ankr's EVM token API doesn't cover. Merged into holdings so received
// funds actually show up. Runs after the Ankr sync (which rebuilds holdings).
async function exactFetchChainBalances() {
  if (!exactIsLive()) return;
  const params = new URLSearchParams();
  if (exactRuntime.btcAddress) params.set("btc", exactRuntime.btcAddress);
  if (exactRuntime.solAddress) params.set("sol", exactRuntime.solAddress);
  if (exactRuntime.xrpAddress) params.set("xrp", exactRuntime.xrpAddress);
  if (exactRuntime.ltcAddress) params.set("ltc", exactRuntime.ltcAddress);
  if (exactRuntime.dogeAddress) params.set("doge", exactRuntime.dogeAddress);
  if (exactRuntime.trxAddress) params.set("trx", exactRuntime.trxAddress);
  if (!Array.from(params).length) return;
  let balances = [];
  try {
    const res = await fetch(`/api/chainbalances?${params.toString()}`, { headers: { accept: "application/json" } });
    if (!res.ok) return;
    const data = await res.json();
    balances = Array.isArray(data.balances) ? data.balances : [];
  } catch (error) {
    console.error("[exx] chain balances failed:", error);
    return;
  }
  let changed = false;
  for (const item of balances) {
    const token = exactTokens.find((entry) => entry.id === item.token);
    if (!token) continue;
    const amount = Number(item.amount) || 0;
    if (amount > 0) {
      exactRuntime.holdings[token.id] = { amount: exactFormatAmount(amount), value: amount * exactTokenPriceNumber(token) };
      changed = true;
    } else if (exactRuntime.holdings[token.id]) {
      delete exactRuntime.holdings[token.id];
      changed = true;
    }
  }
  if (changed) {
    exactRuntime.totalUsd = Object.values(exactRuntime.holdings).reduce((sum, entry) => sum + (entry.value || 0), 0);
    exactPersistRuntime();
    exactRender();
  }
}

// Pull unconfirmed (mempool) incoming transfers and reconcile them into the
// activity list as pending receives. Confirmed/dropped ones fall out of the
// feed and are removed automatically.
async function exactFetchPending() {
  if (!exactIsLive() || !exactRuntime.address) return;
  let list = [];
  try {
    const params = new URLSearchParams({ address: exactRuntime.address });
    if (exactRuntime.btcAddress) params.set("btc", exactRuntime.btcAddress);
    const res = await fetch(`/api/pending?${params.toString()}`, { headers: { accept: "application/json" } });
    if (!res.ok) return;
    const data = await res.json();
    list = Array.isArray(data.pending) ? data.pending : [];
  } catch (error) {
    console.error("[exx] pending fetch failed:", error);
    return;
  }
  if (exactApplyPending(list)) exactRender();
}

function exactApplyPending(list) {
  const feedHashes = new Set(list.map((item) => item && item.hash).filter(Boolean));
  const before = exactState.transactions.length;
  // Drop mempool entries that are no longer unconfirmed.
  exactState.transactions = exactState.transactions.filter(
    (tx) => !String(tx.id).startsWith("mempool-") || feedHashes.has(tx.hash),
  );
  const known = new Set(exactState.transactions.map((tx) => tx.hash));
  for (const item of list) {
    if (!item || !item.hash || known.has(item.hash)) continue;
    const token = exactTokens.find((entry) => entry.id === item.token);
    if (!token) continue;
    const amountNum = Number(item.amount) || 0;
    if (amountNum <= 0) continue;
    exactState.transactions.unshift({
      id: `mempool-${item.hash}`,
      token: token.id,
      network: item.network || token.id,
      direction: "incoming",
      status: "pending",
      amount: `+${exactFormatAmount(amountNum)} ${token.symbol}`,
      value: exactFormatUsd(amountNum * exactTokenPriceNumber(token)),
      title: "Received",
      day: "Pending",
      time: "Pending",
      address: exactReceiveAddress(token),
      createdAt: Date.now(),
      hash: item.hash,
    });
    known.add(item.hash);
  }
  return exactState.transactions.length !== before;
}

function exactClearChainAddresses() {
  exactRuntime.btcAddress = "";
  exactRuntime.solAddress = "";
  exactRuntime.xrpAddress = "";
  exactRuntime.trxAddress = "";
  exactRuntime.ltcAddress = "";
  exactRuntime.dogeAddress = "";
}

function exactEnterLiveWallet(address) {
  exactRuntime.mode = "live";
  exactRuntime.address = address;
  exactClearChainAddresses();
  exactRuntime.unlocked = true;
  exactRuntime.holdings = {};
  exactRuntime.totalUsd = 0;
  // A live wallet shows only its real activity (sends + mempool receives).
  exactState.transactions = [];
  exactPersistRuntime();
}

function exactEnterPreviewWallet() {
  exactRuntime.mode = "preview";
  exactClearChainAddresses();
  exactRuntime.unlocked = true;
  exactRuntime.error = "";
  exactRuntime.status = "";
  exactState.transactions = exactInitialTransactions.map((transaction) => ({ ...transaction }));
  exactPersistRuntime();
}

function exactResetWallet() {
  exactRuntime.mode = "preview";
  exactRuntime.address = "";
  exactClearChainAddresses();
  exactRuntime.unlocked = false;
  exactRuntime.holdings = {};
  exactRuntime.totalUsd = 0;
  exactRuntime.status = "";
  exactRuntime.error = "";
  exactRuntime.pinSalt = "";
  exactRuntime.pinHash = "";
  exactRuntime.encryptedSeed = null;
  exactState.passwordSet = false;
  exactState.restoreAddress = "";
  exactState.restorePhrase = "";
  exactState.generatedMnemonic = "";
  exactState.locked = false;
  exactState.pinMode = "";
  exactState.pinStage = "";
  exactState.pinEntry = "";
  exactState.pinFirst = "";
  exactState.pinError = "";
  exactState.pendingSend = null;
  try {
    window.localStorage?.removeItem(EXACT_RUNTIME_KEY);
  } catch {
    /* ignore */
  }
}

// Derive + store the native-segwit BTC address from a mnemonic, if we have one.
function exactDeriveBtcAddress(mnemonic) {
  const crypto = exactCrypto();
  if (!crypto || !crypto.btcAddressFromMnemonic) return "";
  try { return crypto.btcAddressFromMnemonic(mnemonic); } catch { return ""; }
}

// Derive every supported chain's real address from the recovery phrase and
// store it on the runtime (all standard, interoperable derivation paths).
function exactDeriveAllAddresses(mnemonic) {
  const crypto = exactCrypto();
  if (!crypto || !mnemonic) return;
  const tryDerive = (fn) => { try { return fn ? fn(mnemonic) : ""; } catch { return ""; } };
  exactRuntime.btcAddress = tryDerive(crypto.btcAddressFromMnemonic);
  exactRuntime.solAddress = tryDerive(crypto.solAddressFromMnemonic);
  exactRuntime.xrpAddress = tryDerive(crypto.xrpAddressFromMnemonic);
  exactRuntime.trxAddress = tryDerive(crypto.tronAddressFromMnemonic);
  exactRuntime.dogeAddress = tryDerive(crypto.dogeAddressFromMnemonic);
  exactRuntime.ltcAddress = tryDerive(crypto.ltcAddressFromMnemonic);
}

// Finalize onboarding once a PIN is set (mirrors the old "Open wallet" step).
// When a PIN is supplied and we hold the recovery phrase, the seed is encrypted
// under the PIN so real sends can be signed later.
async function exactFinalizeOnboarding(pin) {
  let mnemonic = "";
  if (exactState.onboardingMode === "restore") {
    exactEnterLiveWallet(exactState.restoreResolvedAddress);
    if (exactCrypto()?.validateMnemonic(exactState.restorePhrase)) mnemonic = exactState.restorePhrase.trim();
    exactState.toast = "Wallet restored";
  } else if (exactState.onboardingMode === "create") {
    mnemonic = exactState.generatedMnemonic;
    const address = exactResolveRestore(mnemonic) || exactRandomEvmAddress();
    exactEnterLiveWallet(address);
    exactState.toast = "Wallet ready";
  } else {
    exactEnterPreviewWallet();
    exactState.toast = "Wallet ready";
  }
  if (mnemonic) {
    exactDeriveAllAddresses(mnemonic);
    if (pin) await exactEncryptSeed(mnemonic, pin);
    exactPersistRuntime();
  }
  exactState.passwordSet = true;
  exactState.locked = false;
  exactState.screen = "home";
}

function exactStartPinSetup() {
  exactState.pinMode = "set";
  exactState.pinStage = "first";
  exactState.pinEntry = "";
  exactState.pinFirst = "";
  exactState.pinError = "";
  exactState.screen = "pin";
}

function exactLockWallet() {
  if (!exactHasPin()) return;
  exactState.locked = true;
  exactState.pinMode = "unlock";
  exactState.pinStage = "";
  exactState.pinEntry = "";
  exactState.pinFirst = "";
  exactState.pinError = "";
  exactState.screen = "pin";
}

function exactRecordSentTx({ token, networkId, amount, to, hash, fee }) {
  const feeSymbol = exactNetworkFeeSymbol(token);
  const tx = {
    id: `sent-${hash}`,
    token: token.id,
    network: networkId,
    direction: "outgoing",
    status: "pending",
    amount: `-${amount} ${token.symbol}`,
    value: exactFormatUsd((Number(amount) || 0) * exactTokenPriceNumber(token)),
    fee: fee || `0.000029 ${feeSymbol}`,
    address: to,
    title: "Sent",
    day: "Pending",
    time: "Pending",
    createdAt: Date.now(),
    hash,
  };
  exactState.transactions.unshift(tx);
  return tx;
}

async function exactCompleteSend(pin) {
  const pending = exactState.pendingSend;
  if (!pending) return;
  const token = exactTokens.find((item) => item.id === pending.tokenId) || exactToken();
  const network = exactNetworks(token).find((item) => item.id === pending.networkId) || exactSelectedNetwork(token);

  // Real on-chain send: live wallet, EVM network, PIN-encrypted seed available.
  if (exactIsLive() && exactRuntime.address && exactHasEncryptedSeed() && EXACT_EVM_CHAIN_IDS[network.id]) {
    exactState.pendingSend = null;
    exactState.sendAmount = "";
    exactState.sendTo = "";
    exactState.selected = token.id;
    exactState.screen = "txdetail";
    exactState.selectedTx = "";
    exactRuntime.loading = true;
    exactState.toast = "Broadcasting transaction…";
    exactRender();
    try {
      const result = await exactSendEvm({ pin, token, network, amount: pending.amount, to: pending.to });
      const tx = exactRecordSentTx({ token, networkId: network.id, amount: pending.amount, to: pending.to, hash: result.hash, fee: result.fee });
      exactState.selectedTx = tx.id;
      exactState.screen = "txdetail";
      exactRuntime.loading = false;
      exactState.toast = "Sent · Pending confirmation";
      exactRender();
      setTimeout(() => { exactSyncLiveBalances(); }, 4000);
    } catch (error) {
      console.error("[exx] send failed:", error);
      exactRuntime.loading = false;
      exactState.screen = "send";
      exactState.toast = "Couldn't send — check the amount, gas and network";
      exactRender();
    }
    return;
  }

  // Live BTC sending isn't wired yet — be honest rather than fake a txid.
  if (exactIsLive() && network.id === "bitcoin") {
    exactState.pendingSend = null;
    exactState.toast = "Bitcoin sending is coming soon";
    exactRender();
    return;
  }

  // Live EVM but watch-only (restored from a public address — no seed to sign).
  if (exactIsLive() && EXACT_EVM_CHAIN_IDS[network.id] && !exactHasEncryptedSeed()) {
    exactState.pendingSend = null;
    exactState.toast = "Watch-only wallet — re-import your recovery phrase to send";
    exactRender();
    return;
  }

  // Any other live network is not signable here — never fake a transaction.
  if (exactIsLive()) {
    exactState.pendingSend = null;
    exactState.toast = `Sending ${token.symbol} on ${network.label} isn't available yet`;
    exactRender();
    return;
  }

  // Preview/demo fallback (placeholder pending entry).
  const tx = exactRecordSentTx({
    token,
    networkId: network.id,
    amount: pending.amount,
    to: pending.to,
    hash: `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2).padEnd(30, "0")}`,
  });
  exactState.pendingSend = null;
  exactState.sendAmount = "";
  exactState.sendTo = "";
  exactState.selected = token.id;
  exactState.selectedTx = tx.id;
  exactState.screen = "txdetail";
  exactState.toast = "Transaction signed · Pending";
  exactRender();
}

// Drives the 6-digit keypad for set / unlock / send-confirm.
async function exactHandlePinComplete() {
  const entry = exactState.pinEntry;
  if (exactState.pinMode === "unlock") {
    const okPin = await exactVerifyPin(entry);
    if (!okPin) {
      exactState.pinEntry = "";
      exactState.pinError = "Wrong PIN, try again";
      exactRender();
      return;
    }
    exactState.locked = false;
    exactState.pinEntry = "";
    exactState.pinError = "";
    exactState.pinMode = "";
    exactState.screen = "home";
    exactRender();
    if (exactIsLive() && exactRuntime.unlocked) exactSyncLiveBalances();
    return;
  }
  if (exactState.pinMode === "send") {
    const okPin = await exactVerifyPin(entry);
    if (!okPin) {
      exactState.pinEntry = "";
      exactState.pinError = "Wrong PIN, try again";
      exactRender();
      return;
    }
    exactState.pinEntry = "";
    exactState.pinError = "";
    exactState.pinMode = "";
    await exactCompleteSend(entry);
    return;
  }
  // set mode
  if (exactState.pinStage !== "confirm") {
    exactState.pinFirst = entry;
    exactState.pinStage = "confirm";
    exactState.pinEntry = "";
    exactState.pinError = "";
    exactRender();
    return;
  }
  if (entry !== exactState.pinFirst) {
    exactState.pinStage = "first";
    exactState.pinFirst = "";
    exactState.pinEntry = "";
    exactState.pinError = "PINs didn't match — start again";
    exactRender();
    return;
  }
  await exactSetPin(entry);
  exactState.pinEntry = "";
  exactState.pinFirst = "";
  exactState.pinStage = "";
  exactState.pinMode = "";
  await exactFinalizeOnboarding(entry);
  exactRender();
  if (exactIsLive()) exactSyncLiveBalances();
}

function exactCrypto() {
  return (typeof window !== "undefined" && window.EXX_CRYPTO) || null;
}

// Real BIP39 phrase (interoperable with other wallets); falls back to demo
// words only if the crypto bundle somehow failed to load.
function exactNewMnemonic() {
  const crypto = exactCrypto();
  if (crypto) {
    try { return crypto.generateMnemonic(12); } catch { /* fall through */ }
  }
  return exactSeedWords.join(" ");
}

function exactMnemonicWords(mnemonic) {
  return String(mnemonic || "").trim().split(/\s+/).filter(Boolean);
}

// Resolve a restore input (recovery phrase OR public 0x address) to an address.
function exactResolveRestore(input) {
  const value = String(input || "").trim().replace(/\s+/g, " ");
  if (/^0x[0-9a-fA-F]{40}$/.test(value)) return value;
  const crypto = exactCrypto();
  const words = value.split(" ").filter(Boolean);
  if (crypto && (words.length === 12 || words.length === 24) && crypto.validateMnemonic(value)) {
    try { return crypto.ethAddressFromMnemonic(value); } catch { return ""; }
  }
  return "";
}

const exactSeedWords = [
  "orbit",
  "velvet",
  "harbor",
  "signal",
  "ripple",
  "anchor",
  "planet",
  "ember",
  "castle",
  "voyage",
  "silver",
  "matrix",
];

function exactToken() {
  return exactTokens.find((token) => token.id === exactState.selected) || exactTokens[1];
}

function exactNetworks(token) {
  return token.networks?.length ? token.networks : [{ id: token.id, label: token.name, tag: token.symbol, feeSymbol: token.symbol }];
}

function exactNetworkKey(tokenId, networkId) {
  return `${tokenId}:${networkId}`;
}

function exactEnabledNetworks(token) {
  return exactNetworks(token).filter((network) => exactState.enabledNetworkKeys.has(exactNetworkKey(token.id, network.id)));
}

function exactTokenEnabled(token) {
  return exactEnabledNetworks(token).length > 0;
}

function exactSelectedNetwork(token = exactToken()) {
  const networks = exactNetworks(token);
  const selected = exactState.selectedNetworkByToken[token.id];
  return networks.find((network) => network.id === selected)
    || exactEnabledNetworks(token)[0]
    || networks[0];
}

function exactSetSelectedNetwork(tokenId, networkId) {
  exactState.selectedNetworkByToken[tokenId] = networkId;
}

function exactToggleNetwork(token, network) {
  const key = exactNetworkKey(token.id, network.id);
  if (exactState.enabledNetworkKeys.has(key)) {
    if (exactState.selectedNetworkByToken[token.id] !== network.id) {
      exactSetSelectedNetwork(token.id, network.id);
      exactState.toast = `${token.symbol} switched to ${network.label}`;
      return;
    }
    exactState.enabledNetworkKeys.delete(key);
    const remaining = exactEnabledNetworks(token);
    if (exactState.selectedNetworkByToken[token.id] === network.id) {
      exactSetSelectedNetwork(token.id, (remaining[0] || exactNetworks(token)[0]).id);
    }
    exactState.toast = `${token.symbol} removed on ${network.label}`;
  } else {
    exactState.enabledNetworkKeys.add(key);
    exactSetSelectedNetwork(token.id, network.id);
    exactState.toast = `${token.symbol} added on ${network.label}`;
  }
}

function exactToggleEnabledNetwork(token, network) {
  const key = exactNetworkKey(token.id, network.id);
  if (exactState.enabledNetworkKeys.has(key)) {
    exactState.enabledNetworkKeys.delete(key);
    const remaining = exactEnabledNetworks(token);
    if (exactState.selectedNetworkByToken[token.id] === network.id) {
      exactSetSelectedNetwork(token.id, (remaining[0] || exactNetworks(token)[0]).id);
    }
    exactState.toast = `${token.symbol} removed on ${network.label}`;
  } else {
    exactState.enabledNetworkKeys.add(key);
    exactSetSelectedNetwork(token.id, network.id);
    exactState.toast = `${token.symbol} added on ${network.label}`;
  }
}

function exactNetworkBadge(network, className = "") {
  const meta = exactNetworkMeta[network.id] || network;
  return `<span class="real-network-badge ${className}" style="--net:${meta.color || "#8f83ff"}">${meta.badge || network.tag}</span>`;
}

function exactNetworkLabel(token = exactToken()) {
  return exactSelectedNetwork(token).label;
}

function exactNetworkShort(token = exactToken()) {
  return exactSelectedNetwork(token).tag || exactSelectedNetwork(token).label;
}

function exactNetworkFeeSymbol(token = exactToken()) {
  return exactSelectedNetwork(token).feeSymbol || exactNetworkShort(token);
}

const EXACT_EVM_NETWORK_IDS = new Set([
  "ethereum", "polygon", "bsc", "arbitrum", "optimism", "base", "avalanche",
  "fantom", "gnosis", "linea", "scroll", "flare", "story", "syscoin", "taiko",
  "telos", "xai", "xlayer", "hyperevm",
]);

// EVM chain ids for EIP-1559 signing, keyed by our network id.
const EXACT_EVM_CHAIN_IDS = {
  ethereum: 1, polygon: 137, bsc: 56, arbitrum: 42161, optimism: 10,
  base: 8453, avalanche: 43114, fantom: 250, gnosis: 100, linea: 59144, scroll: 534352,
};

// Verified ERC-20 token contracts + decimals we can sign transfers for,
// keyed by network id then upper-case symbol: [contract, decimals].
const EXACT_ERC20 = {
  ethereum: {
    USDT: ["0xdac17f958d2ee523a2206206994597c13d831ec7", 6],
    USDC: ["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", 6],
  },
  polygon: {
    USDT: ["0xc2132d05d31c914a87c6611c10748aeb04b58e8f", 6],
    USDC: ["0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", 6],
  },
  bsc: {
    USDT: ["0x55d398326f99059ff775485246999027b3197955", 18],
    USDC: ["0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", 18],
  },
  arbitrum: {
    USDT: ["0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", 6],
    USDC: ["0xaf88d065e77c8cc2239327c5edb3a432268e5831", 6],
  },
  optimism: {
    USDT: ["0x94b008aa00579c1307b0ef2c499ad98a8ce58e58", 6],
    USDC: ["0x0b2c639c533813f4aa9d7837caf62653d097ff85", 6],
  },
};

// Convert a human amount string to an integer base-unit string (no floats).
function exactToBaseUnits(amount, decimals) {
  const s = String(amount == null ? "" : amount).trim();
  if (!/^\d*\.?\d*$/.test(s) || s === "" || s === ".") return "0";
  const [intPart, fracRaw = ""] = s.split(".");
  const frac = `${fracRaw}${"0".repeat(decimals)}`.slice(0, decimals);
  const combined = `${intPart || "0"}${frac}`.replace(/^0+/, "");
  return combined === "" ? "0" : combined;
}

// Single JSON-RPC call through our server proxy (keeps the Ankr key server-side).
async function exactRpc(networkId, method, params = []) {
  const res = await fetch(`/api/rpc?chain=${encodeURIComponent(networkId)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
  });
  if (!res.ok) throw new Error(`rpc ${method} HTTP ${res.status}`);
  const data = await res.json();
  if (data && data.error) throw new Error((data.error && data.error.message) || "rpc error");
  return data.result;
}

// Sign + broadcast a real EVM transfer (native or USDT/USDC). Returns the txid.
async function exactSendEvm({ pin, token, network, amount, to }) {
  const chainId = EXACT_EVM_CHAIN_IDS[network.id];
  if (!chainId) throw new Error("unsupported network");
  const crypto = exactCrypto();
  if (!crypto || !crypto.buildEvmTransfer) throw new Error("signer unavailable");
  const mnemonic = await exactDecryptSeed(pin);
  if (!mnemonic) throw new Error("seed unavailable");
  const from = exactRuntime.address;
  const symbol = token.symbol.toUpperCase();
  const isNative = token.tokenKind === "native" && symbol === "ETH";

  let toAddr = to;
  let value = "0";
  let data = "";
  let gasLimit = 21000;
  if (!isNative) {
    const erc = (EXACT_ERC20[network.id] || {})[symbol];
    if (!erc) throw new Error(`${symbol} not supported on ${network.label}`);
    const [contract, decimals] = erc;
    data = crypto.erc20TransferData(to, exactToBaseUnits(amount, decimals));
    toAddr = contract;
    gasLimit = 90000;
  } else {
    value = exactToBaseUnits(amount, 18);
  }

  const [nonceHex, gasPriceHex] = await Promise.all([
    exactRpc(network.id, "eth_getTransactionCount", [from, "pending"]),
    exactRpc(network.id, "eth_gasPrice", []),
  ]);
  const gasPrice = BigInt(gasPriceHex || "0x0");
  const twoGwei = 2000000000n;
  const maxPriorityFeePerGas = gasPrice < twoGwei ? (gasPrice || 1000000000n) : twoGwei;
  const maxFeePerGas = gasPrice * 2n + maxPriorityFeePerGas;

  const signed = crypto.buildEvmTransfer({
    mnemonic,
    chainId,
    nonce: BigInt(nonceHex || "0x0").toString(),
    maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
    maxFeePerGas: maxFeePerGas.toString(),
    gasLimit: String(gasLimit),
    to: toAddr,
    value,
    data,
  });

  const broadcast = await exactRpc(network.id, "eth_sendRawTransaction", [signed.raw]);
  const hash = typeof broadcast === "string" && broadcast.startsWith("0x") ? broadcast : signed.hash;
  const feeNative = Number(BigInt(gasLimit) * maxFeePerGas) / 1e18;
  const fee = `≈ ${feeNative.toFixed(6)} ${network.feeSymbol || "ETH"}`;
  return { hash, fee };
}

// Maps a (non-EVM) network id to the runtime field holding its derived address.
const EXACT_CHAIN_ADDRESS_FIELD = {
  bitcoin: "btcAddress",
  solana: "solAddress",
  xrp: "xrpAddress",
  tron: "trxAddress",
  dogecoin: "dogeAddress",
  litecoin: "ltcAddress",
};

function exactReceiveAddress(token = exactToken()) {
  const network = exactSelectedNetwork(token);
  if (exactIsLive()) {
    // Live wallet: only ever return a genuinely derived address, never a demo
    // placeholder — sending to a wrong address would lose funds.
    if (EXACT_EVM_NETWORK_IDS.has(network.id)) return exactRuntime.address || "";
    const field = EXACT_CHAIN_ADDRESS_FIELD[network.id];
    if (field) return exactRuntime[field] || "";
    return "";
  }
  return network.address || "0xDe7bbd62f739210C43FF1f6845B55aAeEEaa8289";
}

function exactHexToRgb(color) {
  const match = String(color).trim().match(/^#?([0-9a-f]{6})$/i);
  if (!match) return { r: 143, g: 131, b: 255 };
  const value = Number.parseInt(match[1], 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function exactMixColor(color, target, amount) {
  const base = exactHexToRgb(color);
  const other = exactHexToRgb(target);
  const mix = (channel) => Math.round(base[channel] + ((other[channel] - base[channel]) * amount));
  return `rgb(${mix("r")} ${mix("g")} ${mix("b")})`;
}

function exactHexSvg(token, mark, background = token.color || "#8f83ff") {
  const safeId = `icon-${String(token.id || token.symbol).replace(/[^a-z0-9]/gi, "-")}`;
  const high = exactMixColor(background, "#ffffff", 0.32);
  const low = exactMixColor(background, "#000000", 0.32);
  return `<svg viewBox="0 0 64 64" aria-hidden="true">
    <defs>
      <linearGradient id="${safeId}-face" x1="14" y1="7" x2="52" y2="58" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="${high}"/>
        <stop offset="0.52" stop-color="${background}"/>
        <stop offset="1" stop-color="${low}"/>
      </linearGradient>
      <linearGradient id="${safeId}-rim" x1="16" y1="4" x2="50" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="rgba(255,255,255,.52)"/>
        <stop offset=".45" stop-color="rgba(255,255,255,.12)"/>
        <stop offset="1" stop-color="rgba(0,0,0,.34)"/>
      </linearGradient>
      <radialGradient id="${safeId}-glow" cx="34%" cy="25%" r="63%">
        <stop offset="0" stop-color="rgba(255,255,255,.35)"/>
        <stop offset=".44" stop-color="rgba(255,255,255,.09)"/>
        <stop offset="1" stop-color="rgba(255,255,255,0)"/>
      </radialGradient>
    </defs>
    <path d="M32 3.2 56.8 17.6v28.8L32 60.8 7.2 46.4V17.6Z" fill="url(#${safeId}-rim)"/>
    <path d="M32 6.2 53.9 18.9v26.2L32 57.8 10.1 45.1V18.9Z" fill="url(#${safeId}-face)"/>
    <path d="M32 6.2 53.9 18.9 32 31.7 10.1 18.9Z" fill="url(#${safeId}-glow)" opacity=".9"/>
    <path d="M13 45 32 56 51 45" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="2"/>
    <g class="coin-mark">${mark}</g>
  </svg>`;
}

function exactTextMark(text, size = 22, y = 39, fill = "#fff", weight = 850) {
  return `<text x="32" y="${y}" text-anchor="middle" font-size="${size}" font-weight="${weight}" fill="${fill}" font-family="Inter, Arial, sans-serif">${text}</text>`;
}

function exactLogoSvg(token) {
  const id = token.id;
  const symbol = token.symbol;
  const lowerSymbol = String(symbol).toLowerCase();
  const backgroundById = {
    bitcoin: "#f6b92f",
    "wrapped-bitcoin": "#f6b92f",
    ethereum: "#6873ad",
    "base-eth": "#6873ad",
    "linea-eth": "#6873ad",
    "scroll-eth": "#6873ad",
    tether: "#35c4b6",
    "usd-coin": "#2775ca",
    bnb: "#f3ba2f",
    xrp: "#1ba7d7",
    solana: "#0c0d13",
    tron: "#a9142b",
    dogecoin: "#b9a442",
    cardano: "#236bdc",
    litecoin: "#d8dae0",
    polygon: "#8247e5",
    dai: "#f0a826",
    chainlink: "#2f67f6",
    arbitrum: "#4d8dff",
    optimism: "#ff4b5c",
    avalanche: "#e84142",
    fantom: "#1969ff",
    stellar: "#f0f2f6",
    zcash: "#f4c431",
    toncoin: "#2fb6e8",
    uniswap: "#ff5aad",
    aave: "#8f72ea",
    "the-graph": "#795bff",
    render: "#ff4b4b",
    "paypal-usd": "#2d7ff9",
    "euro-coin": "#2474ff",
  };
  const bg = backgroundById[id] || token.color || "#8f83ff";
  if (id === "ethereum" || symbol === "ETH") {
    return exactHexSvg(token, `<path d="M32 11 19.8 32 32 25.7 44.2 32Z" fill="#f5f6ff"/><path d="M19.8 35.1 32 52.3l12.2-17.2L32 42.3Z" fill="#c7ccdf"/><path d="M32 11v14.7L44.2 32Zm0 31.3v10l12.2-17.2Z" fill="#8f97bd"/>`, bg);
  }
  if (id === "tether" || symbol === "USDT") {
    return exactHexSvg(token, `<g class="brand-tether-mark">
      <path d="M17.2 17.8h29.6v6.7H35.5v6.2c7.9.5 13.7 2.8 13.7 5.5 0 3.1-7.7 5.8-17.2 5.8s-17.2-2.7-17.2-5.8c0-2.7 5.8-5 13.7-5.5v-6.2H17.2Z" fill="#fff"/>
      <ellipse cx="32" cy="36.2" rx="13.2" ry="3.6" fill="none" stroke="#35c4b6" stroke-width="2.2"/>
      <path d="M28.5 33.4c1.1-.1 2.3-.2 3.5-.2s2.4.1 3.5.2v14.7h-7Z" fill="#fff"/>
      <ellipse cx="32" cy="36.2" rx="16.9" ry="5.3" fill="none" stroke="#fff" stroke-width="3.4"/>
    </g>`, bg);
  }
  if (id === "bitcoin" || symbol === "BTC" || id === "wrapped-bitcoin") {
    return exactHexSvg(token, exactTextMark("₿", 34, 43), bg);
  }
  if (id === "bnb" || symbol === "BNB") {
    return exactHexSvg(token, `<path d="m32 16 7.1 7.1L32 30.2l-7.1-7.1Zm-11 11 7.1 7.1-7.1 7.1-7.1-7.1Zm22 0 7.1 7.1-7.1 7.1-7.1-7.1Zm-11 11 7.1 7.1L32 52.2l-7.1-7.1Zm0-11 7.1 7.1L32 41.2l-7.1-7.1Z" fill="#fff"/>`, bg);
  }
  if (id === "usd-coin" || symbol === "USDC") {
    return exactHexSvg(token, `<circle cx="32" cy="32" r="15.6" fill="none" stroke="#fff" stroke-width="4"/><path d="M32 18v28M38.5 24.8c-2.1-1.5-4.2-2.2-6.5-2.2-4 0-6.5 1.9-6.5 4.7 0 6.5 13.1 3.1 13.1 9.9 0 2.9-2.4 4.8-6.6 4.8-2.9 0-5.3-.8-7.2-2.4" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>`, bg);
  }
  if (id === "xrp" || symbol === "XRP") {
    return exactHexSvg(token, `<path d="M20.5 22.2c4.3 4.4 7.4 6.4 11.5 6.4s7.2-2 11.5-6.4M20.5 41.8c4.3-4.4 7.4-6.4 11.5-6.4s7.2 2 11.5 6.4" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round"/>`, bg);
  }
  if (id === "solana" || symbol === "SOL") {
    return exactHexSvg(token, `<path d="M21 18.5h27l-5.2 6H15.8Z" fill="#24e0a6"/><path d="M15.8 29h27L48 35H21Z" fill="#875cff"/><path d="M21 39.5h27l-5.2 6H15.8Z" fill="#26c8ff"/>`, bg);
  }
  if (id === "tron" || symbol === "TRX") {
    return exactHexSvg(token, `<path d="m19.2 18.5 29.1 8.1-16.1 21.6Zm3.9 4.2 8.9 19.5 4.4-13.4Zm3.4-1.2 12.2 6 5.8-1.2Zm12.8 8.1-5.2 10.4 9.7-12.1Z" fill="none" stroke="#fff" stroke-width="2.3" stroke-linejoin="round"/>`, bg);
  }
  if (id === "dogecoin" || symbol === "DOGE") {
    return exactHexSvg(token, exactTextMark("Ð", 33, 43), bg);
  }
  if (id === "cardano" || symbol === "ADA") {
    return exactHexSvg(token, `<g fill="#fff">${[0, 60, 120, 180, 240, 300].map((angle) => {
      const x = 32 + (Math.cos((angle * Math.PI) / 180) * 12);
      const y = 32 + (Math.sin((angle * Math.PI) / 180) * 12);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.4"/>`;
    }).join("")}<circle cx="32" cy="32" r="3.2"/><circle cx="32" cy="14.5" r="1.8"/><circle cx="32" cy="49.5" r="1.8"/><circle cx="14.5" cy="32" r="1.8"/><circle cx="49.5" cy="32" r="1.8"/></g>`, bg);
  }
  if (id === "litecoin" || symbol === "LTC") {
    return exactHexSvg(token, `<path d="M27.5 16.5h8.1l-4 16.5 7.8-2-1.5 5.8-7.9 2-1.8 7.6h18.2l-1.7 6.9H17.2l3-12.1-6 1.6 1.5-5.9 6-1.6Z" fill="#fff"/>`, bg);
  }
  if (id === "polygon" || symbol === "POL") {
    return exactHexSvg(token, `<g class="brand-polygon-mark" fill="none" stroke="#fff" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22.2 25.6 14.9 29.8v8.4l7.3 4.2 7.3-4.2v-8.4Z"/>
      <path d="M41.8 21.2 49.1 25.4v8.4L41.8 38l-7.3-4.2v-8.4Z"/>
      <path d="M29.5 29.8 34.5 26.9M29.5 38.2l5-2.9"/>
    </g>`, bg);
  }
  if (id === "dai" || symbol === "DAI") {
    return exactHexSvg(token, `<path d="M18 23h14.8c7.2 0 12.2 3.7 13.5 9h4.1v4.6h-4.1c-1.3 5.4-6.3 9-13.5 9H18v-9h-4.2V32H18Zm6.3 4.7V32h15.1c-1.1-2.7-3.8-4.3-7.2-4.3Zm0 8.9v4.3h7.9c3.4 0 6.1-1.6 7.2-4.3Z" fill="#fff"/>`, bg);
  }
  if (id === "chainlink" || symbol === "LINK") {
    return exactHexSvg(token, `<path class="brand-chainlink-mark" d="M32 16.4 45.6 24.2v15.6L32 47.6l-13.6-7.8V24.2Z" fill="none" stroke="#fff" stroke-width="5.8" stroke-linejoin="round"/>`, bg);
  }
  if (id === "arbitrum" || symbol === "ARB") {
    return exactHexSvg(token, `<path d="M20 44 31.5 16h7.2L27.2 44Zm12.6 0 7.8-18.6 4.5 10.1L41.5 44Z" fill="#fff"/><path d="M17.5 23.5 32 15l14.5 8.5v17L32 49l-14.5-8.5Z" fill="none" stroke="#d7e6ff" stroke-width="2.2"/>`, bg);
  }
  if (id === "optimism" || symbol === "OP") {
    return exactHexSvg(token, exactTextMark("OP", 23, 40), bg);
  }
  if (id === "avalanche" || symbol === "AVAX") {
    return exactHexSvg(token, `<path d="M33.9 16.8 46.5 40c1 1.8-.3 4-2.4 4H36l-4.1-7.1-4.2 7.1h-7.9c-2.1 0-3.4-2.2-2.4-4l12.6-23.2c.9-1.7 3.1-1.7 3.9 0Z" fill="#fff"/>`, bg);
  }
  if (id === "fantom" || symbol === "FTM") {
    return exactHexSvg(token, `<path d="M21 21 32 15l11 6v22l-11 6-11-6Zm6 3.5v8l5 2.8 5-2.8v-8l-5-2.8Zm0 15 5 2.8 5-2.8v-4.4l-5 2.8-5-2.8Z" fill="none" stroke="#fff" stroke-width="3.2" stroke-linejoin="round"/>`, bg);
  }
  if (id === "stellar" || symbol === "XLM") {
    return exactHexSvg(token, `<g class="brand-stellar-mark" transform="rotate(-19 32 32)" fill="none" stroke="#111827" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="32" cy="32" r="14.4" stroke-width="3.4"/>
      <path d="M15.3 33.8h33.4" stroke-width="4.3"/>
      <path d="M15.3 41h33.4" stroke-width="4.3"/>
    </g>`, bg);
  }
  if (id === "zcash" || symbol === "ZEC") {
    return exactHexSvg(token, `<circle cx="32" cy="32" r="15" fill="none" stroke="#fff" stroke-width="3.8"/><path d="M32 15v8M32 41v8M24 24h16L24 40h16" fill="none" stroke="#fff" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/>`, bg);
  }
  if (id === "toncoin" || symbol === "TON") {
    return exactHexSvg(token, `<path d="M17 21h30L32 47Zm5.6 4 9.4 16.8L41.4 25Z" fill="none" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"/>`, bg);
  }
  if (id === "uniswap" || symbol === "UNI") {
    return exactHexSvg(token, `<path class="brand-uniswap-mark" d="M40.4 14.8c-4.7 2.1-7.2 5.5-7.3 10.4-4.4-2.9-9.1-4-14.1-3.3 5.9 2.7 9.4 6.5 10.4 11.5-3.8 1-6.7 3.2-8.5 6.6 4.2-1.6 8.2-1.5 11.8.5 4.4 2.3 7.5 5.3 9.3 9.1 1-4.1.4-7.8-1.9-10.9 3.7.6 6.8 2.2 9.4 4.9-.8-5.5-3.2-9.5-7.3-11.8 3.4-4.4 2.8-10.1-1.8-17Z" fill="#fff"/>
      <path d="M39.4 14.5 45 17.2l-4.3 3.4Z" fill="#fff"/>
      <circle cx="36.9" cy="30.4" r="1.7" fill="${bg}"/>`, bg);
  }
  if (id === "aave" || symbol === "AAVE") {
    return exactHexSvg(token, `<path class="brand-aave-ghost" d="M32 15.6c-8.4 0-14.6 6.4-14.6 15v13.2c0 2 2.2 3.2 3.9 2.1l3-1.9 3 1.9c1.3.8 2.9.8 4.2 0l.5-.3.5.3c1.3.8 2.9.8 4.2 0l3-1.9 3 1.9c1.7 1.1 3.9-.1 3.9-2.1V30.6c0-8.6-6.2-15-14.6-15Z" fill="#fff"/>
      <circle cx="26.5" cy="31.5" r="2.25" fill="${bg}"/>
      <circle cx="37.5" cy="31.5" r="2.25" fill="${bg}"/>
      <path d="M27.6 38.4c2.7 2 6.1 2 8.8 0" fill="none" stroke="${bg}" stroke-width="2.4" stroke-linecap="round"/>`, bg);
  }
  if (id === "xocash" || lowerSymbol === "xo") {
    return exactHexSvg(token, `<text x="29" y="40" text-anchor="middle" font-size="21" font-weight="900" fill="#fff" font-family="Inter, Arial, sans-serif">XO</text><circle cx="45" cy="22" r="8" fill="#111"/><path d="M40 22h10M42 19h6M42 25h6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`, "#19d64a");
  }
  if (id === "pepe" || id === "shiba-inu") {
    return exactHexSvg(token, exactTextMark(symbol.slice(0, 4), String(symbol).length > 3 ? 17 : 22, 39), bg);
  }
  const short = String(symbol).slice(0, 4);
  return exactHexSvg(token, exactTextMark(short, short.length > 3 ? 16 : 22, 39), bg);
}

function exactIcon(token, className = "") {
  if (token.id === "tether" || token.symbol === "USDT") {
    const svg = exactLogoSvg(token);
    return `<span class="exact-token-icon has-vector ${className}" style="--coin:${token.color}">${svg}</span>`;
  }
  const src = exactAssets[token.assetKey || token.id];
  if (src) {
    return `<span class="exact-token-icon has-image ${className}" style="--coin:${token.color}"><img src="${src}" alt="" /></span>`;
  }
  const svg = exactLogoSvg(token);
  if (svg) {
    return `<span class="exact-token-icon has-vector ${className}" style="--coin:${token.color}">${svg}</span>`;
  }
  return `<span class="exact-token-icon ${className}" style="--coin:${token.color}">${token.icon}</span>`;
}

function exactDeviceClass() {
  return `exact-${exactState.device}`;
}

function exactScale(phoneWidth = 649, phoneHeight = 1280) {
  const width = window.innerWidth || 430;
  const height = window.innerHeight || 900;
  const targetWidth = Math.min(Math.max(width, 320), 480);
  // Fit BOTH dimensions so the whole phone canvas is visible and only the
  // inner scroll area scrolls — no competing page scroll.
  return Math.min(targetWidth / phoneWidth, height / phoneHeight, 1);
}

function exactImage(name, className = "") {
  return exactAssets[name] ? `<img class="${className}" src="${exactAssets[name]}" alt="" />` : "";
}

function exactQrTextBytes(text) {
  return Array.from(unescape(encodeURIComponent(text)), (char) => char.charCodeAt(0));
}

function exactQrGeneratorPoly(degree) {
  const exp = [1];
  const log = Array(256).fill(0);
  for (let index = 1; index < 255; index += 1) {
    let value = exp[index - 1] << 1;
    if (value & 0x100) value ^= 0x11d;
    exp[index] = value;
  }
  for (let index = 0; index < 255; index += 1) log[exp[index]] = index;
  const multiply = (a, b) => (a && b ? exp[(log[a] + log[b]) % 255] : 0);
  let poly = [1];
  for (let index = 0; index < degree; index += 1) {
    const next = Array(poly.length + 1).fill(0);
    poly.forEach((coef, coefIndex) => {
      next[coefIndex] ^= multiply(coef, exp[index]);
      next[coefIndex + 1] ^= coef;
    });
    poly = next;
  }
  return { poly, multiply };
}

function exactQrCodewords(text) {
  const bytes = exactQrTextBytes(text).slice(0, 72);
  const bits = [];
  const append = (value, length) => {
    for (let bit = length - 1; bit >= 0; bit -= 1) bits.push((value >> bit) & 1);
  };
  append(0b0100, 4);
  append(bytes.length, 8);
  bytes.forEach((byte) => append(byte, 8));
  const dataCapacityBits = 80 * 8;
  append(0, Math.min(4, dataCapacityBits - bits.length));
  while (bits.length % 8) bits.push(0);
  const data = [];
  for (let index = 0; index < bits.length; index += 8) {
    data.push(bits.slice(index, index + 8).reduce((value, bit) => (value << 1) | bit, 0));
  }
  for (let pad = 0; data.length < 80; pad += 1) data.push(pad % 2 ? 0x11 : 0xec);
  const { poly, multiply } = exactQrGeneratorPoly(20);
  const ecc = Array(20).fill(0);
  data.forEach((codeword) => {
    const factor = codeword ^ ecc.shift();
    ecc.push(0);
    poly.slice(0, 20).forEach((coef, index) => {
      ecc[index] ^= multiply(coef, factor);
    });
  });
  return [...data, ...ecc];
}

function exactQrFormatBits(mask = 0) {
  let data = ((1 << 3) | mask) << 10;
  const generator = 0x537;
  for (let bit = 14; bit >= 10; bit -= 1) {
    if ((data >> bit) & 1) data ^= generator << (bit - 10);
  }
  return ((((1 << 3) | mask) << 10) | data) ^ 0x5412;
}

function exactQrMatrix(text) {
  const version = 4;
  const size = 17 + (version * 4);
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved = Array.from({ length: size }, () => Array(size).fill(false));
  const set = (row, col, value, reserve = true) => {
    if (row < 0 || col < 0 || row >= size || col >= size) return;
    matrix[row][col] = Boolean(value);
    if (reserve) reserved[row][col] = true;
  };
  const finder = (row, col) => {
    for (let y = -1; y <= 7; y += 1) {
      for (let x = -1; x <= 7; x += 1) {
        const rr = row + y;
        const cc = col + x;
        if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
        const dark = y >= 0 && y <= 6 && x >= 0 && x <= 6 && (y === 0 || y === 6 || x === 0 || x === 6 || (y >= 2 && y <= 4 && x >= 2 && x <= 4));
        set(rr, cc, dark);
      }
    }
  };
  finder(0, 0);
  finder(0, size - 7);
  finder(size - 7, 0);
  for (let index = 8; index < size - 8; index += 1) {
    set(6, index, index % 2 === 0);
    set(index, 6, index % 2 === 0);
  }
  for (let y = -2; y <= 2; y += 1) {
    for (let x = -2; x <= 2; x += 1) {
      const distance = Math.max(Math.abs(x), Math.abs(y));
      set(26 + y, 26 + x, distance !== 1);
    }
  }
  set((4 * version) + 9, 8, true);
  for (let index = 0; index < 9; index += 1) {
    if (index !== 6) {
      reserved[8][index] = true;
      reserved[index][8] = true;
    }
  }
  for (let index = 0; index < 8; index += 1) {
    reserved[size - 1 - index][8] = true;
    reserved[8][size - 1 - index] = true;
  }
  const bits = exactQrCodewords(text).flatMap((codeword) => Array.from({ length: 8 }, (_, index) => (codeword >> (7 - index)) & 1));
  let bitIndex = 0;
  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1;
    for (let offset = 0; offset < size; offset += 1) {
      const row = upward ? size - 1 - offset : offset;
      for (let x = 0; x < 2; x += 1) {
        const cc = col - x;
        if (reserved[row][cc]) continue;
        const mask = (row + cc) % 2 === 0;
        set(row, cc, Boolean((bits[bitIndex] || 0) ^ mask), false);
        bitIndex += 1;
      }
    }
    upward = !upward;
  }
  const format = exactQrFormatBits(0);
  const fbit = (index) => ((format >> index) & 1) === 1;
  for (let index = 0; index <= 5; index += 1) set(8, index, fbit(index));
  set(8, 7, fbit(6));
  set(8, 8, fbit(7));
  set(7, 8, fbit(8));
  for (let index = 9; index < 15; index += 1) set(14 - index, 8, fbit(index));
  for (let index = 0; index < 8; index += 1) set(size - 1 - index, 8, fbit(index));
  for (let index = 8; index < 15; index += 1) set(8, size - 15 + index, fbit(index));
  return matrix;
}

function exactQrSvg(text) {
  // Prefer the vendored, standards-compliant encoder so the code actually
  // scans; fall back to the built-in only if the bundle didn't load.
  const crypto = exactCrypto();
  let matrix;
  try { matrix = crypto && crypto.qrMatrix ? crypto.qrMatrix(text) : exactQrMatrix(text); }
  catch { matrix = exactQrMatrix(text); }
  const size = matrix.length;
  const quiet = 4; // required quiet zone (margin) so scanners can lock on
  const dim = size + quiet * 2;
  const cells = matrix.flatMap((row, y) => row.map((dark, x) => dark ? `<rect x="${x + quiet}" y="${y + quiet}" width="1" height="1"/>` : "")).join("");
  return `<svg class="real-qr-svg" viewBox="0 0 ${dim} ${dim}" shape-rendering="crispEdges" aria-label="QR code for ${exactEscape(text)}"><rect width="${dim}" height="${dim}" fill="#fff"/> <g fill="#050505">${cells}</g></svg>`;
}

function exactMoneyNumber(value) {
  const number = Number(String(value || "0").replace(/[$,]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

// ---------------------------------------------------------------------------
// Live spot prices (CoinGecko via /api/prices). Token amounts come from Ankr;
// these give accurate USD prices, 24h change, and per-transaction USD values.
// ---------------------------------------------------------------------------
const exactPrices = {}; // tokenId -> { usd, change }

// Map our token ids to CoinGecko ids. Tokens without an entry keep their
// built-in placeholder (best-effort; all the majors resolve to live prices).
const exactCoingeckoIds = {
  bitcoin: "bitcoin", ethereum: "ethereum", tether: "tether", "usd-coin": "usd-coin",
  bnb: "binancecoin", xrp: "ripple", solana: "solana", tron: "tron",
  dogecoin: "dogecoin", litecoin: "litecoin",
};

function exactTokenPriceNumber(token) {
  const live = exactPrices[token.id];
  if (live && Number.isFinite(live.usd)) return live.usd;
  return exactMoneyNumber(token.detailPrice || token.price);
}

function exactTokenChangeNumber(token) {
  const live = exactPrices[token.id];
  if (live && Number.isFinite(live.change)) return live.change;
  return Number.parseFloat(String(token.change || "0").replace(/[+%]/g, "")) || 0;
}

function exactFormatPrice(usd) {
  const n = Number(usd);
  if (!Number.isFinite(n) || n <= 0) return "$0.00";
  if (n >= 1) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (n >= 0.01) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  return `$${n.toPrecision(2)}`;
}

function exactFormatChange(pct) {
  const n = Number(pct);
  if (!Number.isFinite(n)) return "+0.0%";
  return `${n >= 0 ? "+" : ""}${n.toFixed(Math.abs(n) < 1 ? 1 : 2)}%`;
}

function exactTokenPriceLabel(token) { return exactFormatPrice(exactTokenPriceNumber(token)); }
function exactTokenChangeLabel(token) { return exactFormatChange(exactTokenChangeNumber(token)); }

async function exactFetchPrices() {
  // Needs a real document base for the relative /api URL (skips SSR/smoke).
  if (typeof window === "undefined" || !window.location) return;
  const ids = Array.from(new Set(Object.values(exactCoingeckoIds)));
  if (!ids.length) return;
  let data;
  try {
    const res = await fetch(`/api/prices?ids=${encodeURIComponent(ids.join(","))}`, { headers: { accept: "application/json" } });
    if (!res.ok) return;
    data = await res.json();
  } catch (error) {
    console.error("[exx] price fetch failed:", error);
    return;
  }
  const prices = (data && data.prices) || {};
  let changed = false;
  for (const token of exactTokens) {
    const entry = prices[exactCoingeckoIds[token.id]];
    if (entry && Number.isFinite(Number(entry.usd))) {
      exactPrices[token.id] = { usd: Number(entry.usd), change: Number(entry.change) };
      changed = true;
    }
  }
  if (changed) exactRender();
}

function exactShortHash(hash) {
  return hash ? `${hash.slice(0, 7)}...${hash.slice(-5)}` : "-";
}

function exactEscape(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function exactFormatUsd(value) {
  return `$${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function exactPortfolioValue() {
  if (exactIsLive()) return exactRuntime.totalUsd || 0;
  return exactTokens
    .filter((token) => exactTokenEnabled(token))
    .reduce((total, token) => total + exactComputedTokenValue(token), 0);
}

function exactHoldingsSortLabel() {
  return exactState.holdingsSort === "lowest" ? "LOWEST HOLDINGS" : "HIGHEST HOLDINGS";
}

function exactSortedEnabledTokens() {
  const direction = exactState.holdingsSort === "lowest" ? 1 : -1;
  return exactTokens
    .filter((token) => exactTokenEnabled(token))
    .sort((a, b) => {
      const valueDelta = exactComputedTokenValue(a) - exactComputedTokenValue(b);
      if (valueDelta) return valueDelta * direction;
      return a.name.localeCompare(b.name);
    });
}

function exactMoneyParts(value) {
  const [whole, cents = "00"] = exactFormatUsd(value).split(".");
  return { whole, cents };
}

// Build proportional donut segments from the actual holdings. Returns [] when the
// portfolio is empty so the ring renders as a bare track (true zero state).
function exactRingSegments() {
  const total = exactPortfolioValue();
  if (!total || total <= 0) return [];
  const holdings = exactSortedEnabledTokens()
    .map((token) => ({ color: token.color, value: exactComputedTokenValue(token) }))
    .filter((entry) => entry.value > 0);
  if (!holdings.length) return [];
  const top = holdings.slice(0, 3);
  const restValue = holdings.slice(3).reduce((sum, entry) => sum + entry.value, 0);
  if (restValue > 0) top.push({ color: "#6b7088", value: restValue });
  const gap = top.length > 1 ? 1.5 : 0;
  let offset = 0;
  return top.map((entry) => {
    const pct = (entry.value / total) * 100;
    const length = Math.max(pct - gap, 0.5);
    const segment = { color: entry.color, length, offset };
    offset += pct;
    return segment;
  });
}

function exactTokenBalance(token) {
  if (!exactTokenEnabled(token)) return "0";
  if (exactIsLive()) return exactRuntime.holdings[token.id]?.amount || "0";
  if (exactPortfolioHoldings[token.id]) return exactPortfolioHoldings[token.id].amount;
  if (token.id === "tether") return "0";
  if (token.id === "usd-coin") return "0";
  if (token.id === "dai") return "0";
  if (token.id === "wrapped-bitcoin") return "0";
  if (token.id === "chainlink") return "0";
  if (token.id === "solana") return "5.42";
  if (token.id === "tron") return "2,000";
  if (token.id === "dogecoin") return "1,000";
  if (token.id === "cardano") return "600";
  if (token.id === "litecoin") return "1.25";
  if (token.id === "xocash") return "320";
  if (token.id === "polygon") return "0";
  if (token.id === "arbitrum") return "0";
  if (token.id === "optimism") return "0";
  return "0";
}

function exactTokenValue(token) {
  return exactFormatUsd(exactComputedTokenValue(token));
}

function exactComputedTokenValue(token) {
  if (!exactTokenEnabled(token)) return 0;
  if (exactIsLive()) return exactRuntime.holdings[token.id]?.value || 0;
  if (exactPortfolioHoldings[token.id]) return exactPortfolioHoldings[token.id].value;
  const balance = Number(String(exactTokenBalance(token)).replace(/,/g, ""));
  if (!Number.isFinite(balance) || balance <= 0) return 0;
  return balance * exactTokenPriceNumber(token);
}

function exactTokenTransactions(tokenId = exactState.selected) {
  return exactState.transactions.filter((transaction) => transaction.token === tokenId);
}

function exactStatusLabel(status) {
  if (status === "pending") return "Pending";
  if (status === "received") return "Received";
  if (status === "sent") return "Sent";
  return "Sent";
}

function exactScreenTitle() {
  return exactState.device === "android" ? "Android" : "iPhone";
}

function exactToast() {
  return exactState.toast ? `<div class="real-toast">${exactState.toast}</div>` : "";
}

function exactGoBack() {
  // PIN confirm-send: back returns to the send screen and cancels the prompt.
  if (exactState.screen === "pin" && exactState.pinMode === "send") {
    exactState.pinMode = "";
    exactState.pinEntry = "";
    exactState.pinError = "";
    exactState.pendingSend = null;
    exactState.screen = "send";
    exactState.showHoldingsSort = false;
    return;
  }
  const fallback = {
    access: "landing",
    create: "access",
    confirm: "create",
    restore: "access",
    detail: "home",
    txdetail: "detail",
    send: "detail",
    receive: "detail",
    assets: "home",
    "add-token": exactState.returnToScreen || "home",
    profile: "home",
    settings: "profile",
  };
  exactState.screen = fallback[exactState.screen] || "home";
  exactState.showHoldingsSort = false;
}

function realTopBar({ title = "", back = "home", right = "" } = {}) {
  return `
    <header class="real-topbar">
      <button data-action="${back === "home" ? "back" : back}" aria-label="Back">‹</button>
      ${title ? `<strong>${title}</strong>` : "<span></span>"}
      ${right || "<span></span>"}
    </header>
  `;
}

function realAssetRow(token, options = {}) {
  const enabled = exactTokenEnabled(token);
  return `
    <button class="real-asset-row ${options.compact ? "compact" : ""}" data-action="${options.action || "detail"}" data-token="${token.id}">
      ${exactIcon(token)}
      <span class="real-asset-copy">
        <strong>${token.name}</strong>
        <small>${exactTokenPriceLabel(token)} ${exactTokenChangeLabel(token)}</small>
      </span>
      <em style="color:${token.color}">${options.showToggle ? (enabled ? "✓" : "○") : token.symbol}</em>
    </button>
  `;
}

// Portfolio-wide pending totals in USD. Net is added into the displayed total.
function exactPendingSummary() {
  let inUsd = 0;
  let outUsd = 0;
  for (const tx of exactState.transactions) {
    if (tx.status !== "pending") continue;
    const value = exactMoneyNumber(tx.value);
    if (tx.direction === "incoming") inUsd += value; else outUsd += value;
  }
  return { inUsd, outUsd, net: inUsd - outUsd, has: inUsd > 0 || outUsd > 0 };
}

function realHoldingRow(token) {
  return `
    <button class="real-holding-row" data-action="detail" data-token="${token.id}">
      ${exactIcon(token)}
      <span class="real-holding-name">
        <strong>${token.symbol}</strong>
        <small>${token.name}</small>
      </span>
      <span class="real-holding-value">
        <strong style="color:${token.color}">${exactTokenBalance(token)} ${token.symbol}</strong>
        <small>${exactTokenValue(token)}</small>
      </span>
    </button>
  `;
}

function realActionDock(token) {
  return `
    <nav class="real-action-dock">
      <button data-action="send" aria-label="Send ${token.symbol}"><strong>↗</strong><span>Send</span></button>
      <button data-action="open-access" aria-label="Swap ${token.symbol}"><strong>⇄</strong><span>Swap</span></button>
      <button data-action="open-access" aria-label="Buy or sell ${token.symbol}"><strong>$</strong><span>Buy / Sell</span></button>
      <button data-action="receive" aria-label="Receive ${token.symbol}"><strong>↙</strong><span>Receive</span></button>
    </nav>
  `;
}

const exactRangeProfiles = {
  LIVE: { length: 28, amp: 3.4, drift: 1.2, wave: 0.9, phase: 0 },
  "1D": { length: 28, amp: 5.6, drift: -2.5, wave: 0.72, phase: 2.3 },
  "7D": { length: 24, amp: 8.8, drift: 4.8, wave: 0.62, phase: 3.7 },
  "1M": { length: 22, amp: 10.2, drift: -7.4, wave: 0.55, phase: 5.1 },
  "3M": { length: 26, amp: 13.4, drift: 9.8, wave: 0.48, phase: 6.2 },
  "6M": { length: 30, amp: 16.6, drift: 13.2, wave: 0.4, phase: 8.9 },
  "1Y": { length: 34, amp: 20.8, drift: 22.4, wave: 0.34, phase: 11.4 },
};

function exactTokenSeed(token) {
  return [...token.id].reduce((total, char) => total + char.charCodeAt(0), 0) % 17;
}

function exactInterpolatedPoint(points, progress) {
  const sourceIndex = progress * (points.length - 1);
  const low = Math.floor(sourceIndex);
  const high = Math.min(points.length - 1, low + 1);
  const mix = sourceIndex - low;
  return points[low] + ((points[high] - points[low]) * mix);
}

function exactRangePoints(token) {
  const base = token.chart?.length ? token.chart : exactTokens[1].chart;
  const profile = exactRangeProfiles[exactState.activeRange] || exactRangeProfiles.LIVE;
  const seed = exactTokenSeed(token);
  return Array.from({ length: profile.length }, (_, index) => {
    const progress = profile.length === 1 ? 0 : index / (profile.length - 1);
    const basePoint = exactInterpolatedPoint(base, progress);
    const primaryWave = Math.sin((index + profile.phase + seed) * profile.wave) * profile.amp;
    const secondaryWave = Math.cos((index * 0.47) + seed) * profile.amp * 0.44;
    const drift = (progress - 0.5) * profile.drift;
    return Math.max(1, basePoint + primaryWave + secondaryWave + drift);
  });
}

function exactRangeChange(token) {
  const baseChange = exactTokenChangeNumber(token);
  if (!Number.isFinite(baseChange) || Math.abs(baseChange) < 0.05) return "+0.0%";
  const multipliers = { LIVE: 1, "1D": 1.4, "7D": 2.1, "1M": 3.4, "3M": 4.8, "6M": 6.5, "1Y": 8.2 };
  const value = baseChange * (multipliers[exactState.activeRange] || 1);
  return `${value >= 0 ? "+" : ""}${value.toFixed(Math.abs(value) < 1 ? 1 : 2)}%`;
}

function exactChartPoints(points, width = 649, height = 318) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(max - min, 1);
  return points.map((point, index) => ({
    x: (index / (points.length - 1)) * width,
    y: height - ((point - min) / range) * 228 - 46,
  }));
}

function exactChartPath(points, width = 649, height = 318) {
  const coords = exactChartPoints(points, width, height);
  if (coords.length < 2) return "";
  let path = `M${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  for (let index = 1; index < coords.length - 1; index += 1) {
    const current = coords[index];
    const next = coords[index + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    path += ` Q${current.x.toFixed(1)} ${current.y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`;
  }
  const last = coords[coords.length - 1];
  return `${path} T${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
}

function exactAreaPath(points) {
  return `${exactChartPath(points)} L649 318 L0 318 Z`;
}

function exactChartLowLabel(token, points) {
  const price = exactTokenPriceNumber(token);
  const min = Math.min(...(points || exactRangePoints(token)));
  const max = Math.max(...(points || exactRangePoints(token)));
  const spread = Math.max(max - min, 1);
  return exactFormatUsd(Math.max(price * (1 - ((spread / 100) * 0.012)), 0));
}

function exactActivityLabel(tx) {
  if (tx.status === "pending") return "Pending";
  return tx.direction === "incoming" ? "Received" : "Sent";
}

function exactActivityVisual(tx) {
  if (tx.status === "pending") {
    return {
      label: "Pending",
      tone: "pending",
      icon: tx.direction === "incoming" ? "receive" : "send",
    };
  }
  if (tx.direction === "incoming") return { label: "Received", tone: "received", icon: "receive" };
  return { label: "Sent", tone: "sent", icon: "send" };
}

function exactTransferArrow(kind) {
  const path = kind === "receive"
    ? "M33 15 16 32M16 32h13M16 32V19"
    : "M15 33 32 16M32 16H19M32 16v13";
  return `
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="${path}" fill="none" stroke="currentColor" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
  `;
}

function exactActivityGroups(transactions) {
  return transactions.reduce((groups, tx) => {
    const day = tx.day || (tx.status?.startsWith("pending") ? "Pending" : "Today");
    if (!groups.find((group) => group.day === day)) groups.push({ day, items: [] });
    groups.find((group) => group.day === day).items.push(tx);
    return groups;
  }, []);
}

function renderRealLanding() {
  const slides = [
    { badge: "◉ Wallet", title: "Move Crypto", tone: "wallet" },
    { badge: "⌁ Markets", title: "Move Stocks", tone: "markets" },
    { badge: "$ Pay", title: "Move Cash", tone: "pay" },
  ];
  const slide = slides[exactState.landingSlide] || slides[0];
  return `
    <main class="real-phone real-landing ${slide.tone} exact-${exactState.device}">
      <section class="real-landing-visual">
        <button class="real-slide-zone left" data-action="landing-prev" aria-label="Previous"></button>
        <button class="real-slide-zone right" data-action="landing-next" aria-label="Next"></button>
        <div class="real-exodus-mark">⟠</div>
        <span class="real-badge">${slide.badge}</span>
        <h1>${slide.title}</h1>
        <p>Simple. Powerful. Yours.</p>
      </section>
      <section class="real-landing-bottom">
        <p>Tap "Agree and continue" to accept our<br><strong>Terms of Service</strong> and <strong>Privacy Policy</strong>.</p>
        <button class="real-white-button" data-action="agree">Agree and continue</button>
      </section>
      <div class="real-slide-dots">
        ${slides.map((_, index) => `<span class="${index === exactState.landingSlide ? "active" : ""}"></span>`).join("")}
      </div>
      ${exactToast()}
    </main>
  `;
}

function renderRealAccess() {
  return `
    <main class="real-phone real-access exact-${exactState.device}">
      ${realTopBar({ back: "landing", title: "Get Started" })}
      <section class="real-access-hero">
        <div class="real-logo-circle">${exactImage("profile_logo") || "⟠"}</div>
        <h1>Exodus Wallet</h1>
        <p>Create a new wallet, or restore one with your recovery phrase.</p>
      </section>
      <section class="real-access-options">
        <button data-action="access-create">
          <strong>Create a new wallet</strong>
          <span>Generate a secure 12-word recovery phrase.</span>
        </button>
        <button data-action="access-restore">
          <strong>I already have a wallet</strong>
          <span>Restore using your recovery phrase.</span>
        </button>
      </section>
      <button class="real-secondary-wide" data-action="preview-wallet">Explore demo</button>
      ${exactToast()}
    </main>
  `;
}

function renderRealCreate() {
  return `
    <main class="real-phone real-create exact-${exactState.device}">
      ${realTopBar({ back: "access", title: "Secret Phrase" })}
      <section class="real-sheet-panel">
        <h1>Write it down</h1>
        <p>This is your 12-word recovery phrase. Save it offline — it restores this wallet in Exodus, MetaMask, or any standard wallet. Anyone with these words controls the funds.</p>
        <ol class="real-seed-grid">
          ${(exactMnemonicWords(exactState.generatedMnemonic).length ? exactMnemonicWords(exactState.generatedMnemonic) : exactSeedWords).map((word, index) => `<li><span>${index + 1}</span>${word}</li>`).join("")}
        </ol>
        <button class="real-secondary-wide" data-action="copy-phrase">Copy phrase</button>
        <button class="real-primary-button" data-action="seed-saved">I saved my phrase</button>
      </section>
      ${exactToast()}
    </main>
  `;
}

function renderRealConfirm() {
  return `
    <main class="real-phone real-create exact-${exactState.device}">
      ${realTopBar({ back: "create", title: "Confirm Phrase" })}
      <section class="real-sheet-panel">
        <h1>Confirm phrase</h1>
        <p>Re-enter the requested words to confirm you saved them.</p>
        <div class="real-confirm-grid">
          <label>Word 3<input data-confirm-index="3" placeholder="word 3" autocomplete="off" /></label>
          <label>Word 8<input data-confirm-index="8" placeholder="word 8" autocomplete="off" /></label>
          <label>Word 12<input data-confirm-index="12" placeholder="word 12" autocomplete="off" /></label>
        </div>
        <button class="real-primary-button" data-action="phrase-confirmed">Confirm phrase</button>
      </section>
      ${exactToast()}
    </main>
  `;
}

function renderRealRestore() {
  return `
    <main class="real-phone real-create exact-${exactState.device}">
      ${realTopBar({ back: "access", title: "Restore Wallet" })}
      <section class="real-sheet-panel">
        <h1>Restore your wallet</h1>
        <p>Enter your 12 or 24-word recovery phrase from any wallet. It stays on this device — only the derived public address is used to read balances.</p>
        <label class="real-field-label">Secret recovery phrase <small>(kept local, never sent)</small></label>
        <textarea data-access-field="restorePhrase" placeholder="word 1  word 2  word 3 …">${exactState.restorePhrase}</textarea>
        <label class="real-field-label">Or a public address to watch <small>(optional)</small></label>
        <input class="real-text-input" data-access-field="restoreAddress" placeholder="0x…" value="${exactState.restoreAddress}" />
        <button class="real-primary-button" data-action="phrase-confirmed">Continue</button>
      </section>
      ${exactToast()}
    </main>
  `;
}

function renderRealPin() {
  const mode = exactState.pinMode || "set";
  const confirming = exactState.pinStage === "confirm";
  const title = mode === "unlock" ? "Enter PIN" : mode === "send" ? "Confirm with PIN" : confirming ? "Confirm PIN" : "Create a PIN";
  const sub = mode === "unlock"
    ? "Enter your PIN to unlock your wallet."
    : mode === "send"
      ? "Enter your PIN to authorize this transaction."
      : confirming
        ? "Re-enter your PIN to confirm."
        : "Set a 6-digit PIN to secure this wallet on this device.";
  const len = exactState.pinEntry.length;
  const dots = Array.from({ length: EXACT_PIN_LENGTH }, (_, i) => `<span class="${i < len ? "filled" : ""}"></span>`).join("");
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "‹"];
  const showBack = mode === "send";
  return `
    <main class="real-phone real-pin exact-${exactState.device}">
      <section class="real-pin-panel">
        ${showBack ? `<button class="real-pin-back" data-action="back" aria-label="Back">‹</button>` : ""}
        <div class="real-pin-logo">${exactImage("profile_logo") || "⟠"}</div>
        <h1>${title}</h1>
        <p>${sub}</p>
        <div class="real-pin-dots ${exactState.pinError ? "error" : ""}">${dots}</div>
        <em class="real-pin-error">${exactState.pinError || ""}</em>
        <div class="real-keypad real-pin-keypad">
          ${keys.map((key) => key === "" ? "<span></span>" : `<button data-action="pin-key" data-key="${key}">${key}</button>`).join("")}
        </div>
        ${mode === "unlock" ? `<button class="real-pin-reset" data-action="pin-forgot">Forgot PIN? Reset wallet</button>` : ""}
      </section>
      ${exactToast()}
    </main>
  `;
}

function renderRealHome() {
  const enabled = exactSortedEnabledTokens();
  const pending = exactPendingSummary();
  // Pending receives/sends are folded into the headline total (Exodus-style).
  const total = exactPortfolioValue() + pending.net;
  const portfolio = exactMoneyParts(total);
  const segments = exactRingSegments();
  const isEmpty = !total || total <= 0;
  return `
    <main class="real-phone real-home exact-${exactState.device}">
      <div class="real-scroll">
        <header class="real-home-top">
          <button class="real-avatar" data-action="profile">${exactImage("exodus_small") || "⟠"}</button>
          <button class="real-search-round" data-action="assets" aria-label="Search assets">⌕</button>
        </header>
        <section class="real-portfolio-hero">
          <button class="real-portfolio-ring ${isEmpty ? "is-empty" : ""}" data-action="${exactIsLive() ? "sync-balances" : "assets"}" aria-label="Wallet balance">
            <svg viewBox="0 0 420 420" aria-hidden="true">
              <circle class="track" cx="210" cy="210" r="174"></circle>
              ${segments.map((segment) => `<circle class="segment" cx="210" cy="210" r="174" pathLength="100" style="stroke:${segment.color};stroke-dasharray:${segment.length.toFixed(2)} ${(100 - segment.length).toFixed(2)};stroke-dashoffset:${(-segment.offset).toFixed(2)}"></circle>`).join("")}
            </svg>
            <span class="real-portfolio-amount">
              <b>${portfolio.whole}</b><small>.${portfolio.cents}</small>
            </span>
            ${pending.has ? `<span class="real-portfolio-pending">pending…</span>` : ""}
          </button>
          <button class="real-holdings-sort" data-action="holdings-sort">${exactHoldingsSortLabel()} <span>⌄</span></button>
          ${exactState.showHoldingsSort ? `
            <div class="real-holdings-menu">
              <button class="${exactState.holdingsSort === "highest" ? "active" : ""}" data-action="set-holdings-sort" data-sort="highest">Highest value</button>
              <button class="${exactState.holdingsSort === "lowest" ? "active" : ""}" data-action="set-holdings-sort" data-sort="lowest">Lowest value</button>
            </div>
          ` : ""}
        </section>
        <section class="real-list">
          ${isEmpty && exactIsLive() ? `<div class="real-zero-hint"><strong>No balances yet</strong><span>Receive crypto to this wallet, or pull to refresh once it is funded.</span></div>` : ""}
          ${enabled.map((token) => realHoldingRow(token)).join("")}
          <button class="real-add-more" data-action="add-token">Add More</button>
        </section>
      </div>
      <nav class="real-bottom-dock">
        <button data-action="assets">▣</button>
        <button data-action="detail" data-token="ethereum">⇄</button>
        <button data-action="open-access">$</button>
      </nav>
      ${exactToast()}
    </main>
  `;
}

function renderRealDetail() {
  const token = exactToken();
  const network = exactSelectedNetwork(token);
  const points = exactRangePoints(token);
  const chartPoints = exactChartPoints(points);
  const chart = exactChartPath(points);
  const area = exactAreaPath(points);
  const tokenTx = exactTokenTransactions(token.id);
  const activityGroups = exactActivityGroups(tokenTx);
  const balance = exactTokenBalance(token);
  const lastPoint = chartPoints[chartPoints.length - 1] || { x: 622, y: 139 };
  return `
    <main class="real-phone real-detail exact-${exactState.device}" style="--asset:${token.color}">
      <div class="real-scroll with-dock">
        <header class="real-detail-top">
          <button data-action="back" aria-label="Back">‹</button>
          <button data-action="assets" aria-label="More">•••</button>
        </header>
        <section class="real-detail-hero">
          ${exactIcon(token, "real-large-icon")}
          <h1>${exactTokenPriceLabel(token)}</h1>
          <p>${token.name} <strong>${exactRangeChange(token)}</strong></p>
          ${exactNetworks(token).length > 1 && network.label !== token.name ? `<small class="real-detail-network">${network.label}</small>` : ""}
        </section>
        <section class="real-chart-wrap">
          <svg viewBox="0 0 649 318" preserveAspectRatio="none">
            <defs>
              <linearGradient id="realFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="${token.color}" stop-opacity="0.28" />
                <stop offset="100%" stop-color="${token.color}" stop-opacity="0" />
              </linearGradient>
              <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur"></feGaussianBlur>
                <feMerge><feMergeNode in="blur"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
              </filter>
            </defs>
            <line x1="0" y1="54" x2="649" y2="54"></line>
            <line x1="0" y1="287" x2="649" y2="287"></line>
            <text x="27" y="48">${exactTokenPriceLabel(token)}</text>
            <text x="27" y="280">${exactChartLowLabel(token, points)}</text>
            <path d="${area}" fill="url(#realFill)"></path>
            <path d="${chart}" class="glow" fill="none" stroke="${token.color}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="${chart}" fill="none" stroke="${token.color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"></path>
            <circle cx="${lastPoint.x.toFixed(1)}" cy="${lastPoint.y.toFixed(1)}" r="18" fill="${token.color}" opacity="0.28"></circle>
            <circle cx="${lastPoint.x.toFixed(1)}" cy="${lastPoint.y.toFixed(1)}" r="11" fill="${token.color}"></circle>
            <circle cx="${lastPoint.x.toFixed(1)}" cy="${lastPoint.y.toFixed(1)}" r="3.8" fill="#fff" opacity="0.9"></circle>
          </svg>
        </section>
        <div class="real-ranges">
          ${["LIVE", "1D", "7D", "1M", "3M", "6M", "1Y"].map((range) => `<button class="${exactState.activeRange === range ? "active" : ""}" data-action="range" data-range="${range}">${range === "LIVE" ? "<i></i>" : ""}${range}</button>`).join("")}
        </div>
        <section class="real-balance-card">
          <span><strong>${balance}</strong><small>${token.symbol}</small></span>
          <span><strong>${exactTokenValue(token)}</strong><small>Value</small></span>
          ${exactNetworks(token).length > 1 ? `<button data-action="manage-token" data-token="${token.id}">Balance by Network <strong>${network.tag}</strong><em>⌄</em></button>` : ""}
        </section>
        <section class="real-history">
          <h2>ACTIVITY</h2>
          ${activityGroups.length ? activityGroups.map((group) => `
            <div class="real-activity-group">
              <h3>${group.day}</h3>
              ${group.items.map((tx) => {
                const visual = exactActivityVisual(tx);
                return `
                <button class="real-tx-row ${tx.direction} ${tx.status} ${visual.tone}" data-action="txdetail" data-tx="${tx.id}">
                  <span class="real-tx-icon ${visual.tone}">${exactTransferArrow(visual.icon)}</span>
                  <strong>${visual.label}<small>${tx.time || exactShortHash(tx.hash)}</small></strong>
                  <em>${tx.amount}<small>${tx.value}</small></em>
                </button>
              `;
              }).join("")}
            </div>
          `).join("") : `<p>You don't have any ${token.symbol} activity yet.</p>`}
        </section>
      </div>
      ${realActionDock(token)}
      ${exactToast()}
    </main>
  `;
}

function renderRealSend() {
  const token = exactToken();
  const network = exactSelectedNetwork(token);
  const balanceNum = Number(String(exactTokenBalance(token)).replace(/,/g, "")) || 0;
  const amountNum = Number(exactState.sendAmount) || 0;
  const usdValue = amountNum * exactTokenPriceNumber(token);
  const insufficient = amountNum > balanceNum;
  const hasRecipient = Boolean((exactState.sendTo || "").trim());
  const canSend = amountNum > 0 && !insufficient && hasRecipient;
  const remaining = Math.max(balanceNum - amountNum, 0);
  return `
    <main class="real-phone real-send exact-${exactState.device}" style="--asset:${token.color}">
      ${realTopBar({ back: "detail", title: `Send ${token.symbol}`, right: `<button data-action="assets">▦</button>` })}
      <section class="real-send-to">
        <label>To <input data-send-field="to" value="${exactEscape(exactState.sendTo)}" placeholder="${network.tag} address" autocomplete="off" spellcheck="false" /></label>
      </section>
      <section class="real-send-amount">
        <span>${network.tag} NETWORK</span>
        <label><input data-send-field="amount" inputmode="decimal" value="${exactState.sendAmount}" placeholder="0" autofocus /><b>${token.symbol}</b></label>
        <p>${exactFormatUsd(usdValue)}</p>
        ${insufficient
          ? `<em class="real-send-warn">Not enough ${token.symbol} · you have ${exactTokenBalance(token)}</em>`
          : `<em class="real-send-avail">Available ${exactTokenBalance(token)} ${token.symbol}</em>`}
      </section>
      <section class="real-send-token">
        ${exactIcon(token)}
        <strong>${token.name}<small>${network.label} · ${exactTokenValue(token)}</small></strong>
        <button data-action="max-send">Max</button>
      </section>
      <section class="real-fee-card">
        <span>Remaining <strong>${exactFormatAmount(remaining)} ${token.symbol}</strong></span>
        <span>Max Network Fee <strong>≈ 0.000029 ${exactNetworkFeeSymbol(token)}</strong></span>
      </section>
      <div class="real-keypad">
        ${["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "‹"].map((key) => `<button data-action="keypad" data-key="${key}">${key}</button>`).join("")}
      </div>
      <button class="real-primary-button real-send-submit${canSend ? "" : " is-disabled"}" data-action="send-submit">${insufficient ? "Insufficient balance" : "Send"}</button>
      ${exactToast()}
    </main>
  `;
}

function exactRelativeTime(tx) {
  if (tx.createdAt) {
    const mins = Math.floor((Date.now() - tx.createdAt) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }
  if (tx.day && tx.day !== "Pending") return tx.time && tx.time !== "Pending" ? `${tx.day} · ${tx.time}` : tx.day;
  return tx.status === "pending" ? "Just now" : "Recently";
}

function renderRealTxDetail() {
  const tx = exactState.transactions.find((item) => item.id === exactState.selectedTx);
  if (!tx) {
    exactState.screen = "detail";
    return renderRealDetail();
  }
  const token = exactTokens.find((item) => item.id === tx.token) || exactToken();
  const outgoing = tx.direction === "outgoing";
  const pending = tx.status === "pending";
  const titleWord = pending ? (outgoing ? "Sending" : "Receiving") : (outgoing ? "Sent" : "Received");
  const amountClean = String(tx.amount || "").replace(/^[+-]/, "");
  const counterLabel = outgoing ? "Sent to" : "Received to";
  const counterAddress = tx.address || exactReceiveAddress(token);
  const card = (label, valueHtml, extraClass = "") => `
    <section class="real-txd-card ${extraClass}">
      <span>${label}</span>
      <strong>${valueHtml}</strong>
    </section>`;
  return `
    <main class="real-phone real-txdetail exact-${exactState.device}" style="--asset:${token.color}">
      ${realTopBar({ back: "detail", title: "TRANSACTION DETAILS", right: `<button data-action="copy-txid">⧉</button>` })}
      <div class="real-scroll">
        ${pending ? `<section class="real-txd-card status"><span>Status</span><strong class="pending">● Pending confirmation</strong></section>` : ""}
        ${card(titleWord, `${amountClean}${tx.value ? `<small>${tx.value}</small>` : ""}`, "amount")}
        ${outgoing ? card("Fee", tx.fee || `≈ 0.000029 ${exactNetworkFeeSymbol(token)}`) : ""}
        <section class="real-txd-card">
          <span>Personal Note</span>
          <button class="real-txd-note" data-action="add-note">Add Note</button>
        </section>
        ${card("Created", exactRelativeTime(tx))}
        ${card(counterLabel, `<code>${exactEscape(counterAddress)}</code>`, "addr")}
        ${card("Transaction ID", `<code>${exactEscape(tx.hash || "-")}</code>`, "addr")}
      </div>
      ${exactToast()}
    </main>
  `;
}

function renderRealReceive() {
  const token = exactToken();
  const network = exactSelectedNetwork(token);
  const address = exactReceiveAddress(token);
  const networkPill = exactNetworks(token).length > 1
    ? `<button class="real-network-pill" data-action="manage-token" data-token="${token.id}">${exactNetworkBadge(network, "tiny")} ${network.tag} NETWORK⌄</button>`
    : `<span class="real-network-pill static">${exactNetworkBadge(network, "tiny")} ${network.tag} NETWORK</span>`;
  // Live wallet, network we can't yet derive a real address for: never show a
  // fake address/QR — be explicit instead.
  if (!address) {
    return `
    <main class="real-phone real-receive exact-${exactState.device}" style="--asset:${token.color}">
      <button class="real-receive-back" data-action="back" aria-label="Back">‹</button>
      <section class="real-receive-card">
        <button class="real-handle" data-action="back" aria-label="Back"></button>
        ${networkPill}
        ${exactIcon(token, "real-receive-icon")}
        <h1>Coming soon</h1>
        <p>Receiving ${token.symbol} on the ${network.label} network isn't available in this wallet yet. Use Bitcoin or an Ethereum/EVM network for now.</p>
        <button class="real-primary-button" data-action="back">Back</button>
      </section>
      ${exactToast()}
    </main>
  `;
  }
  return `
    <main class="real-phone real-receive exact-${exactState.device}" style="--asset:${token.color}">
      <button class="real-receive-back" data-action="back" aria-label="Back">‹</button>
      <section class="real-receive-card">
        <button class="real-handle" data-action="back" aria-label="Back"></button>
        ${networkPill}
        ${exactIcon(token, "real-receive-icon")}
        <div class="real-qr">
          ${exactQrSvg(address)}
        </div>
        <h1>Your ${token.name} Address</h1>
        <button class="real-address" data-action="copy-address"><code>${address}</code><strong>⧉</strong></button>
        <p>Receive ${token.symbol} on the ${network.label} network.</p>
        <button class="real-primary-button" data-action="copy-address">Copy address</button>
      </section>
      ${exactToast()}
    </main>
  `;
}

function exactTokenSearchText(token) {
  return [
    token.name,
    token.symbol,
    token.tokenKind,
    ...exactNetworks(token).flatMap((network) => [network.label, network.tag, network.id]),
  ].join(" ").toLowerCase();
}

function exactTokenMatchesFilter(token) {
  if (exactState.assetFilter === "all") return true;
  if (exactState.assetFilter === "tokens") return token.tokenKind === "token";
  if (exactState.assetFilter === "main") return token.tokenKind === "native" || exactTokenEnabled(token);
  return exactNetworks(token).some((network) => network.id === exactState.assetFilter);
}

function exactAssetRows() {
  const search = exactState.assetSearch.trim().toLowerCase();
  return exactTokens
    .filter((token) => exactTokenMatchesFilter(token))
    .filter((token) => !search || exactTokenSearchText(token).includes(search));
}

function exactVisibleNetworks(token) {
  const search = exactState.assetSearch.trim().toLowerCase();
  const networks = exactNetworks(token);
  const filterNetwork = !["main", "all", "tokens"].includes(exactState.assetFilter);
  if (filterNetwork) return networks.filter((network) => network.id === exactState.assetFilter);
  const visible = networks.filter((network) => !search || `${network.label} ${network.tag} ${network.id}`.toLowerCase().includes(search));
  return visible.length ? visible : networks;
}

function exactToggleMark(active) {
  return `<em class="${active ? "active" : "idle"}">${active ? "✓" : ""}</em>`;
}

function renderRealAssets({ addMode = false } = {}) {
  const rows = exactAssetRows();
  const returnAction = addMode ? (exactState.returnToScreen || "home") : "home";
  const filters = exactChainFilters;
  return `
    <main class="real-phone real-assets ${addMode ? "real-assets-add" : ""} exact-${exactState.device}">
      ${realTopBar({ back: returnAction, title: addMode ? "ADD ASSETS" : "ASSETS", right: addMode ? `<button data-action="${returnAction}">✓</button>` : `<button data-action="add-token">⊕</button>` })}
      <label class="real-search"><span>⌕</span><input data-action="asset-search" value="${exactState.assetSearch}" placeholder="Search" /></label>
      <div class="real-chip-row">
        ${filters.map(([id, label]) => `<button class="${exactState.assetFilter === id ? "active" : ""}" data-action="asset-filter" data-filter="${id}">${label}</button>`).join("")}
      </div>
      <section class="real-scroll-list">
        ${rows.length ? rows.map((token) => {
          const networks = exactNetworks(token);
          const visibleNetworks = exactVisibleNetworks(token);
          const multiNetwork = networks.length > 1;
          const selectedNetwork = exactSelectedNetwork(token);
          const enabledCount = exactEnabledNetworks(token).length;
          const search = exactState.assetSearch.trim().toLowerCase();
          const networkMatch = search && networks.some((network) => `${network.label} ${network.tag} ${network.id}`.toLowerCase().includes(search));
          const filterNetwork = !["main", "all", "tokens"].includes(exactState.assetFilter);
          const autoExpanded = networkMatch || filterNetwork;
          const expanded = multiNetwork && !exactState.collapsedAssets.has(token.id) && (exactState.expandedAsset === token.id || autoExpanded);
          const firstNetwork = visibleNetworks[0] || networks[0];
          return `
            <div class="real-manage-card">
              <button class="real-manage-main" data-action="${multiNetwork ? "toggle-asset" : "toggle-network"}" data-token="${token.id}" data-network="${firstNetwork.id}" ${multiNetwork ? `aria-expanded="${expanded}"` : ""}>
                ${exactIcon(token)}
                <span>
                  <strong>${token.name}</strong> <small>${token.symbol}</small>
                  ${multiNetwork ? `<b>${enabledCount} of ${networks.length} networks enabled</b>` : ""}
                </span>
                ${multiNetwork ? `<em class="chevron">${expanded ? "⌃" : "⌄"}</em>` : exactToggleMark(exactState.enabledNetworkKeys.has(exactNetworkKey(token.id, firstNetwork.id)))}
              </button>
              ${expanded ? `<div class="real-network-list">
                ${visibleNetworks.map((network) => `
                  <button data-action="toggle-network" data-token="${token.id}" data-network="${network.id}" class="${selectedNetwork.id === network.id ? "selected" : ""}">
                    <span class="real-network-icon">${exactIcon(token, "mini")}${exactNetworkBadge(network, "overlay")}</span>
                    <span>${network.label}<small>${network.tag}</small></span>
                    ${exactToggleMark(exactState.enabledNetworkKeys.has(exactNetworkKey(token.id, network.id)))}
                  </button>
                `).join("")}
              </div>` : ""}
            </div>
          `;
        }).join("") : `<div class="real-empty-state"><strong>No assets found</strong><span>Try a token name, symbol, or network.</span></div>`}
      </section>
      ${exactToast()}
    </main>
  `;
}

function renderRealProfile() {
  return `
    <main class="real-phone real-profile exact-${exactState.device}">
      <button class="real-profile-back" data-action="back" aria-label="Back">‹</button>
      <div class="real-scroll">
        <section class="real-profile-head">
          <button class="real-logo-circle" data-action="home">${exactImage("profile_logo") || "⟠"}</button>
          <h1>Exodus <button data-action="open-access">♢</button></h1>
        </section>
        <section class="real-feature-grid">
          <button data-action="assets"><strong>${exactImage("feature_assets") || "⬡"}</strong><span>Assets</span></button>
          <button data-action="open-access"><strong>${exactImage("feature_web3") || "◇"}</strong><span>Web3</span></button>
          <button data-action="open-access"><strong>${exactImage("feature_nfts") || "◒"}</strong><span>NFTs</span></button>
          <button data-action="settings"><strong>${exactImage("feature_settings") || "✣"}</strong><span>Settings</span></button>
        </section>
        <section class="real-profile-list">
          <button data-action="open-access"><strong>${exactImage("exodus_pay") || "$"}</strong><span>Exodus Pay</span><em>NEW</em></button>
          <button data-action="open-access"><strong>${exactImage("support") || "◉"}</strong><span>Support</span></button>
        </section>
      </div>
      <div class="real-bottom-curve"><span></span></div>
      ${exactToast()}
    </main>
  `;
}

function renderRealWalletCard() {
  const live = exactIsLive();
  const statusLine = exactRuntime.status ? `<small>${exactRuntime.status}</small>` : "";
  return `
    <section class="real-wallet-card">
      <div class="real-wallet-card-head">
        <span class="real-wallet-mode ${live ? "live" : "preview"}">${live ? "● Live" : "○ Demo"}</span>
        <strong>${live ? exactFormatUsd(exactPortfolioValue()) : "Demo portfolio"}</strong>
      </div>
      <code>${live && exactRuntime.address ? exactRuntime.address : "No live wallet loaded"}</code>
      <div class="real-wallet-card-actions">
        ${live ? `<button data-action="sync-balances"${exactRuntime.loading ? " disabled" : ""}>${exactRuntime.loading ? "Syncing…" : "Refresh balances"}</button>` : ""}
        <button data-action="access-restore">${live ? "Restore another" : "Restore wallet"}</button>
        ${live ? `<button data-action="switch-preview">Demo</button>` : ""}
      </div>
      ${statusLine}
    </section>
  `;
}

function renderRealSettings() {
  const rows = [
    ["♡", "Help Improve Exodus", "›", ""],
    ["▭", "Portfolios", "", "toggle"],
    ["⌗", "Connect Ledger", "›", ""],
    ["▢", "Connect Trezor", "›", ""],
    ["◌", "Portfolio Animation", "", "toggle"],
    ["⌕", "Review Unverified Tokens", "›", ""],
    ["↻", "Refresh Balances", "›", "refresh"],
    ["▣", "Sync Devices", "›", ""],
    ...(exactHasPin() ? [["⚷", "Lock Wallet", "›", "lock"]] : []),
    ["↺", "Restore Wallet", "›", "restore"],
    ["⌫", "Delete Wallet", "›", "delete"],
  ];
  const actionFor = { restore: "access-restore", refresh: "sync-balances", delete: "delete-wallet", lock: "lock-wallet" };
  return `
    <main class="real-phone real-settings exact-${exactState.device}">
      <section class="real-settings-sheet">
        <button class="real-handle" data-action="back" aria-label="Back"></button>
        <h1>Settings</h1>
        ${renderRealWalletCard()}
        <div class="real-settings-list">
          ${rows.map(([icon, label, arrow, type]) => `
            <button data-action="${actionFor[type] || "noop"}">
              <strong>${icon}</strong>
              <span>${label}</span>
              ${type === "toggle" ? "<em></em>" : `<small>${arrow}</small>`}
            </button>
          `).join("")}
        </div>
        <p>Exodus 26.6.24</p>
      </section>
      ${exactToast()}
    </main>
  `;
}

function renderRealAddToken() {
  return renderRealAssets({ addMode: true });
}

function renderRealMobileScreens() {
  // A locked wallet (or any PIN prompt) takes precedence over every screen.
  if (exactState.locked || exactState.screen === "pin") return renderRealPin();
  if (exactState.screen === "landing") return renderRealLanding();
  if (exactState.screen === "access") return renderRealAccess();
  if (exactState.screen === "create") return renderRealCreate();
  if (exactState.screen === "confirm") return renderRealConfirm();
  if (exactState.screen === "restore") return renderRealRestore();
  if (exactState.screen === "detail") return renderRealDetail();
  if (exactState.screen === "txdetail") return renderRealTxDetail();
  if (exactState.screen === "send") return renderRealSend();
  if (exactState.screen === "receive") return renderRealReceive();
  if (exactState.screen === "assets") return renderRealAssets();
  if (exactState.screen === "add-token") return renderRealAddToken();
  if (exactState.screen === "profile") return renderRealProfile();
  if (exactState.screen === "settings") return renderRealSettings();
  return renderRealHome();
}

function renderExactMobileScreens() {
  return renderRealMobileScreens();
}

function exactRender() {
  const phoneWidth = 649;
  const scale = exactScale(phoneWidth);
  // `zoom` (not transform:scale) keeps the scaled canvas in normal document
  // flow, so inner scroll areas scroll natively/smoothly and nothing is clipped.
  exactRoot.innerHTML = `
    <div class="exact-frame exact-device-${exactState.device}" style="zoom:${scale}">
      ${renderExactMobileScreens()}
    </div>
  `;
}

exactRoot.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  if (target.dataset.action === "noop") return;
  if (target.dataset.action === "asset-search") return;
  if (target.dataset.token) exactState.selected = target.dataset.token;
  if (target.dataset.action !== "keypad") exactState.toast = "";
  if (!["holdings-sort", "set-holdings-sort"].includes(target.dataset.action)) {
    exactState.showHoldingsSort = false;
  }
  if (target.dataset.action === "back") {
    exactGoBack();
    exactRender();
    return;
  }
  if (target.dataset.action === "landing-prev") {
    exactState.landingSlide = (exactState.landingSlide + 2) % 3;
  }
  if (target.dataset.action === "landing-next") {
    exactState.landingSlide = (exactState.landingSlide + 1) % 3;
  }
  if (target.dataset.action === "agree") exactState.screen = "access";
  if (target.dataset.action === "access") exactState.screen = "access";
  if (target.dataset.action === "landing") exactState.screen = "landing";
  if (target.dataset.action === "access-create") {
    exactState.onboardingMode = "create";
    exactState.generatedMnemonic = exactNewMnemonic();
    exactState.screen = "create";
  }
  if (target.dataset.action === "access-restore") {
    exactState.onboardingMode = "restore";
    exactState.screen = "restore";
  }
  if (target.dataset.action === "create") exactState.screen = "create";
  if (target.dataset.action === "confirm") exactState.screen = "confirm";
  if (target.dataset.action === "restore") exactState.screen = "restore";
  if (target.dataset.action === "copy-phrase") {
    try { navigator.clipboard?.writeText(exactState.generatedMnemonic); } catch { /* ignore */ }
    exactState.toast = "Phrase copied — store it safely";
  }
  if (target.dataset.action === "seed-saved") exactState.screen = "confirm";
  if (target.dataset.action === "phrase-confirmed") {
    if (exactState.onboardingMode === "restore") {
      const phrase = exactState.restorePhrase.trim();
      const address = exactResolveRestore(phrase || exactState.restoreAddress);
      if (!address) {
        exactState.toast = "Enter a valid recovery phrase or 0x address";
        exactRender();
        return;
      }
      exactState.restoreResolvedAddress = address;
    } else if (exactState.onboardingMode === "create") {
      const words = exactMnemonicWords(exactState.generatedMnemonic);
      const expected = { 3: words[2], 8: words[7], 12: words[11] };
      const entered = {};
      exactRoot.querySelectorAll("[data-confirm-index]").forEach((input) => {
        entered[input.dataset.confirmIndex] = input.value.trim().toLowerCase();
      });
      const ok = words.length === 12 && Object.keys(expected).every((index) => entered[index] === expected[index]);
      if (!ok) {
        exactState.toast = "Those words don't match — check your phrase";
        exactRender();
        return;
      }
    }
    exactStartPinSetup();
  }
  if (target.dataset.action === "preview-wallet") {
    exactEnterPreviewWallet();
    exactState.screen = "home";
  }
  if (target.dataset.action === "pin-key") {
    const key = target.dataset.key;
    exactState.pinError = "";
    if (key === "‹") {
      exactState.pinEntry = exactState.pinEntry.slice(0, -1);
      exactRender();
      return;
    }
    if (exactState.pinEntry.length >= EXACT_PIN_LENGTH) {
      exactRender();
      return;
    }
    exactState.pinEntry += key;
    if (exactState.pinEntry.length === EXACT_PIN_LENGTH) {
      exactHandlePinComplete();
      return;
    }
    exactRender();
    return;
  }
  if (target.dataset.action === "pin-forgot") {
    exactResetWallet();
    exactState.screen = "landing";
    exactState.toast = "Wallet reset — restore with your recovery phrase";
    exactRender();
    return;
  }
  if (target.dataset.action === "lock-wallet") {
    if (!exactHasPin()) {
      exactState.toast = "No PIN set for this wallet";
      exactRender();
      return;
    }
    exactLockWallet();
    exactRender();
    return;
  }
  if (target.dataset.action === "sync-balances") {
    exactSyncLiveBalances();
    return;
  }
  if (target.dataset.action === "switch-preview") {
    exactEnterPreviewWallet();
    exactState.toast = "Showing demo portfolio";
  }
  if (target.dataset.action === "delete-wallet") {
    exactResetWallet();
    exactState.screen = "landing";
    exactState.toast = "Wallet removed from this device";
  }
  if (target.dataset.action === "open-access") {
    exactState.toast = "This action will use the same secured wallet session.";
  }
  if (target.dataset.action === "holdings-sort") {
    exactState.showHoldingsSort = !exactState.showHoldingsSort;
  }
  if (target.dataset.action === "set-holdings-sort") {
    exactState.holdingsSort = target.dataset.sort === "lowest" ? "lowest" : "highest";
    exactState.showHoldingsSort = false;
  }
  if (target.dataset.action === "range") exactState.activeRange = target.dataset.range;
  if (target.dataset.action === "asset-filter") {
    exactState.assetFilter = target.dataset.filter;
    exactState.collapsedAssets.clear();
  }
  if (target.dataset.action === "manage-token") {
    const token = exactTokens.find((item) => item.id === target.dataset.token) || exactToken();
    exactState.selected = token.id;
    exactState.expandedAsset = token.id;
    exactState.assetFilter = token.tokenKind === "token" ? "tokens" : "main";
    exactState.returnToScreen = exactState.screen;
    exactState.screen = "add-token";
  }
  if (target.dataset.action === "toggle-asset") {
    if (exactState.collapsedAssets.has(target.dataset.token)) {
      exactState.collapsedAssets.delete(target.dataset.token);
      exactState.expandedAsset = target.dataset.token;
    } else if (exactState.expandedAsset === target.dataset.token) {
      exactState.collapsedAssets.add(target.dataset.token);
      exactState.expandedAsset = "";
    } else {
      exactState.collapsedAssets.delete(target.dataset.token);
      exactState.expandedAsset = target.dataset.token;
    }
  }
  if (target.dataset.action === "toggle-network") {
    const token = exactTokens.find((item) => item.id === target.dataset.token);
    const network = token && exactNetworks(token).find((item) => item.id === target.dataset.network);
    const directAddMode = exactState.screen === "add-token" && (!exactState.returnToScreen || exactState.returnToScreen === "home");
    if (token && network) {
      if (directAddMode) exactToggleEnabledNetwork(token, network);
      else exactToggleNetwork(token, network);
    }
  }
  if (target.dataset.action === "max-send") {
    exactState.sendAmount = exactTokenBalance(exactToken()).replace(/,/g, "");
  }
  if (target.dataset.action === "keypad") {
    const key = target.dataset.key;
    if (key === "‹") exactState.sendAmount = exactState.sendAmount.slice(0, -1);
    else if (key === "." && exactState.sendAmount.includes(".")) {
      exactState.sendAmount = exactState.sendAmount;
    } else {
      exactState.sendAmount = `${exactState.sendAmount}${key}`;
    }
  }
  if (target.dataset.action === "send-submit") {
    const token = exactToken();
    const network = exactSelectedNetwork(token);
    const amount = exactState.sendAmount || "0";
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      exactState.toast = "Enter an amount";
      exactRender();
      return;
    }
    const balanceNum = Number(String(exactTokenBalance(token)).replace(/,/g, "")) || 0;
    if (numericAmount > balanceNum) {
      exactState.toast = `Not enough ${token.symbol} to send`;
      exactRender();
      return;
    }
    const recipient = (exactState.sendTo || "").trim();
    if (!recipient) {
      exactState.toast = `Enter a ${network.tag} recipient address`;
      exactRender();
      return;
    }
    // Live wallet can only sign for networks we actually support.
    if (exactIsLive() && !EXACT_EVM_CHAIN_IDS[network.id]) {
      exactState.toast = network.id === "bitcoin"
        ? "Bitcoin sending is coming soon"
        : `Sending ${token.symbol} on ${network.label} isn't available yet`;
      exactRender();
      return;
    }
    exactState.pendingSend = { tokenId: token.id, networkId: network.id, amount, to: recipient };
    if (exactHasPin()) {
      // Require the PIN to authorize the transaction.
      exactState.pinMode = "send";
      exactState.pinStage = "";
      exactState.pinEntry = "";
      exactState.pinError = "";
      exactState.screen = "pin";
      exactRender();
      return;
    }
    exactCompleteSend();
  }
  if (target.dataset.action === "copy-address") {
    const address = exactReceiveAddress(exactToken());
    if (!address) {
      exactState.toast = "No address available for this network yet";
    } else {
      try {
        navigator.clipboard?.writeText(address);
      } catch {
        /* clipboard unavailable */
      }
      exactState.toast = "Address copied";
    }
  }
  if (target.dataset.action === "txdetail") {
    exactState.selectedTx = target.dataset.tx;
    exactState.screen = "txdetail";
  }
  if (target.dataset.action === "copy-txid") {
    const tx = exactState.transactions.find((item) => item.id === exactState.selectedTx);
    try {
      navigator.clipboard?.writeText(tx ? tx.hash : "");
    } catch {
      /* clipboard unavailable */
    }
    exactState.toast = "Transaction ID copied";
  }
  if (target.dataset.action === "add-note") {
    exactState.toast = "Notes are stored locally — coming soon";
  }
  if (target.dataset.action === "detail") exactState.screen = "detail";
  if (target.dataset.action === "send") exactState.screen = "send";
  if (target.dataset.action === "receive") exactState.screen = "receive";
  if (target.dataset.action === "assets") {
    exactState.returnToScreen = "";
    exactState.screen = "assets";
  }
  if (target.dataset.action === "add-token") {
    exactState.returnToScreen = "home";
    exactState.screen = "add-token";
  }
  if (target.dataset.action === "profile") exactState.screen = "profile";
  if (target.dataset.action === "settings") exactState.screen = "settings";
  if (target.dataset.action === "home") exactState.screen = "home";
  if (target.dataset.action === "device") {
    exactState.device = target.dataset.device === "ios" ? "ios" : "android";
    try {
      window.localStorage?.setItem("exx.exact.device", exactState.device);
    } catch {
      /* storage unavailable */
    }
  }
  exactRender();
});

exactRoot.addEventListener("input", (event) => {
  if (event.target.matches("[data-access-field='restorePhrase']")) {
    exactState.restorePhrase = event.target.value;
  }
  if (event.target.matches("[data-access-field='restoreAddress']")) {
    exactState.restoreAddress = event.target.value;
  }
  if (event.target.matches("[data-action='asset-search']")) {
    exactState.assetSearch = event.target.value;
    exactState.collapsedAssets.clear();
    exactRender();
    const input = exactRoot.querySelector("[data-action='asset-search']");
    input?.focus();
    input?.setSelectionRange(exactState.assetSearch.length, exactState.assetSearch.length);
  }
  if (event.target.matches("[data-send-field='amount']")) {
    exactState.sendAmount = event.target.value;
  }
  if (event.target.matches("[data-send-field='to']")) {
    exactState.sendTo = event.target.value;
  }
});

// Manual refresh — re-pull balances (EVM + non-EVM), pending and prices.
function exactRefreshAll() {
  if (!exactIsLive() || !exactRuntime.unlocked || exactState.locked) return;
  exactState.toast = "Refreshing…";
  exactRender();
  exactSyncLiveBalances();
  exactFetchPrices();
}

// Pull-to-refresh: a downward drag while a scroll area is already at the top
// triggers a refresh (Exodus-style). Listeners live on the persistent root.
(function exactWirePullToRefresh() {
  if (!exactRoot.addEventListener) return;
  let startY = 0;
  let pulling = false;
  let scroller = null;
  exactRoot.addEventListener("touchstart", (event) => {
    scroller = event.target.closest?.(".real-scroll, .real-scroll-list");
    pulling = Boolean(scroller) && scroller.scrollTop <= 0;
    startY = event.touches ? event.touches[0].clientY : 0;
  }, { passive: true });
  exactRoot.addEventListener("touchmove", (event) => {
    if (!pulling || !scroller) return;
    if (scroller.scrollTop > 0) { pulling = false; return; }
  }, { passive: true });
  exactRoot.addEventListener("touchend", (event) => {
    if (!pulling || !scroller) { pulling = false; return; }
    const endY = event.changedTouches ? event.changedTouches[0].clientY : startY;
    if (endY - startY > 70) exactRefreshAll();
    pulling = false;
    scroller = null;
  }, { passive: true });
})();

window.addEventListener?.("resize", exactRender);
exactRestoreRuntime();
exactRender();
if (exactIsLive() && exactRuntime.unlocked && !exactState.locked) exactSyncLiveBalances();
exactFetchPrices();

// Poll the mempool feed so pending receives appear without a manual refresh,
// and refresh spot prices so USD values stay accurate.
if (typeof setInterval === "function") {
  setInterval(() => {
    if (exactIsLive() && exactRuntime.unlocked && !exactState.locked) exactFetchPending();
  }, 30000);
  setInterval(() => { exactFetchPrices(); }, 60000);
  // Periodic full balance refresh so confirmed non-EVM receives appear.
  setInterval(() => {
    if (exactIsLive() && exactRuntime.unlocked && !exactState.locked) exactFetchChainBalances();
  }, 45000);
}

window.EXX_EXACT_DEBUG = { exactState, exactTokens, exactIcon, exactRender, exactRuntime, exactSyncLiveBalances };
