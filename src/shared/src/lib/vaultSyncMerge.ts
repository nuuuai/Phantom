import type { Alias, AliasCategory } from "../types/alias.js";
import {
  decryptVaultValue,
  encryptVaultValue,
  importKeyHex,
} from "./vaultCrypto.js";

/** Opaque E2E blob schema (v1): one record per password alias id. */
export const VAULT_SYNC_SCHEMA_VERSION = 1 as const;

export interface VaultSyncEntryV1 {
  id: string;
  /** Milliseconds — used for last-write-wins merge. */
  updatedAt: number;
  encryptedValue: string | null;
  serviceName: string | null;
  serviceUrl: string | null;
  category?: AliasCategory;
}

export interface VaultSyncPlaintext {
  v: typeof VAULT_SYNC_SCHEMA_VERSION;
  entries: Record<string, VaultSyncEntryV1>;
}

export function emptyVaultSyncPlaintext(): VaultSyncPlaintext {
  return { v: VAULT_SYNC_SCHEMA_VERSION, entries: {} };
}

export function parseVaultSyncPlaintext(raw: unknown): VaultSyncPlaintext | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== VAULT_SYNC_SCHEMA_VERSION) return null;
  if (!o.entries || typeof o.entries !== "object") return null;
  const entries: Record<string, VaultSyncEntryV1> = {};
  for (const [id, e] of Object.entries(o.entries as Record<string, unknown>)) {
    if (!e || typeof e !== "object") return null;
    const ee = e as Record<string, unknown>;
    if (typeof ee.id !== "string" || ee.id !== id) return null;
    if (typeof ee.updatedAt !== "number" || !Number.isFinite(ee.updatedAt)) return null;
    if (ee.encryptedValue !== null && typeof ee.encryptedValue !== "string") return null;
    entries[id] = {
      id: ee.id as string,
      updatedAt: ee.updatedAt as number,
      encryptedValue: ee.encryptedValue === null ? null : (ee.encryptedValue as string),
      serviceName:
        ee.serviceName === null || ee.serviceName === undefined
          ? null
          : typeof ee.serviceName === "string"
            ? ee.serviceName
            : null,
      serviceUrl:
        ee.serviceUrl === null || ee.serviceUrl === undefined
          ? null
          : typeof ee.serviceUrl === "string"
            ? ee.serviceUrl
            : null,
      category:
        typeof ee.category === "string" ? (ee.category as AliasCategory) : undefined,
    };
  }
  return { v: VAULT_SYNC_SCHEMA_VERSION, entries };
}

/**
 * Last-write-wins per id by `updatedAt`.
 * Equal timestamps: deterministic tie-break via `encryptedValue` lexicographic compare (stable across clients).
 */
export function mergeVaultSyncPlaintexts(
  a: VaultSyncPlaintext | null,
  b: VaultSyncPlaintext | null
): VaultSyncPlaintext {
  const empty = emptyVaultSyncPlaintext();
  const A = a ?? empty;
  const B = b ?? empty;
  const keys = new Set([
    ...Object.keys(A.entries),
    ...Object.keys(B.entries),
  ]);
  const entries: Record<string, VaultSyncEntryV1> = {};
  for (const id of keys) {
    const ea = A.entries[id];
    const eb = B.entries[id];
    if (!ea) entries[id] = eb!;
    else if (!eb) entries[id] = ea;
    else if (ea.updatedAt > eb.updatedAt) entries[id] = ea;
    else if (eb.updatedAt > ea.updatedAt) entries[id] = eb;
    else {
      const cmp = (ea.encryptedValue ?? "").localeCompare(eb.encryptedValue ?? "");
      entries[id] = cmp < 0 ? ea : cmp > 0 ? eb : ea;
    }
  }
  return { v: VAULT_SYNC_SCHEMA_VERSION, entries };
}

/** Response `data` from GET /api/vault/sync (opaque blob; server never decrypts). */
export interface VaultSyncGetResponse {
  ciphertext: string | null;
  version: number;
}

/** JSON body for PUT /api/vault/sync (`clientVersion` must match server for non-conflicting write). */
export interface VaultSyncPutRequest {
  ciphertext: string;
  clientVersion: number;
}

export function passwordAliasesToVaultSyncPlaintext(aliases: Alias[]): VaultSyncPlaintext {
  const entries: Record<string, VaultSyncEntryV1> = {};
  for (const a of aliases) {
    if (a.type !== "password" || !a.isActive) continue;
    const t = new Date(a.lastActivityAt ?? a.createdAt).getTime();
    entries[a.id] = {
      id: a.id,
      updatedAt: t,
      encryptedValue: a.encryptedValue,
      serviceName: a.serviceName,
      serviceUrl: a.serviceUrl,
      category: a.category,
    };
  }
  return { v: VAULT_SYNC_SCHEMA_VERSION, entries };
}

/** Drop entries that are not active password aliases on the server list (orphans / removed). */
export function pruneMergedToActivePasswordAliases(
  merged: VaultSyncPlaintext,
  aliases: Alias[]
): VaultSyncPlaintext {
  const allowed = new Set(
    aliases.filter((a) => a.type === "password" && a.isActive).map((a) => a.id)
  );
  const entries: Record<string, VaultSyncEntryV1> = {};
  for (const [id, e] of Object.entries(merged.entries)) {
    if (allowed.has(id)) entries[id] = e;
  }
  return { v: VAULT_SYNC_SCHEMA_VERSION, entries };
}

export function mergeVaultSyncForServer(
  passwordAliases: Alias[],
  remotePlain: VaultSyncPlaintext | null
): VaultSyncPlaintext {
  const localPlain = passwordAliasesToVaultSyncPlaintext(passwordAliases);
  const merged = mergeVaultSyncPlaintexts(localPlain, remotePlain);
  return pruneMergedToActivePasswordAliases(merged, passwordAliases);
}

export function isSameVaultSyncPlaintext(
  a: VaultSyncPlaintext,
  b: VaultSyncPlaintext
): boolean {
  const keysA = Object.keys(a.entries).sort();
  const keysB = Object.keys(b.entries).sort();
  if (keysA.length !== keysB.length) return false;
  if (keysA.join(",") !== keysB.join(",")) return false;
  for (const k of keysA) {
    if (JSON.stringify(a.entries[k]) !== JSON.stringify(b.entries[k])) return false;
  }
  return true;
}

export async function encryptVaultSyncBlob(
  key: Parameters<typeof encryptVaultValue>[0],
  plain: VaultSyncPlaintext
): Promise<string> {
  return encryptVaultValue(key, JSON.stringify(plain));
}

export async function decryptVaultSyncBlob(
  key: Parameters<typeof decryptVaultValue>[0],
  ciphertext: string
): Promise<VaultSyncPlaintext> {
  const raw = await decryptVaultValue(key, ciphertext);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error("Vault sync blob is not valid JSON");
  }
  const validated = parseVaultSyncPlaintext(parsed);
  if (!validated) {
    throw new Error("Vault sync blob has an unsupported schema");
  }
  return validated;
}

export type VaultSyncPutResult =
  | { ok: true; version: number }
  | { ok: false; conflict: true }
  | { ok: false; conflict: false; message: string };

const MAX_VAULT_SYNC_RETRIES = 3;

/**
 * Pull remote blob, merge with current password aliases (API truth for membership),
 * encrypt, PUT with expected version; on 409, retry with fresh GET (bounded).
 */
export async function executeVaultSyncPush(
  vaultKeyHex: string,
  aliases: Alias[],
  get: () => Promise<{ ciphertext: string | null; version: number }>,
  put: (ciphertext: string, clientVersion: number) => Promise<VaultSyncPutResult>
): Promise<{ ok: true; version: number } | { ok: false; error: string }> {
  const key = await importKeyHex(vaultKeyHex);

  for (let attempt = 0; attempt < MAX_VAULT_SYNC_RETRIES; attempt++) {
    const { ciphertext, version } = await get();

    let remotePlain: VaultSyncPlaintext | null = null;
    if (ciphertext) {
      try {
        remotePlain = await decryptVaultSyncBlob(key, ciphertext);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Could not decrypt vault sync from server";
        return {
          ok: false,
          error: `${msg}. Unlock the vault with the same password used on other devices.`,
        };
      }
    }

    const merged = mergeVaultSyncForServer(aliases, remotePlain);

    if (remotePlain && isSameVaultSyncPlaintext(merged, remotePlain)) {
      return { ok: true, version };
    }

    if (!ciphertext && Object.keys(merged.entries).length === 0) {
      return { ok: true, version };
    }

    const encrypted = await encryptVaultSyncBlob(key, merged);
    const putRes = await put(encrypted, version);
    if (putRes.ok) return { ok: true, version: putRes.version };
    if (putRes.conflict) continue;
    return { ok: false, error: putRes.message };
  }

  return {
    ok: false,
    error:
      "Vault sync could not complete after resolving a server conflict. Try again.",
  };
}
