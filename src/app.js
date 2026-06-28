import { SUPPORTED_CHAINS } from "./services/chains.js";
import { computeWalletTotals, summarizePortfolio } from "./services/balanceEngine.js";
import { createLocalPendingTransaction, createMempoolIncomingTransaction } from "./services/transactionEngine.js";
import { FIREBASE_SCHEMA } from "./services/firebaseSchema.js";
import { VAULT_SECURITY_RULES, encryptWalletPreview } from "./services/vault.js";
import { createStore } from "./services/firebaseStore.js";
import { checkAnkrHealth, createRpc, fetchLiveWalletSnapshot, fetchNativeBalances, fetchRegisteredTokenBalances, scanEthereumIncoming, trackPendingTransactions } from "./services/liveEngine.js";
import { connectInjectedWallet, hasInjectedWallet, sendNativeEthereum } from "./services/walletProvider.js";
import { hasAnkr, readRuntimeConfig, runtimeMode, saveRuntimeConfig } from "./services/runtimeConfig.js";
import { ADMIN_UI_SPEC_JSON, SYSTEM_ARCHITECTURE, UI_SPEC_JSON } from "./spec/systemSpec.js";
import { adminLogs, systemStatus, tokens, transactions, users, wallets } from "./state/demoData.js";

const app = document.querySelector("#app");

const state = {
  mode: "wallet",
  walletScreen: "home",
  selectedTokenId: "ethereum",
  assetSearch: "",
  adminView: "Overview",
  txFilter: "all",
  users: structuredClone(users),
  wallets: structuredClone(wallets),
  transactions: structuredClone(transactions),
  systemStatus: structuredClone(systemStatus),
  adminLogs: structuredClone(adminLogs),
  vaultPreview: null,
  runtimeConfig: readRuntimeConfig(),
  connectedAddress: "",
  connectedChainId: "",
  liveBalances: [],
  tokenBalances: [],
  livePortfolio: null,
  liveStatus: "Ready",
  liveError: "",
  persistenceStatus: "Not synced",
  lastScannedEthereumBlock: 0,
  syncTick: 0,
};

function money(value, options = {}) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: options.compact ? 0 : 2,
    maximumFractionDigits: options.compact ? 0 : 2,
  }).format(value || 0);
}

function compactHash(hash) {
  if (!hash) return "-";
  return `${hash.slice(0, 7)}...${hash.slice(-5)}`;
}

function titleCase(value) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function escapeAttr(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function getWallets() {
  state.wallets = computeWalletTotals(
    state.wallets.map(({ pendingIncoming, pendingOutgoing, mainBalanceUsd, ...wallet }) => wallet),
    state.transactions,
  );
  return state.wallets;
}

function getPortfolio() {
  return summarizePortfolio(getWallets());
}

function selectedToken() {
  return tokens.find((token) => token.id === state.selectedTokenId) || tokens[1];
}

function activeWallet() {
  return getWallets()[0];
}

function activeAddress() {
  return state.connectedAddress || activeWallet().addresses.ethereum;
}

function setPrimaryAddress(address) {
  state.connectedAddress = address;
  state.wallets = state.wallets.map((wallet, index) => index === 0
    ? {
        ...wallet,
        addresses: Object.fromEntries(Object.keys(SUPPORTED_CHAINS).map((chainId) => [chainId, address])),
      }
    : wallet);
}

function rpcClient() {
  return createRpc(state.runtimeConfig);
}

function tokenIcon(token, extraClass = "") {
  return `<span class="token-icon ${extraClass}" style="--token:${token.color}">${token.symbol.slice(0, 1)}</span>`;
}

function chainPill(chainId) {
  const chain = SUPPORTED_CHAINS[chainId];
  return `<span class="chain-pill" style="--chain:${chain.color}">${chain.label}</span>`;
}

function statusPill(status) {
  const tone = status.includes("confirmed") || status === "healthy" || status === "active" ? "ok" :
    status.includes("pending") || status === "degraded" || status === "watch" ? "warn" : "bad";
  return `<span class="status-pill ${tone}">${titleCase(status)}</span>`;
}

function chartPath(points, width = 314, height = 150) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(max - min, 1);
  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point - min) / range) * (height - 20) - 10;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function areaPath(points, width = 314, height = 150) {
  const line = chartPath(points, width, height);
  return `${line} L${width} ${height} L0 ${height} Z`;
}

function renderPhoneStatus() {
  return `
    <div class="phone-status">
      <span>8:11 PM</span>
      <span class="status-icons">●●◒</span>
    </div>
  `;
}

function renderWalletHome() {
  const portfolio = getPortfolio();
  const featured = tokens.slice(0, 5);
  return `
    ${renderPhoneStatus()}
    <div class="wallet-topline">
      <button class="icon-button" data-action="screen" data-screen="assets" aria-label="Manage assets">☷</button>
      <button class="icon-button" data-action="screen" data-screen="assets" aria-label="Search assets">⌕</button>
    </div>
    <section class="wallet-home">
      <div class="exodus-orb">◇</div>
      <h1>Exodus Wallet</h1>
      <div class="home-actions">
        <button data-action="screen" data-screen="send">＋ Buy</button>
        <button data-action="screen" data-screen="receive">↙ Receive</button>
      </div>
      <div class="portfolio-strip">
        <span>Main balance</span>
        <strong>${money(portfolio.mainBalanceUsd)}</strong>
        <small>${money(portfolio.pendingIncomingUsd)} pending in · ${money(portfolio.pendingOutgoingUsd)} pending out</small>
      </div>
      <div class="feature-grid">
        <button data-action="screen" data-screen="assets"><span>▰</span>Assets</button>
        <button data-action="admin"><span>◈</span>Web3</button>
        <button data-action="screen" data-screen="assets"><span>✦</span>NFTs</button>
        <button data-action="admin"><span>⚙</span>Settings</button>
      </div>
      <div class="mini-assets">
        ${featured.map(renderAssetCard).join("")}
      </div>
    </section>
    ${renderWalletBottomNav()}
  `;
}

function renderAssetCard(token) {
  const changeClass = token.change >= 0 ? "positive" : "negative";
  return `
    <button class="asset-card" data-action="token" data-token="${token.id}">
      ${tokenIcon(token)}
      <span class="asset-copy">
        <strong>${token.name}</strong>
        <small>${money(token.priceUsd)} <em class="${changeClass}">${token.change >= 0 ? "+" : ""}${token.change}%</em></small>
      </span>
      <span class="asset-symbol" style="color:${token.color}">${token.symbol}</span>
    </button>
  `;
}

function renderAssetDetail() {
  const token = selectedToken();
  const chart = chartPath(token.chart);
  const area = areaPath(token.chart);
  return `
    ${renderPhoneStatus()}
    <div class="wallet-topline">
      <button class="icon-button" data-action="screen" data-screen="home" aria-label="Back">‹</button>
      <button class="icon-button" data-action="screen" data-screen="assets" aria-label="Menu">⋯</button>
    </div>
    <section class="asset-detail">
      ${tokenIcon(token, "large")}
      <h2>${money(token.priceUsd)}</h2>
      <p>${token.name} <span class="${token.change >= 0 ? "positive" : "negative"}">${token.change >= 0 ? "+" : ""}${token.change}%</span></p>
      <svg class="price-chart" viewBox="0 0 314 150" role="img" aria-label="${token.name} chart">
        <defs>
          <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="${token.color}" stop-opacity="0.32" />
            <stop offset="100%" stop-color="${token.color}" stop-opacity="0" />
          </linearGradient>
        </defs>
        <path d="${area}" fill="url(#chartFill)"></path>
        <path d="${chart}" fill="none" stroke="${token.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
        <circle cx="314" cy="${150 - ((token.chart.at(-1) - Math.min(...token.chart)) / Math.max(Math.max(...token.chart) - Math.min(...token.chart), 1)) * 130 - 10}" r="5" fill="${token.color}"></circle>
      </svg>
      <div class="range-tabs">
        ${["LIVE", "1D", "7D", "1M", "3M", "6M", "1Y"].map((range, index) => `<button class="${index === 0 ? "active" : ""}">${range}</button>`).join("")}
      </div>
      <div class="balance-row">
        <span><strong>${token.balance}</strong><small>${token.symbol}</small></span>
        <span><strong>${money(token.valueUsd)}</strong><small>Value</small></span>
      </div>
      ${token.balance ? "" : `<p class="empty-note">You don't have any ${token.symbol} activity yet.</p>`}
      <div class="action-dock">
        <button data-action="screen" data-screen="send"><span>↗</span><small>Send</small></button>
        <button><span>⇄</span><small>Swap</small></button>
        <button><span>$</span><small>Buy/Sell</small></button>
        <button data-action="screen" data-screen="receive"><span>↙</span><small>Receive</small></button>
      </div>
    </section>
  `;
}

function renderAssetsManage() {
  const filtered = tokens.filter((token) => {
    const text = `${token.name} ${token.symbol}`.toLowerCase();
    return text.includes(state.assetSearch.toLowerCase());
  });

  return `
    ${renderPhoneStatus()}
    <div class="wallet-topline">
      <button class="icon-button" data-action="screen" data-screen="home" aria-label="Back">‹</button>
      <strong>ASSETS</strong>
      <button class="icon-button" aria-label="Add asset">⊕</button>
    </div>
    <section class="assets-manage">
      <label class="search-field">
        <span>⌕</span>
        <input value="${state.assetSearch}" data-action="asset-search" placeholder="Search" />
      </label>
      <div class="filter-chips">
        ${["Main", "Tokens", "ETH", "BSC"].map((chip, index) => `<button class="${index === 0 ? "active" : ""}">${chip}</button>`).join("")}
      </div>
      <div class="asset-list">
        ${filtered.map((token, index) => `
          <button class="manage-row" data-action="token" data-token="${token.id}">
            ${tokenIcon(token)}
            <span><strong>${token.name}</strong><small>${token.symbol}</small></span>
            <em>${index % 3 === 1 ? "›" : "✓"}</em>
          </button>
        `).join("")}
      </div>
    </section>
    ${renderWalletBottomNav()}
  `;
}

function renderSendScreen() {
  const token = selectedToken();
  const canSendLive = state.connectedAddress && token.id === "ethereum";
  return `
    ${renderPhoneStatus()}
    <div class="wallet-topline">
      <button class="icon-button" data-action="screen" data-screen="asset" aria-label="Back">‹</button>
      <strong>Send ${token.symbol}</strong>
      <button class="icon-button" aria-label="Scan">⌗</button>
    </div>
    <section class="flow-screen">
      ${tokenIcon(token, "large")}
      <label>Recipient <input id="send-to" value="0xc41d21F18bD6932Aa0f7f6C16D00FD8A0270A621" /></label>
      <label>Amount <input id="send-amount" value="0.0414" /></label>
      <button class="primary-flow" data-action="${canSendLive ? "send-live" : "simulate-send"}">${canSendLive ? "Send with browser wallet" : "Send"}</button>
      <p class="flow-note">${canSendLive ? "The wallet extension signs and broadcasts; this app never receives the private key." : "Connect a browser wallet to broadcast. Without one, this creates a local pending record for testing."}</p>
    </section>
  `;
}

function renderReceiveScreen() {
  const token = selectedToken();
  const address = activeAddress();
  return `
    ${renderPhoneStatus()}
    <div class="wallet-topline">
      <button class="icon-button" data-action="screen" data-screen="asset" aria-label="Back">‹</button>
      <strong>Receive ${token.symbol}</strong>
      <button class="icon-button" aria-label="Copy">⧉</button>
    </div>
    <section class="flow-screen">
      ${tokenIcon(token, "large")}
      <div class="qr-preview">
        ${Array.from({ length: 49 }).map((_, index) => `<span class="${(index * 7 + index) % 5 < 2 ? "on" : ""}"></span>`).join("")}
      </div>
      <code>${address}</code>
      <button class="primary-flow" data-action="simulate-incoming">Receive</button>
      <p class="flow-note">Incoming transfers show as Pending, then become Received after confirmation.</p>
    </section>
  `;
}

function renderWalletBottomNav() {
  return `
    <nav class="wallet-bottom-nav">
      <button data-action="screen" data-screen="assets" title="Assets">▰</button>
      <button data-action="token" data-token="ethereum" title="Swap">⇄</button>
      <button data-action="screen" data-screen="send" title="Buy/Sell">$</button>
    </nav>
  `;
}

function renderWallet() {
  const screen = state.walletScreen;
  const content = screen === "home" ? renderWalletHome() :
    screen === "assets" ? renderAssetsManage() :
    screen === "send" ? renderSendScreen() :
    screen === "receive" ? renderReceiveScreen() :
    renderAssetDetail();

  return `
    <main class="wallet-stage">
      <section class="phone-shell">${content}</section>
      <aside class="wallet-ledger">
        <div class="panel-heading">
          <span>Live Wallet State</span>
          <strong>${money(getPortfolio().mainBalanceUsd)}</strong>
        </div>
        ${renderIntegrationPanel()}
        ${renderBalanceFormula()}
        ${renderTransactionFeed(false)}
        <div class="schema-strip">
          <strong>Firebase Collections</strong>
          ${Object.values(FIREBASE_SCHEMA).map((schema) => `<code>${schema.path}</code>`).join("")}
        </div>
      </aside>
    </main>
  `;
}

function renderIntegrationPanel() {
  const config = state.runtimeConfig;
  const address = activeAddress();
  return `
    <section class="integration-panel">
      <div class="panel-heading compact">
        <span>Live APIs</span>
        <strong>${runtimeMode(config)}</strong>
      </div>
      <div class="integration-actions">
        <button data-action="connect-wallet">${state.connectedAddress ? "Wallet connected" : "Connect browser wallet"}</button>
        <button data-action="sync-live">Sync Ankr balances</button>
        <button data-action="persist-state">Sync Firebase/local</button>
      </div>
      <div class="config-grid">
        <label>Ankr token<input data-config-field="ankrApiToken" value="${escapeAttr(config.ankrApiToken)}" placeholder="required for live sync" /></label>
        <label>Firebase project<input data-config-field="firebaseProjectId" value="${escapeAttr(config.firebaseProjectId)}" placeholder="project-id" /></label>
        <label>Firebase API key<input data-config-field="firebaseApiKey" value="${escapeAttr(config.firebaseApiKey)}" placeholder="AIza..." /></label>
        <label>Firebase ID token<input data-config-field="firebaseIdToken" value="${escapeAttr(config.firebaseIdToken)}" placeholder="auth token" type="password" /></label>
        <label>Backend API<input data-config-field="backendBaseUrl" value="${escapeAttr(config.backendBaseUrl)}" placeholder="https://api.example.com" /></label>
      </div>
      <button class="save-config" data-action="save-config">Save API config</button>
      <div class="live-status">
        <span>${hasInjectedWallet() ? "Browser wallet available" : "No browser wallet detected"}</span>
        <code>${compactHash(address)}</code>
        <small>${state.liveStatus}${state.liveError ? ` · ${state.liveError}` : ""}</small>
        <small>${state.persistenceStatus}</small>
      </div>
      ${renderLiveBalances()}
    </section>
  `;
}

function renderLiveBalances() {
  if (!state.liveBalances.length && !state.tokenBalances.length) return "";
  const nativeRows = state.liveBalances.map((balance) => `
    <tr>
      <td>${chainPill(balance.chain)}</td>
      <td>${balance.ok ? `${Number(balance.displayBalance).toFixed(6)} ${SUPPORTED_CHAINS[balance.chain].symbol}` : "-"}</td>
      <td>${balance.ok ? balance.blockNumber.toLocaleString() : balance.error}</td>
    </tr>
  `).join("");
  const tokenRows = state.tokenBalances.map((balance) => `
    <tr>
      <td>${balance.symbol} on ${balance.chain}</td>
      <td>${balance.ok ? Number(balance.displayBalance).toFixed(6) : "-"}</td>
      <td>${balance.ok ? compactHash(balance.tokenAddress) : balance.error}</td>
    </tr>
  `).join("");

  return `
    <div class="table-wrap live-balance-table">
      <table>
        <thead><tr><th>Asset</th><th>Balance</th><th>Block / Contract</th></tr></thead>
        <tbody>${nativeRows}${tokenRows}</tbody>
      </table>
    </div>
  `;
}

function renderBalanceFormula() {
  const portfolio = getPortfolio();
  return `
    <div class="formula-box">
      <span>MAIN_BALANCE</span>
      <strong>${money(portfolio.mainBalanceUsd)}</strong>
      <small>${money(portfolio.confirmedUsd)} confirmed + ${money(portfolio.pendingIncomingUsd)} pending in - ${money(portfolio.pendingOutgoingUsd)} pending out</small>
    </div>
  `;
}

function renderTransactionFeed(compact = true) {
  const rows = state.transactions
    .filter((tx) => state.txFilter === "all" || tx.status.includes(state.txFilter))
    .slice(0, compact ? 6 : 8)
    .map((tx) => `
      <div class="tx-row">
        <span class="tx-direction ${tx.direction}">${tx.direction === "incoming" ? "↙" : "↗"}</span>
        <span>
          <strong>${tx.amountNative}</strong>
          <small>${compactHash(tx.txHash)} · ${tx.chain}</small>
        </span>
        ${statusPill(tx.status)}
      </div>
    `)
    .join("");

  return `<div class="tx-feed">${rows}</div>`;
}

function renderAdmin() {
  const view = state.adminView;
  return `
    <main class="admin-shell">
      <aside class="admin-sidebar">
        <strong class="brand-mark">EXX</strong>
        ${ADMIN_UI_SPEC_JSON.navigation.map((item) => `
          <button class="${view === item ? "active" : ""}" data-action="admin-view" data-view="${item}">${item}</button>
        `).join("")}
      </aside>
      <section class="admin-content">
        <div class="admin-topbar">
          <span>Secure Admin Control</span>
          <label class="search-field admin-search"><span>⌕</span><input placeholder="Search users, wallets, tx hashes" /></label>
          <button data-action="wallet">Open Wallet</button>
        </div>
        ${renderAdminOverview()}
      </section>
    </main>
  `;
}

function renderAdminOverview() {
  const view = state.adminView;
  if (view === "Users") return renderUsersView();
  if (view === "Wallets") return renderWalletsView();
  if (view === "Transactions") return renderTransactionsView();
  if (view === "RPC Health") return renderRpcView();
  if (view === "Mempool") return renderMempoolView();
  if (view === "Indexers") return renderIndexersView();
  return `
    <div class="admin-grid">
      ${renderMetric("Users", state.users.length, "2 active")}
      ${renderMetric("Active Wallets", getWallets().filter((wallet) => wallet.status === "active").length, "AES vault checked")}
      ${renderMetric("Pending Tx", state.transactions.filter((tx) => tx.status.includes("pending")).length, "waiting confirmation")}
      ${renderMetric("RPC p95", `${Math.max(...state.systemStatus.map((chain) => chain.latencyMs))}ms`, "Ankr only")}
    </div>
    <div class="admin-panels">
      <section class="ops-panel">
        <h2>Transaction Explorer</h2>
        ${renderFilterBar()}
        ${renderAdminTxTable()}
      </section>
      <section class="ops-panel">
        <h2>System Health</h2>
        ${renderSystemTable()}
      </section>
      <section class="ops-panel">
        <h2>Vault Boundary</h2>
        <ul class="security-list">${VAULT_SECURITY_RULES.map((rule) => `<li>${rule}</li>`).join("")}</ul>
        <button data-action="encrypt-preview">Run AES-256 vault preview</button>
        ${state.vaultPreview ? `<code class="vault-preview">${state.vaultPreview}</code>` : ""}
      </section>
      <section class="ops-panel">
        <h2>Architecture</h2>
        <div class="architecture-list">
          ${SYSTEM_ARCHITECTURE.backend.api.map((service) => `<span>${service}</span>`).join("")}
        </div>
      </section>
    </div>
  `;
}

function renderMetric(label, value, subtext) {
  return `
    <div class="metric-tile">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${subtext}</small>
    </div>
  `;
}

function renderFilterBar() {
  return `
    <div class="filter-bar">
      ${["all", "pending", "confirmed", "failed"].map((filter) => `
        <button class="${state.txFilter === filter ? "active" : ""}" data-action="tx-filter" data-filter="${filter}">${titleCase(filter)}</button>
      `).join("")}
    </div>
  `;
}

function renderAdminTxTable() {
  const rows = state.transactions
    .filter((tx) => state.txFilter === "all" || tx.status.includes(state.txFilter))
    .map((tx) => `
      <tr>
        <td><code>${compactHash(tx.txHash)}</code></td>
        <td>${chainPill(tx.chain)}</td>
        <td>${tx.userId}</td>
        <td>${tx.walletId}</td>
        <td>${tx.amountNative}</td>
        <td>${tx.confirmations}</td>
        <td>${statusPill(tx.status)}</td>
      </tr>
    `)
    .join("");

  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Hash</th><th>Chain</th><th>User</th><th>Wallet</th><th>Amount</th><th>Conf</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderSystemTable() {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Chain</th><th>Status</th><th>Latest</th><th>Scanned</th><th>Lag</th><th>Latency</th><th>Errors</th></tr></thead>
        <tbody>
          ${state.systemStatus.map((chain) => `
            <tr>
              <td>${chainPill(chain.chain)}</td>
              <td>${statusPill(chain.status)}</td>
              <td>${chain.latestBlock.toLocaleString()}</td>
              <td>${chain.scannedBlock.toLocaleString()}</td>
              <td>${chain.latestBlock - chain.scannedBlock}</td>
              <td>${chain.latencyMs}ms</td>
              <td>${chain.errors}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderUsersView() {
  return `
    <section class="ops-panel full">
      <h2>User Management</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Wallets</th><th>Last Seen</th><th>Risk</th></tr></thead>
          <tbody>
            ${state.users.map((user) => `
              <tr>
                <td>${user.id}</td>
                <td>${user.email}</td>
                <td>${titleCase(user.role)}</td>
                <td>${statusPill(user.status)}</td>
                <td>${state.wallets.filter((wallet) => wallet.userId === user.id).length}</td>
                <td>${user.lastSeen}</td>
                <td>${statusPill(user.risk)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderWalletsView() {
  return `
    <section class="ops-panel full">
      <h2>Wallet Inspection</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Wallet</th><th>User</th><th>ETH Address</th><th>Balance</th><th>Status</th><th>Encrypted</th></tr></thead>
          <tbody>
            ${getWallets().map((wallet) => `
              <tr>
                <td>${wallet.label}</td>
                <td>${wallet.userId}</td>
                <td><code>${compactHash(wallet.addresses.ethereum)}</code></td>
                <td>${money(wallet.mainBalanceUsd)}</td>
                <td>${statusPill(wallet.status)}</td>
                <td>${wallet.encrypted ? statusPill("active") : statusPill("failed")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderTransactionsView() {
  return `
    <section class="ops-panel full">
      <h2>Transaction Explorer</h2>
      ${renderFilterBar()}
      ${renderAdminTxTable()}
    </section>
  `;
}

function renderRpcView() {
  return `
    <section class="ops-panel full">
      <h2>RPC / Ankr Status Monitor</h2>
      ${renderSystemTable()}
    </section>
  `;
}

function renderMempoolView() {
  const pending = state.transactions.filter((tx) => tx.status.includes("pending"));
  return `
    <div class="admin-grid">
      ${renderMetric("Pending Queue", pending.length, "Ethereum priority")}
      ${renderMetric("Median Delay", `${42 + state.syncTick * 3}s`, "block polling")}
      ${renderMetric("P95 Delay", `${118 + state.syncTick * 4}s`, "incoming watch")}
    </div>
    <section class="ops-panel full">
      <h2>Mempool Delay Monitor</h2>
      ${renderTransactionFeed(false)}
    </section>
  `;
}

function renderIndexersView() {
  return `
    <section class="ops-panel full">
      <h2>Indexing Worker Status</h2>
      ${renderSystemTable()}
      <div class="admin-log-strip">
        ${state.adminLogs.map((log) => `<span><strong>${log.action}</strong><small>${log.target}</small></span>`).join("")}
      </div>
    </section>
  `;
}

function renderShell() {
  return `
    <div class="app-shell">
      <header class="app-header">
        <div>
          <span class="eyebrow">Multi-chain wallet + admin control</span>
          <h1>${state.mode === "wallet" ? "Wallet App" : "Admin Panel"}</h1>
        </div>
        <nav class="mode-switch">
          <button class="${state.mode === "wallet" ? "active" : ""}" data-action="wallet">Wallet</button>
          <button class="${state.mode === "admin" ? "active" : ""}" data-action="admin">Admin</button>
        </nav>
      </header>
      ${state.mode === "wallet" ? renderWallet() : renderAdmin()}
      <footer class="iteration-footer">
        <span>Iteration 1 implements screenshot-derived UI, Ankr-only service boundaries, Firebase schema, encrypted vault preview, pending tx flow, and computed balance rule.</span>
      </footer>
    </div>
  `;
}

function render() {
  app.innerHTML = renderShell();
}

function simulateHash() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function simulateSend() {
  const token = selectedToken();
  const wallet = getWallets()[0];
  const amount = Number(document.querySelector("#send-amount")?.value || "0.0414");
  const amountUsd = amount * token.priceUsd;
  state.transactions.unshift(
    createLocalPendingTransaction({
      userId: wallet.userId,
      walletId: wallet.id,
      chain: "ethereum",
      from: activeAddress(),
      to: document.querySelector("#send-to")?.value || "0xc41d21F18bD6932Aa0f7f6C16D00FD8A0270A621",
      amountUsd,
      amountNative: `${amount} ${token.symbol}`,
      txHash: simulateHash(),
    }),
  );
  state.walletScreen = "asset";
  render();
}

function simulateIncoming() {
  const token = selectedToken();
  const wallet = getWallets()[0];
  const amount = 0.025;
  state.transactions.unshift(
    createMempoolIncomingTransaction({
      userId: wallet.userId,
      walletId: wallet.id,
      chain: "ethereum",
      from: "0x22Bf954188Aef01Bc918D70288B6AfB847F17C91",
      to: activeAddress(),
      amountUsd: amount * token.priceUsd,
      amountNative: `${amount} ${token.symbol}`,
      txHash: simulateHash(),
    }),
  );
  state.walletScreen = "asset";
  render();
}

async function encryptPreview() {
  const wallet = getWallets()[0];
  const record = await encryptWalletPreview(
    {
      walletId: wallet.id,
      privateKey: "redacted-placeholder-not-a-real-key",
      addresses: wallet.addresses,
    },
    "preview-admin-passphrase",
  );
  state.vaultPreview = `${record.algorithm} · ${record.ciphertext.slice(0, 32)}... · keyId:${record.keyId}`;
  render();
}

async function connectWallet() {
  try {
    state.liveStatus = "Connecting browser wallet...";
    state.liveError = "";
    render();
    const connection = await connectInjectedWallet();
    state.connectedChainId = connection.chainId;
    setPrimaryAddress(connection.address);
    state.liveStatus = "Browser wallet connected";
    await persistState();
    await syncLiveBalances();
  } catch (error) {
    state.liveError = error.message;
    state.liveStatus = "Wallet connection failed";
    render();
  }
}

function saveConfigFromForm() {
  const nextConfig = { ...state.runtimeConfig };
  document.querySelectorAll("[data-config-field]").forEach((input) => {
    nextConfig[input.dataset.configField] = input.value.trim();
  });
  state.runtimeConfig = saveRuntimeConfig(nextConfig);
  state.liveStatus = "API config saved";
  state.persistenceStatus = `Persistence mode: ${runtimeMode(state.runtimeConfig)}`;
  render();
}

function updateTokenBalancesFromLive(nativeBalances, snapshot = null) {
  const priceByChain = {
    ethereum: tokens.find((token) => token.id === "ethereum")?.priceUsd || 0,
    bsc: tokens.find((token) => token.id === "bsc")?.priceUsd || 0,
  };
  const liveBySymbol = new Map();
  for (const asset of snapshot?.assets || []) {
    const symbol = asset.symbol?.toUpperCase();
    if (!symbol) continue;
    const previous = liveBySymbol.get(symbol);
    if (!previous || asset.balanceUsd > previous.balanceUsd) liveBySymbol.set(symbol, asset);
  }

  const nextTokens = tokens.map((token) => {
    const liveAsset = liveBySymbol.get(token.symbol.toUpperCase());
    if (liveAsset) {
      const balance = Number(liveAsset.balance);
      const priceUsd = liveAsset.tokenPrice || token.priceUsd;
      const valueUsd = liveAsset.balanceUsd || (Number.isFinite(balance) ? balance * priceUsd : token.valueUsd);
      return {
        ...token,
        priceUsd,
        balance: Number.isFinite(balance) ? balance : token.balance,
        valueUsd,
      };
    }
    if (token.id === "ethereum") {
      const balance = nativeBalances.find((entry) => entry.chain === "ethereum" && entry.ok);
      if (!balance) return token;
      const amount = Number(balance.displayBalance);
      return { ...token, balance: amount, valueUsd: amount * token.priceUsd };
    }
    if (token.id === "bsc") {
      const balance = nativeBalances.find((entry) => entry.chain === "bsc" && entry.ok);
      if (!balance) return token;
      const amount = Number(balance.displayBalance);
      return { ...token, balance: amount, valueUsd: amount * priceByChain.bsc };
    }
    return token;
  });

  tokens.splice(0, tokens.length, ...nextTokens);
  const confirmedUsd = tokens.reduce((total, token) => total + (token.valueUsd || 0), 0);
  state.wallets = state.wallets.map((wallet, index) => index === 0 ? { ...wallet, confirmedUsd } : wallet);
}

async function syncLiveBalances() {
  const address = activeAddress();
  if (!hasAnkr(state.runtimeConfig)) {
    state.liveStatus = "Ankr key required";
    state.liveError = "Paste an Ankr API key, save config, then sync again.";
    render();
    return;
  }
  try {
    state.liveStatus = "Syncing Ankr balances...";
    state.liveError = "";
    render();
    const rpc = rpcClient();
    const [nativeBalances, tokenBalances, health] = await Promise.all([
      fetchNativeBalances({ rpc, address }),
      fetchRegisteredTokenBalances({ rpc, address }),
      checkAnkrHealth({ rpc }),
    ]);
    let snapshot = null;
    try {
      snapshot = await fetchLiveWalletSnapshot({ rpc, address });
    } catch (snapshotError) {
      state.liveError = `Portfolio snapshot unavailable: ${snapshotError.message}`;
    }
    state.liveBalances = nativeBalances;
    state.tokenBalances = tokenBalances;
    state.livePortfolio = snapshot;
    state.systemStatus = health.map((entry) => ({
      chain: entry.chain,
      status: entry.status,
      latestBlock: entry.latestBlock,
      scannedBlock: entry.scannedBlock,
      latencyMs: entry.latencyMs,
      errors: entry.errors,
    }));
    updateTokenBalancesFromLive(nativeBalances, snapshot);
    state.liveStatus = "Ankr sync complete";
    await trackAndScan();
    await persistState();
  } catch (error) {
    state.liveError = error.message;
    state.liveStatus = "Ankr sync failed";
  }
  render();
}

async function sendLive() {
  const token = selectedToken();
  const wallet = activeWallet();
  const amount = Number(document.querySelector("#send-amount")?.value || "0");
  const to = document.querySelector("#send-to")?.value || "";
  try {
    state.liveStatus = "Waiting for browser wallet signature...";
    render();
    const txHash = await sendNativeEthereum({
      from: activeAddress(),
      to,
      amount,
    });
    state.transactions.unshift(
      createLocalPendingTransaction({
        userId: wallet.userId,
        walletId: wallet.id,
        chain: "ethereum",
        from: activeAddress(),
        to,
        amountUsd: amount * token.priceUsd,
        amountNative: `${amount} ${token.symbol}`,
        txHash,
      }),
    );
    state.walletScreen = "asset";
    state.liveStatus = "Broadcasted. Tracking pending transaction.";
    await persistState();
    await trackAndScan();
  } catch (error) {
    state.liveError = error.message;
    state.liveStatus = "Send failed";
  }
  render();
}

async function persistState() {
  const store = createStore(state.runtimeConfig);
  const now = new Date().toISOString();
  try {
    state.persistenceStatus = `Syncing ${store.kind}...`;
    const wallet = activeWallet();
    const encryptedVault = await encryptWalletPreview(
      {
        walletId: wallet.id,
        address: activeAddress(),
        custody: state.connectedAddress ? "external-browser-wallet" : "no-private-key-in-browser",
      },
      `vault-${wallet.id}-${activeAddress()}`,
    );
    await Promise.all([
      ...state.users.map((user) => store.upsert("users", user.id, { ...user, updatedAt: now })),
      ...getWallets().map((walletRecord) => store.upsert("wallets", walletRecord.id, {
        ...walletRecord,
        vault: encryptedVault,
        updatedAt: now,
      })),
      ...state.transactions.map((tx) => store.upsert("transactions", tx.id, { ...tx, updatedAt: now })),
      ...state.systemStatus.map((status) => store.upsert("system_status", status.chain, { ...status, updatedAt: now })),
    ]);
    state.persistenceStatus = store.kind === "firebase"
      ? "Firebase sync complete"
      : store.kind === "backend"
        ? "Backend API sync complete"
        : "Local encrypted mirror synced";
  } catch (error) {
    state.persistenceStatus = `Persistence failed: ${error.message}`;
  }
}

async function trackAndScan() {
  const rpc = rpcClient();
  const updates = await trackPendingTransactions({ rpc, transactions: state.transactions });
  state.transactions = state.transactions.map((tx) => {
    const lookup = updates.get(tx.id);
    if (!lookup) return tx;
    if (lookup.status === "confirmed") {
      return {
        ...tx,
        status: "confirmed",
        confirmations: lookup.confirmations,
        updatedAt: new Date().toISOString(),
      };
    }
    if (lookup.status === "failed") return { ...tx, status: "failed", updatedAt: new Date().toISOString() };
    return { ...tx, confirmations: lookup.confirmations, updatedAt: new Date().toISOString() };
  });

  const ethereumStatus = state.systemStatus.find((entry) => entry.chain === "ethereum");
  if (!ethereumStatus?.latestBlock) return;
  const fromBlock = state.lastScannedEthereumBlock ? state.lastScannedEthereumBlock + 1 : ethereumStatus.latestBlock;
  const toBlock = Math.min(ethereumStatus.latestBlock, fromBlock + 2);
  if (fromBlock > toBlock) return;

  const wallet = activeWallet();
  const matches = await scanEthereumIncoming({
    rpc,
    address: activeAddress(),
    wallet,
    fromBlock,
    toBlock,
  });
  state.lastScannedEthereumBlock = toBlock;
  const knownHashes = new Set(state.transactions.map((tx) => tx.txHash));
  matches
    .filter((match) => !knownHashes.has(match.txHash))
    .forEach((match) => {
      state.transactions.unshift({
        id: `scan-${match.txHash}`,
        txHash: match.txHash,
        userId: match.userId,
        walletId: match.walletId,
        chain: match.chain,
        from: match.from,
        to: match.to,
        amountUsd: 0,
        amountNative: `${match.amountNativeWei} wei`,
        direction: "incoming",
        source: "chain_scan",
        status: "pending",
        confirmations: 0,
        firstSeenAt: new Date().toISOString(),
      });
    });
}

function bindEvents() {
  app.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;

    const action = target.dataset.action;
    if (action === "wallet") state.mode = "wallet";
    if (action === "admin") state.mode = "admin";
    if (action === "screen") state.walletScreen = target.dataset.screen;
    if (action === "token") {
      state.selectedTokenId = target.dataset.token;
      state.walletScreen = "asset";
    }
    if (action === "admin-view") state.adminView = target.dataset.view;
    if (action === "tx-filter") state.txFilter = target.dataset.filter;
    if (action === "simulate-send") simulateSend();
    if (action === "simulate-incoming") simulateIncoming();
    if (action === "encrypt-preview") encryptPreview();
    if (action === "connect-wallet") connectWallet();
    if (action === "save-config") saveConfigFromForm();
    if (action === "sync-live") syncLiveBalances();
    if (action === "send-live") sendLive();
    if (action === "persist-state") persistState().then(render);

    if (!["simulate-send", "simulate-incoming", "encrypt-preview", "connect-wallet", "save-config", "sync-live", "send-live", "persist-state"].includes(action)) {
      render();
    }
  });

  app.addEventListener("input", (event) => {
    if (event.target.matches("[data-action='asset-search']")) {
      state.assetSearch = event.target.value;
      render();
      const input = document.querySelector("[data-action='asset-search']");
      input?.focus();
      input?.setSelectionRange(state.assetSearch.length, state.assetSearch.length);
    }
  });
}

async function advanceRealtimeState() {
  state.syncTick += 1;
  if (state.runtimeConfig.enablePolling && state.liveBalances.length) {
    try {
      await trackAndScan();
      await persistState();
      state.liveStatus = "Live pending tracker tick";
    } catch (error) {
      state.liveError = error.message;
      state.liveStatus = "Live pending tracker failed";
    }
    render();
    return;
  }

  state.transactions = state.transactions.map((tx) => {
    if (!tx.status.includes("pending")) return tx;
    const confirmations = tx.confirmations + (tx.source === "chain_scan" ? 2 : 1);
    if (confirmations >= 6) {
      return {
        ...tx,
        status: "confirmed",
        confirmations,
        updatedAt: new Date().toISOString(),
      };
    }
    return {
      ...tx,
      confirmations,
      updatedAt: new Date().toISOString(),
    };
  });

  state.systemStatus = state.systemStatus.map((chain, index) => ({
    ...chain,
    latestBlock: chain.latestBlock + 1 + (index % 2),
    scannedBlock: chain.scannedBlock + 1,
    latencyMs: Math.max(90, chain.latencyMs + (state.syncTick % 3) - 1),
  }));

  render();
}

bindEvents();
render();
setInterval(advanceRealtimeState, 5000);

window.EXX_DEBUG = {
  state,
  UI_SPEC_JSON,
  ADMIN_UI_SPEC_JSON,
  SYSTEM_ARCHITECTURE,
};
