# EXX Wallet Live Integration Notes

The working app build is `exx-wallet-app.html`.

What is wired:

- Browser wallet connection through an injected EIP-1193 wallet.
- Ethereum send flow through the browser wallet, so the app never receives a private key.
- Ankr RPC balance sync for Ethereum, Polygon, BSC, Arbitrum, and Optimism.
- ERC-20 balance lookup for the registered token contracts.
- Pending transaction polling with `eth_getTransactionByHash` and `eth_getTransactionReceipt`.
- Incoming Ethereum transfer scanning through block polling.
- Balance rule: confirmed balance + pending incoming - pending outgoing.
- Persistence to either Firebase REST, a backend API, or a local encrypted browser mirror.

Config fields in the app:

- Ankr token: required for live sync in this environment; paste your Ankr RPC key in the app config panel.
- Firebase project, Firebase API key, Firebase ID token: enables Firestore REST writes.
- Backend API: optional secure server endpoint. The app sends `PUT /api/{collection}/{id}` with JSON records.

Security boundary:

- This build does not ask for or capture real Exodus recovery phrases.
- Live signing is handled by the user’s browser wallet.
- Stored vault metadata is AES-256-GCM encrypted before Firebase/local persistence.
- A production backend should own master keys and decrypt only on trusted server/admin paths.
