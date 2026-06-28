import { AnkrRpcClient } from "./ankrRpc.js";
import { EVM_CHAIN_IDS, TOKEN_API_CHAIN_IDS, TOKEN_REGISTRY } from "./chains.js";
import { lookupTransaction, scanIncomingNativeTransfers } from "./transactionEngine.js";

export function createRpc(config) {
  return new AnkrRpcClient({ apiToken: config.ankrApiToken });
}

export async function fetchNativeBalances({ rpc, address, chains = EVM_CHAIN_IDS }) {
  const settled = await Promise.allSettled(
    chains.map((chainId) => rpc.getNativeBalance(chainId, address)),
  );

  return settled.map((result, index) => {
    const chainId = chains[index];
    if (result.status === "fulfilled") {
      return {
        ...result.value,
        ok: true,
      };
    }
    return {
      chain: chainId,
      address,
      ok: false,
      error: result.reason?.message || "Balance lookup failed",
    };
  });
}

export async function fetchRegisteredTokenBalances({ rpc, address, enabledNetworkKeys = null }) {
  const tokenKeyAliases = {
    AAVE: "aave",
    DAI: "dai",
    LINK: "chainlink",
    UNI: "uniswap",
    USDC: "usd-coin",
    USDT: "tether",
    WBTC: "wrapped-bitcoin",
  };
  const registry = enabledNetworkKeys
    ? TOKEN_REGISTRY.filter((token) => {
        const symbolKey = token.symbol.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const nameKey = token.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const aliases = [tokenKeyAliases[token.symbol], symbolKey, nameKey].filter(Boolean);
        return aliases.some((alias) => enabledNetworkKeys.has(`${alias}:${token.chain}`));
      })
    : TOKEN_REGISTRY;

  const settled = await Promise.allSettled(
    registry.map((token) => rpc.getErc20Balance(token.chain, token.address, address, token.decimals)),
  );

  return settled.map((result, index) => {
    const token = registry[index];
    if (result.status === "fulfilled") {
      return {
        ...token,
        ...result.value,
        ok: true,
      };
    }
    return {
      ...token,
      walletAddress: address,
      ok: false,
      error: result.reason?.message || "Token balance lookup failed",
    };
  });
}

function normalizeAnkrBalanceItem(item) {
  const balanceUsd = Number(item.balanceUsd ?? item.balanceUSD ?? item.usdBalance ?? 0);
  return {
    chain: item.blockchain || item.chain || "",
    symbol: item.tokenSymbol || item.symbol || item.contractTickerSymbol || "",
    name: item.tokenName || item.name || "",
    contractAddress: item.contractAddress || item.tokenAddress || "",
    balance: item.balance || item.tokenBalance || "0",
    balanceRaw: item.balanceRawInteger || item.rawBalance || item.balanceRaw || "",
    balanceUsd: Number.isFinite(balanceUsd) ? balanceUsd : 0,
    tokenPrice: Number(item.tokenPrice ?? item.price ?? 0) || 0,
    thumbnail: item.thumbnail || item.logoURI || "",
  };
}

export function normalizeAnkrAccountBalance(payload) {
  const assets = Array.isArray(payload?.assets) ? payload.assets : [];
  const totalUsd = Number(payload?.totalBalanceUsd ?? payload?.totalBalanceUSD ?? payload?.totalUsd ?? 0);
  return {
    totalUsd: Number.isFinite(totalUsd) ? totalUsd : 0,
    nextPageToken: payload?.nextPageToken || "",
    assets: assets.map(normalizeAnkrBalanceItem),
  };
}

export async function fetchAnkrAccountPortfolio({
  rpc,
  address,
  chains = TOKEN_API_CHAIN_IDS,
  onlyWhitelisted = false,
  pageSize = 100,
}) {
  const pages = [];
  let pageToken = "";
  do {
    const payload = await rpc.getAccountBalance({
      walletAddress: address,
      blockchain: chains,
      onlyWhitelisted,
      pageSize,
      pageToken,
    });
    const page = normalizeAnkrAccountBalance(payload);
    pages.push(page);
    pageToken = page.nextPageToken;
  } while (pageToken);

  return {
    totalUsd: pages.reduce((total, page) => total + page.totalUsd, 0),
    assets: pages.flatMap((page) => page.assets),
  };
}

export async function fetchLiveWalletSnapshot({ rpc, address, chains = TOKEN_API_CHAIN_IDS }) {
  const portfolio = await fetchAnkrAccountPortfolio({ rpc, address, chains });
  return {
    address,
    totalUsd: portfolio.totalUsd || portfolio.assets.reduce((total, asset) => total + asset.balanceUsd, 0),
    assets: portfolio.assets,
    updatedAt: new Date().toISOString(),
  };
}

export async function checkAnkrHealth({ rpc }) {
  const chainIds = EVM_CHAIN_IDS;
  const started = Date.now();
  const settled = await Promise.allSettled(chainIds.map((chainId) => rpc.getLatestBlock(chainId)));
  return settled.map((result, index) => {
    const chainId = chainIds[index];
    return {
      chain: chainId,
      status: result.status === "fulfilled" ? "healthy" : "failed",
      latestBlock: result.status === "fulfilled" ? result.value : 0,
      scannedBlock: result.status === "fulfilled" ? result.value : 0,
      latencyMs: Date.now() - started,
      errors: result.status === "fulfilled" ? 0 : 1,
      error: result.status === "rejected" ? result.reason?.message : "",
    };
  });
}

export async function trackPendingTransactions({ rpc, transactions }) {
  const pending = transactions.filter((tx) => tx.txHash && tx.status.includes("pending"));
  const updates = await Promise.allSettled(
    pending.map((tx) => lookupTransaction({ rpc, chainId: tx.chain, txHash: tx.txHash })),
  );

  return new Map(
    updates
      .map((result, index) => [pending[index].id, result])
      .filter(([, result]) => result.status === "fulfilled")
      .map(([id, result]) => [id, result.value]),
  );
}

export async function scanEthereumIncoming({ rpc, address, wallet, fromBlock, toBlock }) {
  const matches = [];
  for (let blockNumber = fromBlock; blockNumber <= toBlock; blockNumber += 1) {
    const blockMatches = await scanIncomingNativeTransfers({
      rpc,
      chainId: "ethereum",
      blockNumber,
      watchedAddresses: [{ address, userId: wallet.userId, walletId: wallet.id }],
    });
    matches.push(...blockMatches);
  }
  return matches;
}
