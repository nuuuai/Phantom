import type { Alias } from "@phantom/shared";
import { decryptVaultValue, importKeyHex } from "@phantom/shared";
import { useCallback, useEffect, useState } from "react";

/**
 * Decrypts vault password entries (encryptedValue) in-memory when vaultKeyHex is set.
 */
export function useDecryptedPasswords(
  rawItems: Alias[] | undefined,
  vaultKeyHex: string | null
): (item: Alias) => string {
  const [decrypted, setDecrypted] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!rawItems || !vaultKeyHex) {
      setDecrypted({});
      return;
    }
    let cancelled = false;

    void (async () => {
      const key = await importKeyHex(vaultKeyHex);
      const results: Record<string, string> = {};
      for (const item of rawItems) {
        if (item.encryptedValue) {
          try {
            results[item.id] = await decryptVaultValue(key, item.encryptedValue);
          } catch {
            results[item.id] = "[decryption failed]";
          }
        }
      }
      if (!cancelled) setDecrypted(results);
    })();

    return () => {
      cancelled = true;
    };
  }, [rawItems, vaultKeyHex]);

  return useCallback(
    (item: Alias): string => {
      const dec = decrypted[item.id];
      if (item.encryptedValue && dec) return dec;
      if (item.encryptedValue) return "\u2026";
      return item.value;
    },
    [decrypted],
  );
}
