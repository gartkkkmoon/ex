export const FIREBASE_SCHEMA = {
  users: {
    path: "users/{id}",
    fields: ["uid", "email", "role", "status", "createdAt", "updatedAt"],
  },
  wallets: {
    path: "wallets/{walletId}",
    fields: ["walletId", "userId", "label", "addresses", "vaultRef", "status", "createdAt", "updatedAt"],
  },
  transactions: {
    path: "transactions/{txId}",
    fields: [
      "txId",
      "userId",
      "walletId",
      "chain",
      "txHash",
      "direction",
      "assetType",
      "from",
      "to",
      "amountRaw",
      "feeWei",
      "confirmations",
      "status",
      "timestamps",
    ],
  },
  admin_logs: {
    path: "admin_logs/{logId}",
    fields: ["logId", "adminUserId", "action", "targetType", "targetId", "metadata", "createdAt"],
  },
  system_status: {
    path: "system_status/{id}",
    fields: [
      "key",
      "chain",
      "status",
      "latestBlock",
      "lastScannedBlock",
      "lastSuccessAt",
      "lastErrorAt",
      "updatedAt",
    ],
  },
};
