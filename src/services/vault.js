const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();

function toBase64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function fromBase64(value) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

export async function derivePreviewKey(passphrase) {
  const digest = await crypto.subtle.digest("SHA-256", ENCODER.encode(passphrase));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptWalletPreview(payload, passphrase) {
  const key = await derivePreviewKey(passphrase);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    ENCODER.encode(JSON.stringify(payload)),
  );

  return {
    algorithm: "AES-256-GCM",
    encryptionVersion: 1,
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv),
    keyId: "backend-kms-required",
    createdAt: new Date().toISOString(),
  };
}

export async function decryptWalletPreview(vaultRecord, passphrase) {
  const key = await derivePreviewKey(passphrase);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(vaultRecord.iv) },
    key,
    fromBase64(vaultRecord.ciphertext),
  );

  return JSON.parse(DECODER.decode(plaintext));
}

export const VAULT_SECURITY_RULES = [
  "Private keys and seed phrases are encrypted before persistence.",
  "Frontend never receives the production master key.",
  "Production decryption belongs in backend Admin SDK or KMS-backed services only.",
  "Admin views expose vault status, never decrypted vault payloads.",
];
