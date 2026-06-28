const CONFIG_KEY = "exx.runtimeConfig.v1";

export const DEFAULT_RUNTIME_CONFIG = {
  ankrApiToken: "",
  firebaseProjectId: "",
  firebaseApiKey: "",
  firebaseIdToken: "",
  backendBaseUrl: "",
  enablePolling: true,
};

function safeJsonParse(value) {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

function getStorage() {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

export function readRuntimeConfig() {
  const storage = getStorage();
  const saved = storage ? safeJsonParse(storage.getItem(CONFIG_KEY)) : {};
  const injected = globalThis.window?.EXX_CONFIG || {};
  return {
    ...DEFAULT_RUNTIME_CONFIG,
    ...saved,
    ...injected,
  };
}

export function saveRuntimeConfig(config) {
  const storage = getStorage();
  const nextConfig = {
    ...DEFAULT_RUNTIME_CONFIG,
    ...config,
  };
  if (storage) storage.setItem(CONFIG_KEY, JSON.stringify(nextConfig));
  return nextConfig;
}

export function runtimeMode(config) {
  if (config.backendBaseUrl) return "Backend API";
  if (config.firebaseProjectId && config.firebaseApiKey && config.firebaseIdToken) return "Firebase REST";
  return "Local encrypted mirror";
}

export function hasAnkr(config) {
  return Boolean(config.ankrApiToken || config.allowPublicAnkr);
}
