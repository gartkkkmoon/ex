const ETHEREUM_CHAIN_ID = "0x1";

function ethereumProvider() {
  return globalThis.window?.ethereum || null;
}

export function hasInjectedWallet() {
  return Boolean(ethereumProvider());
}

export async function connectInjectedWallet() {
  const provider = ethereumProvider();
  if (!provider) {
    throw new Error("No browser wallet provider was found. Open this app in a browser with an EIP-1193 wallet extension.");
  }
  const accounts = await provider.request({ method: "eth_requestAccounts" });
  const address = accounts?.[0];
  if (!address) throw new Error("No wallet account was returned by the browser wallet.");
  return {
    address,
    chainId: await provider.request({ method: "eth_chainId" }),
  };
}

export function decimalToWeiHex(amount) {
  const [whole = "0", fraction = ""] = String(amount || "0").trim().split(".");
  const fractionWei = fraction.padEnd(18, "0").slice(0, 18);
  const wei = BigInt(whole || "0") * 10n ** 18n + BigInt(fractionWei || "0");
  return `0x${wei.toString(16)}`;
}

export async function sendNativeEthereum({ from, to, amount }) {
  const provider = ethereumProvider();
  if (!provider) throw new Error("Connect a browser wallet before sending.");

  const chainId = await provider.request({ method: "eth_chainId" });
  if (chainId !== ETHEREUM_CHAIN_ID) {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ETHEREUM_CHAIN_ID }],
    });
  }

  return provider.request({
    method: "eth_sendTransaction",
    params: [{
      from,
      to,
      value: decimalToWeiHex(amount),
    }],
  });
}
