import { describe, expect, it } from "vitest";
import type { Alias } from "../types/alias.js";
import {
  deriveVaultKey,
  exportKeyHex,
  generateVaultSalt,
  importKeyHex,
} from "./vaultCrypto.js";
import {
  decryptVaultSyncBlob,
  emptyVaultSyncPlaintext,
  encryptVaultSyncBlob,
  executeVaultSyncPush,
  mergeVaultSyncForServer,
  mergeVaultSyncPlaintexts,
  parseVaultSyncPlaintext,
  passwordAliasesToVaultSyncPlaintext,
  pruneMergedToActivePasswordAliases,
} from "./vaultSyncMerge.js";

const baseAlias = (over: Partial<Alias>): Alias => ({
  id: "a1",
  userId: "u1",
  type: "password",
  value: "x",
  encryptedValue: '{"ct":"x","iv":"y"}',
  category: "shopping",
  serviceName: "Svc",
  serviceUrl: null,
  healthStatus: "healthy",
  createdAt: "2024-01-01T00:00:00.000Z",
  lastActivityAt: "2024-01-02T00:00:00.000Z",
  spamCount: 0,
  isActive: true,
  ...over,
});

describe("vaultSyncMerge", () => {
  it("mergeVaultSyncPlaintexts breaks ties on equal updatedAt via encryptedValue order", () => {
    const a = emptyVaultSyncPlaintext();
    a.entries["x"] = {
      id: "x",
      updatedAt: 5,
      encryptedValue: "aaa",
      serviceName: null,
      serviceUrl: null,
    };
    const b = emptyVaultSyncPlaintext();
    b.entries["x"] = {
      id: "x",
      updatedAt: 5,
      encryptedValue: "zzz",
      serviceName: null,
      serviceUrl: null,
    };
    const m = mergeVaultSyncPlaintexts(a, b);
    expect(m.entries["x"]?.encryptedValue).toBe("aaa");
  });

  it("mergeVaultSyncPlaintexts picks higher updatedAt", () => {
    const older = emptyVaultSyncPlaintext();
    older.entries["x"] = {
      id: "x",
      updatedAt: 1,
      encryptedValue: "a",
      serviceName: null,
      serviceUrl: null,
    };
    const newer = emptyVaultSyncPlaintext();
    newer.entries["x"] = {
      id: "x",
      updatedAt: 10,
      encryptedValue: "b",
      serviceName: null,
      serviceUrl: null,
    };
    const m = mergeVaultSyncPlaintexts(older, newer);
    expect(m.entries["x"]?.encryptedValue).toBe("b");
  });

  it("mergeVaultSyncForServer drops remote orphan ids", () => {
    const remote = emptyVaultSyncPlaintext();
    remote.entries["ghost"] = {
      id: "ghost",
      updatedAt: 99,
      encryptedValue: "z",
      serviceName: null,
      serviceUrl: null,
    };
    const aliases: Alias[] = [
      baseAlias({ id: "a1", isActive: true, lastActivityAt: "2024-01-03T00:00:00.000Z" }),
    ];
    const merged = mergeVaultSyncForServer(aliases, remote);
    expect(Object.keys(merged.entries)).toEqual(["a1"]);
  });

  it("passwordAliasesToVaultSyncPlaintext skips inactive", () => {
    const aliases: Alias[] = [
      baseAlias({ id: "a1", isActive: true }),
      baseAlias({ id: "a2", isActive: false }),
    ];
    const p = passwordAliasesToVaultSyncPlaintext(aliases);
    expect(Object.keys(p.entries)).toEqual(["a1"]);
  });

  it("parseVaultSyncPlaintext rejects bad shapes", () => {
    expect(parseVaultSyncPlaintext(null)).toBeNull();
    expect(parseVaultSyncPlaintext({ v: 2, entries: {} })).toBeNull();
    expect(
      parseVaultSyncPlaintext({
        v: 1,
        entries: { x: { id: "y", updatedAt: 1, encryptedValue: null } },
      })
    ).toBeNull();
  });

  it("decryptVaultSyncBlob rejects tampered ciphertext", async () => {
    const salt = generateVaultSalt();
    const key = await deriveVaultKey("sync-merge-test-pw", salt);
    const hex = await exportKeyHex(key);
    const cryptoKey = await importKeyHex(hex);
    const plain = emptyVaultSyncPlaintext();
    const ct = await encryptVaultSyncBlob(cryptoKey, plain);
    const tampered = ct.slice(0, -8) + "deadbeef";
    await expect(decryptVaultSyncBlob(cryptoKey, tampered)).rejects.toThrow();
  });

  it("pruneMergedToActivePasswordAliases removes inactive ids", () => {
    const merged = emptyVaultSyncPlaintext();
    merged.entries["a1"] = {
      id: "a1",
      updatedAt: 1,
      encryptedValue: "e",
      serviceName: null,
      serviceUrl: null,
    };
    merged.entries["a2"] = {
      id: "a2",
      updatedAt: 2,
      encryptedValue: "e",
      serviceName: null,
      serviceUrl: null,
    };
    const aliases: Alias[] = [
      baseAlias({ id: "a1", isActive: true }),
      baseAlias({ id: "a2", isActive: false }),
    ];
    const p = pruneMergedToActivePasswordAliases(merged, aliases);
    expect(Object.keys(p.entries)).toEqual(["a1"]);
  });
});

describe("executeVaultSyncPush", () => {
  it("fails when remote ciphertext decrypts with a different passphrase (wrong vault key)", async () => {
    const salt = generateVaultSalt();
    const keyCorrect = await deriveVaultKey("correct-passphrase", salt);
    const hexWrong = await exportKeyHex(
      await deriveVaultKey("wrong-passphrase", salt)
    );
    const plain = emptyVaultSyncPlaintext();
    const ct = await encryptVaultSyncBlob(keyCorrect, plain);

    const result = await executeVaultSyncPush(
      hexWrong,
      [],
      async () => ({ ciphertext: ct, version: 1 }),
      async () => ({ ok: true, version: 2 })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/decrypt|password|vault/i);
    }
  });

  it("retries after simulated 409 (sync_conflict): refetch then PUT succeeds", async () => {
    const salt = generateVaultSalt();
    const key = await deriveVaultKey("merge-retry-pw", salt);
    const hex = await exportKeyHex(key);

    let getCalls = 0;
    let putCalls = 0;

    const result = await executeVaultSyncPush(
      hex,
      [baseAlias({ id: "a1", isActive: true })],
      async () => {
        getCalls++;
        return { ciphertext: null, version: 0 };
      },
      async () => {
        putCalls++;
        if (putCalls === 1) return { ok: false, conflict: true };
        return { ok: true, version: 1 };
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.version).toBe(1);
    expect(getCalls).toBe(2);
    expect(putCalls).toBe(2);
  });

  it("returns server version without PUT when merged plaintext matches remote", async () => {
    const salt = generateVaultSalt();
    const key = await deriveVaultKey("noop-sync", salt);
    const hex = await exportKeyHex(key);
    const cryptoKey = await importKeyHex(hex);
    const emptyPlain = emptyVaultSyncPlaintext();
    const ct = await encryptVaultSyncBlob(cryptoKey, emptyPlain);
    let putCalls = 0;
    const result = await executeVaultSyncPush(
      hex,
      [],
      async () => ({ ciphertext: ct, version: 7 }),
      async () => {
        putCalls++;
        return { ok: true, version: 999 };
      }
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.version).toBe(7);
    expect(putCalls).toBe(0);
  });

  it("fails after max retries when PUT always conflicts", async () => {
    const salt = generateVaultSalt();
    const key = await deriveVaultKey("conflict-storm", salt);
    const hex = await exportKeyHex(key);
    const result = await executeVaultSyncPush(
      hex,
      [baseAlias({ id: "a1", isActive: true })],
      async () => ({ ciphertext: null, version: 0 }),
      async () => ({ ok: false, conflict: true })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/could not complete after resolving/i);
    }
  });

  it("returns non-conflict PUT errors without retrying", async () => {
    const salt = generateVaultSalt();
    const key = await deriveVaultKey("put-hard-fail", salt);
    const hex = await exportKeyHex(key);
    let getCalls = 0;
    let putCalls = 0;
    const result = await executeVaultSyncPush(
      hex,
      [baseAlias({ id: "a1", isActive: true })],
      async () => {
        getCalls++;
        return { ciphertext: null, version: 0 };
      },
      async () => {
        putCalls++;
        return {
          ok: false,
          conflict: false,
          message: "validation failed",
        };
      }
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("validation");
    expect(getCalls).toBe(1);
    expect(putCalls).toBe(1);
  });
});
