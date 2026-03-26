/* eslint-disable @typescript-eslint/no-explicit-any */
type WebCryptoKey = any;
type WebSubtleCrypto = {
  importKey(...args: any[]): Promise<WebCryptoKey>;
  deriveKey(...args: any[]): Promise<WebCryptoKey>;
  encrypt(...args: any[]): Promise<ArrayBuffer>;
  decrypt(...args: any[]): Promise<ArrayBuffer>;
  exportKey(format: string, key: WebCryptoKey): Promise<ArrayBuffer>;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

const PBKDF2_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const KEY_BITS = 256;

function getSubtle(): WebSubtleCrypto {
  const c = globalThis.crypto as { subtle?: WebSubtleCrypto } | undefined;
  if (c?.subtle) return c.subtle;
  throw new Error("SubtleCrypto not available in this environment");
}

function getRandomBytes(n: number): Uint8Array {
  const buf = new Uint8Array(n);
  (globalThis.crypto as { getRandomValues(b: Uint8Array): Uint8Array }).getRandomValues(buf);
  return buf;
}

function toBase64(buf: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(buf).toString("base64");
  }
  let binary = "";
  for (const byte of buf) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    const buf = Buffer.from(b64, "base64");
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function generateVaultSalt(): string {
  return toBase64(getRandomBytes(SALT_BYTES));
}

export async function deriveVaultKey(
  password: string,
  saltB64: string,
): Promise<WebCryptoKey> {
  const subtle = getSubtle();
  const enc = new TextEncoder();
  const keyMaterial = await subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: fromBase64(saltB64),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: KEY_BITS },
    true,
    ["encrypt", "decrypt"],
  );
}

export interface VaultPayload {
  ct: string;
  iv: string;
}

export async function encryptVaultValue(
  key: WebCryptoKey,
  plaintext: string,
): Promise<string> {
  const subtle = getSubtle();
  const iv = getRandomBytes(IV_BYTES);
  const enc = new TextEncoder();
  const cipherBuf = await subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext),
  );
  const payload: VaultPayload = {
    ct: toBase64(new Uint8Array(cipherBuf)),
    iv: toBase64(iv),
  };
  return JSON.stringify(payload);
}

export async function decryptVaultValue(
  key: WebCryptoKey,
  encrypted: string,
): Promise<string> {
  const subtle = getSubtle();
  const payload = JSON.parse(encrypted) as VaultPayload;
  const ct = fromBase64(payload.ct);
  const iv = fromBase64(payload.iv);
  const plainBuf = await subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(plainBuf);
}

export function generatePassword(length = 20): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+";
  const values = getRandomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    const byte = values[i] ?? 0;
    result += charset[byte % charset.length];
  }
  return result;
}

export async function exportKeyHex(key: WebCryptoKey): Promise<string> {
  const raw = await getSubtle().exportKey("raw", key);
  const bytes = new Uint8Array(raw);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function importKeyHex(hex: string): Promise<WebCryptoKey> {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return getSubtle().importKey(
    "raw",
    bytes,
    { name: "AES-GCM", length: KEY_BITS },
    true,
    ["encrypt", "decrypt"],
  );
}
