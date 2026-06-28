const LOCAL_STORE_KEY = "exx.localMirror.v1";

function storage() {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

function readLocalStore() {
  const local = storage();
  if (!local) return {};
  try {
    return JSON.parse(local.getItem(LOCAL_STORE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeLocalStore(value) {
  const local = storage();
  if (local) local.setItem(LOCAL_STORE_KEY, JSON.stringify(value));
}

function firestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(firestoreValue) } };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(Object.entries(value).map(([key, child]) => [key, firestoreValue(child)])),
      },
    };
  }
  return { stringValue: String(value) };
}

function firestoreDocument(data) {
  return {
    fields: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, firestoreValue(value)])),
  };
}

export class LocalMirrorStore {
  constructor() {
    this.kind = "local";
  }

  async upsert(collection, id, data) {
    const all = readLocalStore();
    all[collection] = all[collection] || {};
    all[collection][id] = {
      ...data,
      mirroredAt: new Date().toISOString(),
    };
    writeLocalStore(all);
    return all[collection][id];
  }
}

export class FirebaseRestStore {
  constructor({ projectId, apiKey, idToken }) {
    this.kind = "firebase";
    this.projectId = projectId;
    this.apiKey = apiKey;
    this.idToken = idToken;
  }

  get enabled() {
    return Boolean(this.projectId && this.apiKey && this.idToken);
  }

  documentUrl(collection, id) {
    const encodedId = encodeURIComponent(id);
    return `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/${collection}/${encodedId}?key=${this.apiKey}`;
  }

  async upsert(collection, id, data) {
    if (!this.enabled) {
      throw new Error("Firebase REST requires projectId, apiKey, and an authenticated Firebase ID token.");
    }

    const response = await fetch(this.documentUrl(collection, id), {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.idToken}`,
      },
      body: JSON.stringify(firestoreDocument(data)),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Firebase REST ${response.status}: ${text || response.statusText}`);
    }
    return response.json();
  }
}

export class BackendApiStore {
  constructor({ baseUrl }) {
    this.kind = "backend";
    this.baseUrl = String(baseUrl || "").replace(/\/+$/, "");
  }

  get enabled() {
    return Boolean(this.baseUrl);
  }

  documentUrl(collection, id) {
    return `${this.baseUrl}/api/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`;
  }

  async upsert(collection, id, data) {
    if (!this.enabled) throw new Error("Backend API base URL is required.");

    const response = await fetch(this.documentUrl(collection, id), {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Backend API ${response.status}: ${text || response.statusText}`);
    }
    return response.json();
  }
}

export function createStore(config) {
  if (config.backendBaseUrl) {
    return new BackendApiStore({ baseUrl: config.backendBaseUrl });
  }
  if (config.firebaseProjectId && config.firebaseApiKey && config.firebaseIdToken) {
    return new FirebaseRestStore({
      projectId: config.firebaseProjectId,
      apiKey: config.firebaseApiKey,
      idToken: config.firebaseIdToken,
    });
  }
  return new LocalMirrorStore();
}
