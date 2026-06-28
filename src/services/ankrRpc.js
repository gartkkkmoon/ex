import { SUPPORTED_CHAINS, buildAnkrMultichainUrl, buildAnkrUrl, tokenApiSlug } from "./chains.js";

const BALANCE_OF_SELECTOR = "0x70a08231";

function strip0x(value) {
  return value.replace(/^0x/i, "");
}

function padAddress(address) {
  return strip0x(address).toLowerCase().padStart(64, "0");
}

export function formatUnits(raw, decimals = 18) {
  const value = BigInt(raw || "0");
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const fraction = value % base;
  const fractionText = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
  return fractionText ? `${whole}.${fractionText}` : whole.toString();
}

export class AnkrRpcClient {
  constructor({ apiToken = "", endpoints = {} } = {}) {
    this.apiToken = apiToken;
    this.endpoints = endpoints;
    this.requestId = 1;
  }

  endpoint(chainId) {
    if (this.endpoints[chainId]) return this.endpoints[chainId];
    return buildAnkrUrl(chainId, this.apiToken);
  }

  multichainEndpoint() {
    if (this.endpoints.multichain) return this.endpoints.multichain;
    return buildAnkrMultichainUrl(this.apiToken);
  }

  assertEvmChain(chainId, method) {
    const chain = SUPPORTED_CHAINS[chainId];
    if (!chain) throw new Error(`Unsupported Ankr chain: ${chainId}`);
    if (chain.rpcFamily !== "evm") {
      throw new Error(`${method} requires an EVM Ankr RPC chain. ${chain.label} uses ${chain.rpcFamily}.`);
    }
  }

  async call(chainId, method, params = []) {
    if (!SUPPORTED_CHAINS[chainId]) {
      throw new Error(`Unsupported Ankr chain: ${chainId}`);
    }

    const response = await fetch(this.endpoint(chainId), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: this.requestId++,
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ankr RPC HTTP ${response.status} for ${chainId}:${method}`);
    }

    const payload = await response.json();
    if (payload.error) {
      throw new Error(payload.error.message || `Ankr RPC error for ${chainId}:${method}`);
    }
    return payload.result;
  }

  async getLatestBlock(chainId) {
    this.assertEvmChain(chainId, "eth_blockNumber");
    const result = await this.call(chainId, "eth_blockNumber");
    return Number.parseInt(result, 16);
  }

  async getNativeBalance(chainId, address, block = "latest") {
    this.assertEvmChain(chainId, "eth_getBalance");
    const [balanceHex, latestBlock] = await Promise.all([
      this.call(chainId, "eth_getBalance", [address, block]),
      this.getLatestBlock(chainId),
    ]);

    return {
      chain: chainId,
      address,
      balanceWei: BigInt(balanceHex).toString(),
      displayBalance: formatUnits(BigInt(balanceHex).toString(), 18),
      blockNumber: latestBlock,
    };
  }

  async getErc20Balance(chainId, tokenAddress, walletAddress, decimals = 18) {
    this.assertEvmChain(chainId, "eth_call");
    const data = `${BALANCE_OF_SELECTOR}${padAddress(walletAddress)}`;
    const result = await this.call(chainId, "eth_call", [{ to: tokenAddress, data }, "latest"]);
    const rawBalance = BigInt(result).toString();
    return {
      chain: chainId,
      tokenAddress,
      walletAddress,
      rawBalance,
      displayBalance: formatUnits(rawBalance, decimals),
    };
  }

  async getTransactionByHash(chainId, txHash) {
    this.assertEvmChain(chainId, "eth_getTransactionByHash");
    return this.call(chainId, "eth_getTransactionByHash", [txHash]);
  }

  async getTransactionReceipt(chainId, txHash) {
    this.assertEvmChain(chainId, "eth_getTransactionReceipt");
    return this.call(chainId, "eth_getTransactionReceipt", [txHash]);
  }

  async getBlockByNumber(chainId, blockNumber, fullTransactions = true) {
    this.assertEvmChain(chainId, "eth_getBlockByNumber");
    const hexBlock = `0x${Number(blockNumber).toString(16)}`;
    return this.call(chainId, "eth_getBlockByNumber", [hexBlock, fullTransactions]);
  }

  async advancedCall(method, params = {}) {
    const response = await fetch(this.multichainEndpoint(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: this.requestId++,
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ankr multichain HTTP ${response.status} for ${method}`);
    }

    const payload = await response.json();
    if (payload.error) {
      throw new Error(payload.error.message || `Ankr multichain error for ${method}`);
    }
    return payload.result;
  }

  async getAccountBalance({
    walletAddress,
    blockchain = [],
    onlyWhitelisted = false,
    pageSize = 100,
    pageToken = "",
  }) {
    const chains = blockchain.length ? blockchain.map((chainId) => tokenApiSlug(chainId)) : undefined;
    return this.advancedCall("ankr_getAccountBalance", {
      walletAddress,
      ...(chains ? { blockchain: chains } : {}),
      onlyWhitelisted,
      pageSize,
      pageToken,
    });
  }

  async getTokenPrice({ blockchain, contractAddress, symbol }) {
    return this.advancedCall("ankr_getTokenPrice", {
      blockchain: tokenApiSlug(blockchain),
      ...(contractAddress ? { contractAddress } : {}),
      ...(symbol ? { symbol } : {}),
    });
  }
}
