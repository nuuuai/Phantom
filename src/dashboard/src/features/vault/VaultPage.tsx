import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { Alias } from "@phantom/shared";
import {
  clientErrorFromApiFailure,
  encryptVaultValue,
  generatePassword,
  getQueryErrorMessage,
  importKeyHex,
} from "@phantom/shared";
import { useCopiedFeedback } from "@/hooks/useCopiedFeedback.js";
import { useDecryptedPasswords } from "@/hooks/useDecryptedPasswords.js";
import { useVaultSync } from "@/hooks/useVaultSync.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { formatRelativeTime } from "@/lib/formatRelative.js";
import {
  aliasDetailAll,
  aliasesAll,
  dashboardOverviewAll,
  queryKeys,
  vaultAll,
  vaultSyncAll,
} from "@/lib/queryKeys.js";
import { useSessionStore } from "@/stores/useSessionStore.js";
import { SessionGateMessage } from "@/components/SessionGateMessage.js";
import { VaultGenerateModal } from "./VaultGenerateModal.js";
import { VaultUnlockGate } from "./VaultUnlockGate.js";

function vaultSyncErrorLooksLikeConflict(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("could not complete after resolving") ||
    m.includes("sync_conflict") ||
    m.includes("newer") ||
    m.includes("409")
  );
}

const CATEGORY_TABS = [
  { id: "all", label: "All" },
  { id: "shopping", label: "Shopping" },
  { id: "social", label: "Social" },
  { id: "finance", label: "Finance" },
  { id: "work", label: "Work" },
  { id: "dating", label: "Dating" },
  { id: "newsletter", label: "Newsletter" },
  { id: "temp", label: "Temp" },
] as const;

function strengthLabel(value: string): { text: string; cls: string } {
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasDigit = /\d/.test(value);
  const hasSpecial = /[^a-zA-Z0-9]/.test(value);
  const varieties = [hasUpper, hasLower, hasDigit, hasSpecial].filter(
    Boolean
  ).length;

  if (value.length >= 16 && varieties >= 3)
    return { text: "strong", cls: "text-ph-success" };
  if (value.length >= 12 && varieties >= 2)
    return { text: "good", cls: "text-ph-accent-light" };
  if (value.length >= 8)
    return { text: "fair", cls: "text-ph-warning" };
  return { text: "weak", cls: "text-ph-danger" };
}

export function VaultPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  if (!accessToken) {
    return <SessionGateMessage />;
  }
  return (
    <VaultUnlockGate>
      <VaultPageInner />
    </VaultUnlockGate>
  );
}

function VaultPageInner() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const vaultKeyHex = useSessionStore((s) => s.vaultKeyHex);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const { copiedId, setCopiedId } = useCopiedFeedback();

  const listQuery = useQuery({
    queryKey: queryKeys.vaultList(accessToken, "all"),
    queryFn: async () => {
      const res = await phantomApi.aliases.list(accessToken, {});
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data.items.filter((a) => a.type === "password");
    },
    enabled: accessToken !== null,
  });

  const vaultSyncQuery = useVaultSync(
    listQuery.data,
    listQuery.isSuccess,
    listQuery.dataUpdatedAt
  );

  const resolveValue = useDecryptedPasswords(listQuery.data, vaultKeyHex);

  const userMeQuery = useQuery({
    queryKey: queryKeys.userMe(accessToken),
    queryFn: async () => {
      const res = await phantomApi.user.me(accessToken);
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    enabled: accessToken !== null,
  });

  const rotateMutation = useMutation({
    mutationFn: async (id: string) => {
      let body: { encryptedValue?: string } | undefined;
      if (vaultKeyHex) {
        const key = await importKeyHex(vaultKeyHex);
        const newPw = generatePassword(20);
        const enc = await encryptVaultValue(key, newPw);
        body = { encryptedValue: enc };
      }
      const res = await phantomApi.aliases.rotate(accessToken, id, body);
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
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await phantomApi.aliases.remove(accessToken, id);
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
    },
  });

  const items = useMemo(() => {
    const active = (listQuery.data ?? []).filter((a) => a.isActive);
    const byCat =
      category === "all"
        ? active
        : active.filter((a) => a.category === category);
    if (!search) return byCat;
    const lc = search.toLowerCase();
    return byCat.filter(
      (a) =>
        (a.serviceName?.toLowerCase().includes(lc) ?? false) ||
        (a.serviceUrl?.toLowerCase().includes(lc) ?? false) ||
        resolveValue(a).toLowerCase().includes(lc)
    );
  }, [listQuery.data, category, search, resolveValue]);

  const passwordUsage = userMeQuery.data?.aliasUsage.find(
    (u) => u.type === "password"
  );

  const copyValue = (pw: Alias) => {
    void navigator.clipboard.writeText(resolveValue(pw));
    setCopiedId(pw.id);
  };

  return (
    <div className="px-8 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-sans text-xl font-semibold text-ph-text-primary">
            Vault
          </h1>
          <p className="mt-1 font-sans text-sm text-ph-text-tertiary">
            Zero-knowledge password manager — generate, store, and rotate
            credentials.
          </p>
          {vaultSyncQuery.isFetching && (
            <p className="mt-1 font-mono text-[10px] text-ph-text-muted">
              Syncing encrypted backup…
            </p>
          )}
          {vaultSyncQuery.isSuccess && (
            <div className="mt-1 space-y-0.5">
              <p className="font-mono text-[10px] text-ph-text-muted">
                Encrypted backup · v{vaultSyncQuery.data}
              </p>
              {vaultSyncQuery.dataUpdatedAt > 0 && (
                <p className="font-mono text-[10px] text-ph-text-muted">
                  Last synced{" "}
                  {formatRelativeTime(
                    new Date(vaultSyncQuery.dataUpdatedAt).toISOString()
                  )}
                </p>
              )}
            </div>
          )}
          {vaultSyncQuery.isError && (
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md border border-ph-danger/40 bg-ph-danger/5 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="font-sans text-[11px] text-ph-danger">
                  {getQueryErrorMessage(vaultSyncQuery.error)}
                </p>
                {vaultSyncErrorLooksLikeConflict(
                  getQueryErrorMessage(vaultSyncQuery.error)
                ) ? (
                  <p className="mt-1 font-sans text-[10px] text-ph-text-tertiary">
                    Another device may have updated the vault. Retry merges with
                    the server copy (last-write-wins per entry).
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void vaultSyncQuery.refetch()}
                className="cursor-pointer rounded border border-ph-border bg-ph-surface px-2 py-0.5 font-sans text-[10px] text-ph-text-secondary hover:bg-ph-raised"
              >
                Retry sync
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {passwordUsage && passwordUsage.max !== null && (
            <span className="font-mono text-[11px] text-ph-text-muted">
              {passwordUsage.used}/{passwordUsage.max} passwords
            </span>
          )}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="cursor-pointer rounded-md border border-ph-accent-border bg-[#6C3AED15] px-4 py-2 font-sans text-xs font-medium text-ph-accent-light"
          >
            + New password
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1">
          {CATEGORY_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setCategory(t.id)}
              className={[
                "rounded-full px-3 py-1.5 font-sans text-xs font-medium transition-colors",
                category === t.id
                  ? "bg-ph-raised text-ph-text-primary ring-1 ring-ph-border"
                  : "text-ph-text-tertiary hover:text-ph-text-secondary",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by service…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-md border border-ph-border bg-ph-bg px-3 py-1.5 font-sans text-xs text-ph-text-primary placeholder:text-ph-text-muted focus:border-ph-accent-border focus:outline-none lg:w-56"
        />
      </div>

      {listQuery.isPending && (
        <p className="mt-8 font-sans text-sm text-ph-text-tertiary">
          Loading vault…
        </p>
      )}
      {listQuery.isError && (
        <p className="mt-8 font-sans text-sm text-ph-danger">
          Could not load vault. Is the API running?
        </p>
      )}

      {!listQuery.isPending && !listQuery.isError && items.length === 0 && (
        <div className="mt-10 rounded-xl border border-dashed border-ph-border bg-ph-surface/50 px-8 py-16 text-center">
          <p className="font-sans text-sm text-ph-text-secondary">
            {search
              ? "No passwords match your search."
              : "No passwords in your vault yet."}
          </p>
          {!search && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-4 cursor-pointer rounded-md border border-ph-accent-border bg-[#6C3AED15] px-4 py-2 font-sans text-xs font-medium text-ph-accent-light"
            >
              Generate your first password
            </button>
          )}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {items.map((pw, i) => (
              <VaultCard
                key={pw.id}
                pw={pw}
                displayValue={resolveValue(pw)}
                index={i}
                revealed={revealed[pw.id] ?? false}
                onToggleReveal={() =>
                  setRevealed((r) => ({ ...r, [pw.id]: !r[pw.id] }))
                }
                copyLabel={copiedId === pw.id ? "Copied" : "Copy"}
                onCopy={() => copyValue(pw)}
                onRotate={() => {
                  if (
                    window.confirm(
                      "Generate a new password for this service? The old one will be quarantined."
                    )
                  ) {
                    rotateMutation.mutate(pw.id);
                  }
                }}
                onDeactivate={() => {
                  if (window.confirm("Remove this password from vault?")) {
                    deactivateMutation.mutate(pw.id);
                  }
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <VaultGenerateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

function VaultCard({
  pw,
  displayValue,
  index,
  revealed,
  copyLabel,
  onToggleReveal,
  onCopy,
  onRotate,
  onDeactivate,
}: {
  pw: Alias;
  displayValue: string;
  index: number;
  revealed: boolean;
  copyLabel: string;
  onToggleReveal: () => void;
  onCopy: () => void;
  onRotate: () => void;
  onDeactivate: () => void;
}) {
  const strength = strengthLabel(displayValue);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: index * 0.03 }}
      className="group rounded-lg border border-ph-border bg-ph-surface p-4 transition-colors hover:border-ph-accent-border"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="truncate font-sans text-[13px] font-semibold text-ph-text-primary">
            {pw.serviceName ?? "Unnamed service"}
          </div>
          {pw.serviceUrl && (
            <div className="mt-0.5 truncate font-mono text-[10px] text-ph-text-ghost">
              {pw.serviceUrl}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {pw.encryptedValue && (
            <span className="rounded-full border border-ph-accent-border bg-[#6C3AED15] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ph-accent-light">
              e2e
            </span>
          )}
          <span className="rounded-full border border-ph-border bg-ph-bg px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ph-text-muted">
            {pw.category}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-md border border-ph-borderSubtle bg-ph-bg px-3 py-2">
        <button
          type="button"
          onClick={onToggleReveal}
          className="min-w-0 flex-1 cursor-pointer truncate text-left font-mono text-xs text-ph-text-primary"
        >
          {revealed ? displayValue : "•".repeat(Math.min(displayValue.length, 20))}
        </button>
        <button
          type="button"
          onClick={onCopy}
          className="shrink-0 cursor-pointer font-sans text-[10px] text-ph-accent-light hover:underline"
          title="Copy to clipboard"
        >
          {copyLabel}
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span
            className={[
              "font-mono text-[10px] font-semibold uppercase",
              strength.cls,
            ].join(" ")}
          >
            {strength.text}
          </span>
          <span className="font-mono text-[10px] text-ph-text-muted">
            · {displayValue.length} chars
          </span>
        </span>
        <span className="font-mono text-[10px] text-ph-text-ghost">
          {formatRelativeTime(pw.createdAt)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1 border-t border-ph-borderSubtle pt-3">
        <button
          type="button"
          onClick={onRotate}
          className="cursor-pointer rounded px-2 py-1 font-sans text-[10px] text-ph-text-secondary hover:bg-ph-raised hover:text-ph-text-primary"
        >
          Rotate
        </button>
        <button
          type="button"
          onClick={onDeactivate}
          className="cursor-pointer rounded px-2 py-1 font-sans text-[10px] text-ph-danger hover:bg-ph-raised"
        >
          Remove
        </button>
      </div>
    </motion.div>
  );
}
