export const UI_SPEC_JSON = {
  app: "mobile_wallet",
  frame: { target: "mobile-first", bg: "#131528", safeArea: true, radius: 28 },
  theme: {
    colors: {
      bg: "#131528",
      panel: "#23263c",
      panel2: "#2b2e49",
      text: "#f7f7ff",
      muted: "#9ca0b8",
      purple: "#7457f2",
      violet: "#8e5cff",
      green: "#28e0b0",
      yellow: "#f8c62c",
      border: "#3b3f5c",
    },
    typography: {
      font: "Inter/System",
      heroValue: "48-56/700",
      title: "30-40/600",
      body: "16-20/500",
      label: "12-14/500",
    },
  },
  screens: ["walletHome", "assetDetail", "assetsManage", "send", "receive", "profileHub"],
  bottomNav: {
    type: "floating glass dock",
    position: "bottom safe-area",
    height: 74,
    radius: 36,
    active: "#7357f2",
  },
};

export const ADMIN_UI_SPEC_JSON = {
  app: "wallet_admin_ops",
  frame: { target: "desktop responsive", bg: "#0d1018", density: "compact" },
  layout: ["leftSidebar", "topBar", "statusStrip", "mainGrid", "detailDrawer"],
  navigation: ["Overview", "Users", "Wallets", "Transactions", "RPC Health", "Mempool", "Indexers"],
  screens: {
    users: ["userId", "email", "role", "status", "walletCount", "lastSeen", "riskFlag"],
    wallets: ["walletId", "user", "chains", "balanceUsd", "status", "encrypted"],
    transactions: ["txHash", "chain", "from", "to", "amount", "confirmations", "status", "age"],
    system: ["providerStatus", "p95Latency", "errorRate", "blockHeightDrift"],
  },
};

export const SYSTEM_ARCHITECTURE = {
  frontend: {
    wallet: "Mobile-first SPA matching the uploaded Exodus-style screenshots.",
    admin: "Separate desktop ops dashboard for users, wallets, transactions, RPC health, pending transfers, and indexers.",
  },
  backend: {
    api: ["RpcService", "BalanceService", "TransactionLookupService", "PendingTxTracker", "BlockScanner", "VaultService"],
    firebaseCollections: ["users", "wallets", "transactions", "admin_logs", "system_status"],
    security: [
      "Ankr API keys stay server-side.",
      "Private keys and mnemonics are AES-256-GCM encrypted before Firebase persistence.",
      "Frontend never receives master encryption keys or decrypted vault payloads.",
    ],
  },
  balanceRule: "MAIN_BALANCE = confirmed_balance + pending_incoming - pending_outgoing",
};
