import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";
import { useEscapeKey } from "@/hooks/useEscapeKey.js";
import type { AliasCategory } from "@phantom/shared";
import {
  encryptVaultValue,
  generatePassword,
  importKeyHex,
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
  const [category, setCategory] = useState<AliasCategory>("work");
  const [serviceName, setServiceName] = useState("");
  const [serviceUrl, setServiceUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

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
      if (!res.ok) throw new Error(res.error.message);
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
    },
  });

  const resetAndClose = useCallback(() => {
    setServiceName("");
    setServiceUrl("");
    setCategory("work");
    setError(null);
    onClose();
  }, [onClose]);

  const escapeClose = useCallback(() => {
    if (!generateMutation.isPending) resetAndClose();
  }, [generateMutation.isPending, resetAndClose]);

  useEscapeKey(open, escapeClose);

  if (!open) return null;

  return (
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
            <p className="mt-3 font-sans text-[11px] text-ph-danger">
              {error}
            </p>
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
              disabled={generateMutation.isPending}
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
  );
}
