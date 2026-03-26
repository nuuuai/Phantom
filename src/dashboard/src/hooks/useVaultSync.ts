import { clientErrorFromApiFailure, executeVaultSyncPush } from "@phantom/shared";
import { useQuery } from "@tanstack/react-query";
import type { Alias } from "@phantom/shared";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { queryKeys } from "@/lib/queryKeys.js";
import { STALE } from "@/lib/queryStaleTimes.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

/**
 * Pushes merged password vault snapshot to the opaque E2E sync blob after the
 * password list loads (and when the list updates).
 */
export function useVaultSync(
  passwordAliases: Alias[] | undefined,
  listReady: boolean,
  dataUpdatedAt: number
) {
  const accessToken = useSessionStore((s) => s.accessToken);
  const vaultKeyHex = useSessionStore((s) => s.vaultKeyHex);

  return useQuery({
    queryKey: queryKeys.vaultSync(accessToken, dataUpdatedAt),
    queryFn: async () => {
      if (!accessToken || !vaultKeyHex || !passwordAliases) {
        throw new Error("Vault sync is not ready.");
      }
      const result = await executeVaultSyncPush(
        vaultKeyHex,
        passwordAliases,
        async () => {
          const r = await phantomApi.vault.getSync(accessToken);
          if (!r.ok) throw clientErrorFromApiFailure(r);
          return r.data;
        },
        async (ciphertext, clientVersion) => {
          const r = await phantomApi.vault.putSync(accessToken, {
            ciphertext,
            clientVersion,
          });
          if (r.ok) return { ok: true, version: r.data.version };
          if (r.error.code === "sync_conflict") return { ok: false, conflict: true };
          return {
            ok: false,
            conflict: false,
            message: clientErrorFromApiFailure(r).message,
          };
        }
      );
      if (!result.ok) throw new Error(result.error);
      return result.version;
    },
    enabled: Boolean(
      accessToken && vaultKeyHex && listReady && passwordAliases !== undefined
    ),
    staleTime: STALE.vaultSync,
    retry: 2,
  });
}
