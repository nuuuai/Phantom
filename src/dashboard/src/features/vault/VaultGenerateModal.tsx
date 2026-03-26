import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { UpgradeModal } from "@/components/upgrade/UpgradeModal.js";
import { useEscapeKey } from "@/hooks/useEscapeKey.js";
import type { UpgradeContext } from "@/lib/upgradeCopy.js";
import {
  clientErrorFromApiFailure,
  encryptVaultValue,
  generatePassword,
  importKeyHex,
  isFreeTierAliasTypeAtCap,
  type AliasCategory,
  type ClientErrorMeta,
} from "@phantom/shared";
import { phantomApi } from "@/lib/api/phantomApi.js";
import {
  aliasDetailAll,
  aliasesAll,
  dashboardOverviewAll,
  queryKeys,
  vaultAll,
  vaultSyncAll,
} from "@/lib/queryKeys.js";
import { STALE } from "@/lib/queryStaleTimes.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

const CATEGORIES: { id: AliasCategory; label: string }[] = [
  { id: "shopping", label: "Shopping" },
  { id: "social", label: "Social" },
  { id: "finance", label: "Finance" },
  { id: "work", label: "Work" },
  { id: "dating", label: "Dating" },
  { id: "newsletter", label: "Newsletter" },
  { id: "temp", label: "Temp" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function VaultGenerateModal({ open, onClose }: Props) {
  const accessToken = useSessionStore((s) => s.accessToken);
  const vaultKeyHex = useSessionStore((s) => s.vaultKeyHex);
  const qc = useQueryClient();

  const userMeQuery = useQuery({
    queryKey: queryKeys.userMe(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.user.me(accessToken, { signal });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    enabled: Boolean(open && accessToken),
    staleTime: STALE.userMe,
  });

  const passwordAtCap = useMemo(() => {
    const d = userMeQuery.data;
    if (!d) return false;
    return isFreeTierAliasTypeAtCap(d.user.tier, "password", d.aliasUsage);
  }, [userMeQuery.data]);
  const [category, setCategory] = useState<AliasCategory>("work");
  const [serviceName, setServiceName] = useState("");
  const [serviceUrl, setServiceUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeCtx, setUpgradeCtx] = useState<UpgradeContext | undefined>(
    undefined
  );

  const generateMutation = useMutation({
    mutationFn: async () => {
      let encryptedValue: string | undefined;
      if (vaultKeyHex) {
        const plaintext = generatePassword(20);
        const key = await importKeyHex(vaultKeyHex);
        encryptedValue = await encryptVaultValue(key, plaintext);
      }
      const res = await phantomApi.aliases.generate(accessToken, {
        type: "password",
        category,
        serviceName: serviceName.trim() || undefined,
        serviceUrl: serviceUrl.trim() || undefined,
        encryptedValue,
      });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vaultAll });
      void qc.invalidateQueries({ queryKey: vaultSyncAll });
      void qc.invalidateQueries({ queryKey: aliasesAll });
      void qc.invalidateQueries({ queryKey: aliasDetailAll });
      void qc.invalidateQueries({
        queryKey: dashboardOverviewAll,
      });
      void qc.invalidateQueries({
        queryKey: queryKeys.userMe(accessToken),
      });
      resetAndClose();
    },
    onError: (err: Error) => {
      setError(err.message);
      const ce = err as ClientErrorMeta;
      if (ce.apiErrorCode === "tier_limit") {
        const row = userMeQuery.data?.aliasUsage.find((u) => u.type === "password");
        if (row && row.max !== null) {
          setUpgradeCtx({
            tierLimit: {
              aliasType: row.type,
              used: row.used,
              max: row.max,
            },
          });
        } else {
          setUpgradeCtx(undefined);
        }
        setUpgradeOpen(true);
      }
    },
  });

  const resetAndClose = useCallback(() => {
    setServiceName("");
    setServiceUrl("");
    setCategory("work");
    setError(null);
    setUpgradeOpen(false);
    setUpgradeCtx(undefined);
    onClose();
  }, [onClose]);

  const escapeClose = useCallback(() => {
    if (!generateMutation.isPending) resetAndClose();
  }, [generateMutation.isPending, resetAndClose]);

  useEscapeKey(open, escapeClose);

  if (!open) return null;

  return (
    <>
    <UpgradeModal
      open={upgradeOpen}
      reason="alias_cap"
      context={upgradeCtx}
      onDismiss={() => {
        setUpgradeOpen(false);
        setUpgradeCtx(undefined);
      }}
      titleId="vault-generate-upgrade-title"
    />
    <AnimatePresence>
      <motion.div
        key="vault-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vault-generate-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) resetAndClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 24, stiffness: 300 }}
          className="w-full max-w-md rounded-xl border border-ph-border bg-ph-surface p-6 shadow-2xl"
        >
          <h2
            id="vault-generate-title"
            className="font-sans text-base font-semibold text-ph-text-primary"
          >
            New password
          </h2>
          <p className="mt-1 font-sans text-[12px] text-ph-text-tertiary">
            A cryptographically random 20-character password will be generated
            on your device, encrypted, and stored in your vault. The server
            never sees the plaintext.
          </p>

          {passwordAtCap ? (
            <div
              className="mt-4 rounded-md border border-ph-warning/40 bg-ph-warning/10 px-3 py-2 font-sans text-[11px] text-ph-warning"
              role="status"
            >
              Free tier password-alias limit reached. Remove a password alias or{" "}
              <Link
                to="/billing"
                className="font-medium text-ph-accent-light underline-offset-2 hover:underline"
              >
                upgrade to Phantom Pro
              </Link>{" "}
              for unlimited.
            </div>
          ) : null}

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ph-text-muted">
                Service name
              </label>
              <input
                type="text"
                placeholder="e.g. Netflix, GitHub"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="w-full rounded-md border border-ph-border bg-ph-bg px-3 py-2 font-sans text-xs text-ph-text-primary placeholder:text-ph-text-ghost focus:border-ph-accent-border focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ph-text-muted">
                Service URL (optional)
              </label>
              <input
                type="url"
                placeholder="https://…"
                value={serviceUrl}
                onChange={(e) => setServiceUrl(e.target.value)}
                className="w-full rounded-md border border-ph-border bg-ph-bg px-3 py-2 font-sans text-xs text-ph-text-primary placeholder:text-ph-text-ghost focus:border-ph-accent-border focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ph-text-muted">
                Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={[
                      "cursor-pointer rounded-full border px-3 py-1 font-sans text-[11px] transition-colors",
                      category === c.id
                        ? "border-ph-accent bg-ph-accent-bg text-ph-accent-light"
                        : "border-ph-border text-ph-text-tertiary hover:text-ph-text-secondary",
                    ].join(" ")}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-3 space-y-2">
              <p className="font-sans text-[11px] text-ph-danger">{error}</p>
              {(error as unknown as ClientErrorMeta).apiErrorCode ===
              "tier_limit" ? (
                <button
                  type="button"
                  className="font-sans text-[11px] font-medium text-ph-accent-light underline-offset-2 hover:underline"
                  onClick={() => {
                    const row = userMeQuery.data?.aliasUsage.find(
                      (u) => u.type === "password"
                    );
                    if (row && row.max !== null) {
                      setUpgradeCtx({
                        tierLimit: {
                          aliasType: row.type,
                          used: row.used,
                          max: row.max,
                        },
                      });
                    }
                    setUpgradeOpen(true);
                  }}
                >
                  View upgrade options
                </button>
              ) : null}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={resetAndClose}
              className="cursor-pointer rounded-md px-4 py-2 font-sans text-xs text-ph-text-tertiary hover:text-ph-text-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={generateMutation.isPending || passwordAtCap}
              title={
                passwordAtCap
                  ? "Free tier limit — upgrade or remove a password alias"
                  : undefined
              }
              onClick={() => generateMutation.mutate()}
              className="cursor-pointer rounded-md border border-ph-accent-border bg-ph-accent px-4 py-2 font-sans text-xs font-medium text-white disabled:opacity-50"
            >
              {generateMutation.isPending
                ? "Generating…"
                : "Generate password"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
    </>
  );
}
