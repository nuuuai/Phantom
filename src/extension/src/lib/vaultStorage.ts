import { decryptVaultValue, encryptVaultValue } from "@phantom/shared";

const DB_NAME = "phantom_vault";
const IDB_STORE = "crypto";
const IDB_KEY = "vault_key_material";

const SESSION_DEK = "phantom_vault_dek_b64";
/** @deprecated plaintext vault key — migrated to encrypted IndexedDB + session DEK */
const LEGACY_VAULT_HEX = "phantom_vault_key_hex";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = (): void => reject(req.error ?? new Error("indexedDB open failed"));
    req.onupgradeneeded = (): void => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = (): void => resolve(req.result);
  });
}

async function idbSetCiphertext(value: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.oncomplete = (): void => resolve();
      tx.onerror = (): void => reject(tx.error ?? new Error("idb write"));
      tx.objectStore(IDB_STORE).put(value, IDB_KEY);
    });
  } finally {
    db.close();
  }
}

async function idbGetCiphertext(): Promise<string | null> {
  const db = await openDb();
  try {
    const v = await new Promise<string | undefined>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const r = tx.objectStore(IDB_STORE).get(IDB_KEY);
      r.onsuccess = (): void => resolve(r.result as string | undefined);
      r.onerror = (): void => reject(r.error ?? new Error("idb read"));
    });
    return v ?? null;
  } finally {
    db.close();
  }
}

async function idbClear(): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.oncomplete = (): void => resolve();
      tx.onerror = (): void => reject(tx.error ?? new Error("idb clear"));
      tx.objectStore(IDB_STORE).delete(IDB_KEY);
    });
  } finally {
    db.close();
  }
}

function bytesToB64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function b64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

async function createDek(): Promise<{ key: CryptoKey; b64: string }> {
  const raw = new Uint8Array(32);
  crypto.getRandomValues(raw);
  const keyMaterial = new Uint8Array(raw);
  const key = await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  return { key, b64: bytesToB64(raw) };
}

async function importDekFromB64(b64: string): Promise<CryptoKey> {
  const raw = b64ToBytes(b64);
  const keyMaterial = new Uint8Array(raw);
  return crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function getSessionDek(): Promise<string | null> {
  const r = await chrome.storage.session.get(SESSION_DEK);
  const v = r[SESSION_DEK];
  return typeof v === "string" && v.length > 0 ? v : null;
}

async function setSessionDek(b64: string): Promise<void> {
  await chrome.storage.session.set({ [SESSION_DEK]: b64 });
}

/**
 * Encrypt vault key material (hex) with a random DEK; DEK lives in session storage,
 * ciphertext in IndexedDB (browser clears session when closed → vault locked).
 */
export async function persistVaultKeyHex(hex: string): Promise<void> {
  const { key, b64 } = await createDek();
  const ciphertext = await encryptVaultValue(key, hex);
  await setSessionDek(b64);
  await idbSetCiphertext(ciphertext);
  await chrome.storage.local.remove(LEGACY_VAULT_HEX);
}

export async function getVaultKeyHex(): Promise<string | null> {
  const dekB64 = await getSessionDek();
  const enc = await idbGetCiphertext();

  if (dekB64 && enc) {
    const dek = await importDekFromB64(dekB64);
    return decryptVaultValue(dek, enc);
  }

  const legacy = await chrome.storage.local.get(LEGACY_VAULT_HEX);
  const v = legacy[LEGACY_VAULT_HEX];
  if (typeof v === "string" && v.length > 0) {
    return v;
  }
  return null;
}

export async function clearVaultStorage(): Promise<void> {
  await chrome.storage.session.remove(SESSION_DEK);
  await chrome.storage.local.remove(LEGACY_VAULT_HEX);
  await idbClear();
}
