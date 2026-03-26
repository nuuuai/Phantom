import { describe, expect, it } from "vitest";
import {
  generateVaultSalt,
  deriveVaultKey,
  encryptVaultValue,
  decryptVaultValue,
  generatePassword,
  exportKeyHex,
  importKeyHex,
} from "./vaultCrypto.js";

describe("vaultCrypto", () => {
  it("generateVaultSalt returns unique base64 strings", () => {
    const a = generateVaultSalt();
    const b = generateVaultSalt();
    expect(a).not.toBe(b);
    expect(typeof a).toBe("string");
    expect(a.length).toBeGreaterThan(0);
  });

  it("deriveVaultKey produces a key from password + salt", async () => {
    const salt = generateVaultSalt();
    const key = await deriveVaultKey("test-password", salt);
    expect(key).toBeDefined();
  });

  it("deriveVaultKey is deterministic for the same password and salt (PBKDF2)", async () => {
    const salt = generateVaultSalt();
    const a = await exportKeyHex(await deriveVaultKey("same-passphrase", salt));
    const b = await exportKeyHex(await deriveVaultKey("same-passphrase", salt));
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("encrypt then decrypt roundtrips correctly", async () => {
    const salt = generateVaultSalt();
    const key = await deriveVaultKey("roundtrip-password", salt);
    const plaintext = "SuperSecret!42@XYZ";
    const encrypted = await encryptVaultValue(key, plaintext);
    expect(encrypted).not.toContain(plaintext);
    const decrypted = await decryptVaultValue(key, encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("decrypt with wrong key throws", async () => {
    const salt = generateVaultSalt();
    const key1 = await deriveVaultKey("password-one", salt);
    const key2 = await deriveVaultKey("password-two", salt);
    const encrypted = await encryptVaultValue(key1, "secret");
    await expect(decryptVaultValue(key2, encrypted)).rejects.toThrow();
  });

  it("same plaintext produces different ciphertext (unique IVs)", async () => {
    const salt = generateVaultSalt();
    const key = await deriveVaultKey("iv-test", salt);
    const a = await encryptVaultValue(key, "same");
    const b = await encryptVaultValue(key, "same");
    expect(a).not.toBe(b);
    expect(await decryptVaultValue(key, a)).toBe("same");
    expect(await decryptVaultValue(key, b)).toBe("same");
  });

  it("generatePassword returns string of requested length with mixed chars", () => {
    const pw = generatePassword(24);
    expect(pw.length).toBe(24);
    expect(/[a-z]/.test(pw) || /[A-Z]/.test(pw) || /\d/.test(pw)).toBe(true);
  });

  it("generatePassword defaults to 20 chars", () => {
    expect(generatePassword().length).toBe(20);
  });

  it("exportKeyHex / importKeyHex roundtrips", async () => {
    const salt = generateVaultSalt();
    const key = await deriveVaultKey("hex-test", salt);
    const hex = await exportKeyHex(key);
    expect(hex).toMatch(/^[0-9a-f]{64}$/);
    const restored = await importKeyHex(hex);
    const plain = "round-trip-via-hex";
    const enc = await encryptVaultValue(key, plain);
    const dec = await decryptVaultValue(restored, enc);
    expect(dec).toBe(plain);
  });

  it("different salts produce different keys", async () => {
    const s1 = generateVaultSalt();
    const s2 = generateVaultSalt();
    const k1 = await exportKeyHex(await deriveVaultKey("same-pw", s1));
    const k2 = await exportKeyHex(await deriveVaultKey("same-pw", s2));
    expect(k1).not.toBe(k2);
  });
});
