export function toNumber(rawValue) {
  const value = Number(rawValue);
  return Number.isFinite(value) ? value : 0;
}

export function computeMainBalance({ confirmed = 0, pendingIncoming = 0, pendingOutgoing = 0 }) {
  return toNumber(confirmed) + toNumber(pendingIncoming) - toNumber(pendingOutgoing);
}

export function computeWalletTotals(wallets, transactions) {
  return wallets.map((wallet) => {
    const pendingIncoming = transactions
      .filter((tx) => tx.walletId === wallet.id && tx.status !== "confirmed" && tx.direction === "incoming")
      .reduce((total, tx) => total + toNumber(tx.amountUsd), 0);

    const pendingOutgoing = transactions
      .filter((tx) => tx.walletId === wallet.id && tx.status !== "confirmed" && tx.direction === "outgoing")
      .reduce((total, tx) => total + toNumber(tx.amountUsd), 0);

    return {
      ...wallet,
      pendingIncoming,
      pendingOutgoing,
      mainBalanceUsd: computeMainBalance({
        confirmed: wallet.confirmedUsd,
        pendingIncoming,
        pendingOutgoing,
      }),
    };
  });
}

export function summarizePortfolio(wallets) {
  return wallets.reduce(
    (summary, wallet) => ({
      confirmedUsd: summary.confirmedUsd + toNumber(wallet.confirmedUsd),
      pendingIncomingUsd: summary.pendingIncomingUsd + toNumber(wallet.pendingIncoming),
      pendingOutgoingUsd: summary.pendingOutgoingUsd + toNumber(wallet.pendingOutgoing),
      mainBalanceUsd: summary.mainBalanceUsd + toNumber(wallet.mainBalanceUsd),
    }),
    {
      confirmedUsd: 0,
      pendingIncomingUsd: 0,
      pendingOutgoingUsd: 0,
      mainBalanceUsd: 0,
    },
  );
}
