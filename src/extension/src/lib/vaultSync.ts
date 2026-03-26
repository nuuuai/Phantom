import { executeVaultSyncPush } from "@phantom/shared";
import type { Alias } from "@phantom/shared";
import { fetchAuth } from "./apiClient.js";
import { parseApiResponseJson } from "./parseApiResponse.js";

async function fetchAliases(): Promise<Alias[]> {
  const res = await fetchAuth("/api/aliases");
  const data = await parseApiResponseJson<{ userId: string; items: Alias[] }>(
    res
  );
  if (!data.ok) return [];
  return data.data.items;
}

/**
 * Merges local password aliases with the server E2E vault blob (same rules as dashboard).
 * Failures are non-fatal; the dashboard can still sync.
 */
export async function pushVaultSyncFromExtension(
  vaultKeyHex: string
): Promise<{ ok: true; version: number } | { ok: false; error: string }> {
  const aliases = await fetchAliases();
  return executeVaultSyncPush(
    vaultKeyHex,
    aliases,
    async () => {
      const res = await fetchAuth("/api/vault/sync");
      const data = await parseApiResponseJson<{
        ciphertext: string | null;
        version: number;
      }>(res);
      if (!data.ok) throw new Error(data.error.message);
      return data.data;
    },
    async (ciphertext, clientVersion) => {
      const res = await fetchAuth("/api/vault/sync", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ciphertext, clientVersion }),
      });
      const data = await parseApiResponseJson<{ version: number }>(res);
      if (!data.ok) {
        if (data.error.code === "sync_conflict") {
          return { ok: false, conflict: true };
        }
        return { ok: false, conflict: false, message: data.error.message };
      }
      return { ok: true, version: data.data.version };
    }
  );
}
