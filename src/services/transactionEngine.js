import { SUPPORTED_CHAINS } from "./chains.js";

export function classifyTransactionStatus({ transaction, receipt, confirmations = 0, requiredConfirmations = 12 }) {
  if (!transaction && !receipt) return "not_found";
  if (receipt?.status === "0x0") return "failed";
  if (receipt?.status === "0x1" && confirmations >= requiredConfirmations) return "confirmed";
  if (receipt?.status === "0x1") return "confirming";
  return "pending";
}

export async function lookupTransaction({ rpc, chainId, txHash }) {
  const chain = SUPPORTED_CHAINS[chainId];
  const [transaction, receipt, latestBlock] = await Promise.all([
    rpc.getTransactionByHash(chainId, txHash),
    rpc.getTransactionReceipt(chainId, txHash),
    rpc.getLatestBlock(chainId),
  ]);

  const minedBlock = receipt?.blockNumber ? Number.parseInt(receipt.blockNumber, 16) : null;
  const confirmations = minedBlock ? Math.max(latestBlock - minedBlock + 1, 0) : 0;

  return {
    chain: chainId,
    txHash,
    transaction,
    receipt,
    confirmations,
    status: classifyTransactionStatus({
      transaction,
      receipt,
      confirmations,
      requiredConfirmations: chain.confirmations,
    }),
  };
}

export function createLocalPendingTransaction({ userId, walletId, chain, from, to, amountUsd, amountNative, txHash }) {
  return {
    id: `local-${crypto.randomUUID()}`,
    txHash,
    userId,
    walletId,
    chain,
    from,
    to,
    amountUsd,
    amountNative,
    direction: "outgoing",
    source: "local",
    status: "pending",
    confirmations: 0,
    firstSeenAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createMempoolIncomingTransaction({ userId, walletId, chain, from, to, amountUsd, amountNative, txHash }) {
  return {
    id: `incoming-${crypto.randomUUID()}`,
    txHash,
    userId,
    walletId,
    chain,
    from,
    to,
    amountUsd,
    amountNative,
    direction: "incoming",
    source: "chain_scan",
    status: "pending",
    confirmations: 0,
    firstSeenAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function updatePendingTransaction(transaction, lookupResult) {
  const now = new Date().toISOString();
  if (lookupResult.status === "confirmed") {
    return {
      ...transaction,
      status: "confirmed",
      confirmations: lookupResult.confirmations,
      blockNumber: Number.parseInt(lookupResult.receipt.blockNumber, 16),
      updatedAt: now,
    };
  }

  if (lookupResult.status === "failed") {
    return {
      ...transaction,
      status: "failed",
      confirmations: lookupResult.confirmations,
      updatedAt: now,
    };
  }

  return {
    ...transaction,
    status: "pending",
    confirmations: lookupResult.confirmations,
    updatedAt: now,
  };
}

export async function scanIncomingNativeTransfers({ rpc, chainId, blockNumber, watchedAddresses }) {
  const watched = new Map(watchedAddresses.map((entry) => [entry.address.toLowerCase(), entry]));
  const block = await rpc.getBlockByNumber(chainId, blockNumber, true);
  const matches = [];

  for (const tx of block.transactions || []) {
    const watch = tx.to ? watched.get(tx.to.toLowerCase()) : null;
    if (!watch) continue;
    matches.push({
      txHash: tx.hash,
      userId: watch.userId,
      walletId: watch.walletId,
      chain: chainId,
      from: tx.from,
      to: tx.to,
      amountNativeWei: BigInt(tx.value || "0x0").toString(),
      blockNumber,
      status: "pending",
      source: "chain_scan",
      direction: "incoming",
    });
  }

  return matches;
}
