import {
  type Alias,
  decryptVaultValue,
  encryptVaultValue,
  generatePassword,
  importKeyHex,
} from "@phantom/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SessionGateMessage } from "@/components/SessionGateMessage.js";
import { useCopiedFeedback } from "@/hooks/useCopiedFeedback.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { categoryBadgeClass, categoryLabel } from "@/lib/categoryBadgeStyle.js";
import { maskAliasValue } from "@/lib/maskAliasValue.js";
import {
  aliasDetailAll,
  aliasesAll,
  dashboardOverviewAll,
  queryKeys,
  vaultAll,
} from "@/lib/queryKeys.js";
import { useSessionStore } from "@/stores/useSessionStore.js";
import { VaultUnlockGate } from "@/features/vault/VaultUnlockGate.js";

function healthColor(h: Alias["healthStatus"]): string {
  if (h === "healthy") return "text-emerald-400";
  if (h === "warning") return "text-amber-400";
  if (h === "compromised") return "text-rose-500";
  return "text-ph-text-tertiary";
}

function healthDot(h: Alias["healthStatus"]): string {
  if (h === "healthy") return "bg-emerald-400";
  if (h === "warning") return "bg-amber-400";
  if (h === "compromised") return "bg-rose-500";
  return "bg-ph-text-tertiary";
}

function typeLabel(t: Alias["type"]): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AliasDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const accessToken = useSessionStore((s) => s.accessToken);
  const vaultKeyHex = useSessionStore((s) => s.vaultKeyHex);
  const qc = useQueryClient();
  const [revealed, setRevealed] = useState(false);
  const [decryptedPlain, setDecryptedPlain] = useState<string | null>(null);
  const { copiedId, setCopiedId } = useCopiedFeedback();

  const aliasQuery = useQuery({
    queryKey: queryKeys.aliasDetail(accessToken, id),
    queryFn: async () => {
      const res = await phantomApi.aliases.get(accessToken, id!);
      if (!res.ok) throw new Error(res.error.message);
      return res.data.alias;
    },
    enabled: !!accessToken && !!id,
  });

  const alias = aliasQuery.data;

  useEffect(() => {
    if (!alias?.encryptedValue || !vaultKeyHex) {
      setDecryptedPlain(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const key = await importKeyHex(vaultKeyHex);
        const plain = await decryptVaultValue(key, alias.encryptedValue!);
        if (!cancelled) setDecryptedPlain(plain);
      } catch {
        if (!cancelled) setDecryptedPlain("[decryption failed]");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [alias, vaultKeyHex]);

  const rotateMutation = useMutation({
    mutationFn: async () => {
      let body: { encryptedValue?: string } | undefined;
      if (vaultKeyHex && alias?.type === "password") {
        const key = await importKeyHex(vaultKeyHex);
        const newPw = generatePassword(20);
        body = { encryptedValue: await encryptVaultValue(key, newPw) };
      }
      const res = await phantomApi.aliases.rotate(accessToken, id!, body);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: aliasesAll });
      void qc.invalidateQueries({ queryKey: vaultAll });
      void qc.invalidateQueries({
        queryKey: queryKeys.aliasDetail(accessToken, data.alias.id),
      });
      void qc.invalidateQueries({
        queryKey: dashboardOverviewAll,
      });
      void qc.invalidateQueries({ queryKey: queryKeys.userMe(accessToken) });
      void navigate(`/aliases/${data.alias.id}`, { replace: true });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async () => {
      const res = await phantomApi.aliases.remove(accessToken, id!);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: aliasesAll });
      void qc.invalidateQueries({ queryKey: vaultAll });
      void qc.invalidateQueries({ queryKey: aliasDetailAll });
      void qc.invalidateQueries({
        queryKey: dashboardOverviewAll,
      });
      void qc.invalidateQueries({ queryKey: queryKeys.userMe(accessToken) });
      void navigate("/aliases", { replace: true });
    },
  });

  if (!accessToken) {
    return <SessionGateMessage />;
  }

  if (aliasQuery.isPending) {
    return (
      <div className="px-8 py-10 font-sans text-sm text-ph-text-tertiary">
        Loading alias…
      </div>
    );
  }

  if (aliasQuery.isError || !alias) {
    return (
      <div className="px-8 py-10">
        <p className="font-sans text-sm text-ph-danger">
          Could not load alias.
        </p>
        <button
          type="button"
          onClick={() => void navigate("/aliases")}
          className="mt-4 cursor-pointer font-sans text-xs text-ph-accent-light hover:underline"
        >
          Back to aliases
        </button>
      </div>
    );
  }

  const displayValue =
    alias.encryptedValue && decryptedPlain !== null
      ? decryptedPlain
      : alias.value;

  const page = (
    <div className="px-8 py-6">
      <button
        type="button"
        onClick={() => void navigate("/aliases")}
        className="mb-4 cursor-pointer font-sans text-xs text-ph-text-tertiary hover:text-ph-text-secondary"
      >
        ← Back to aliases
      </button>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-ph-border bg-ph-surface p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-sans text-lg font-semibold text-ph-text-primary">
                {alias.serviceName ?? "Unnamed service"}
              </h1>
              <span
                className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${categoryBadgeClass(alias.category)}`}
              >
                {categoryLabel(alias.category)}
              </span>
              {alias.encryptedValue && (
                <span className="rounded-full border border-ph-accent-border bg-[#6C3AED15] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ph-accent-light">
                  e2e encrypted
                </span>
              )}
            </div>
            {alias.serviceUrl && (
              <p className="mt-1 font-mono text-[11px] text-ph-text-ghost">
                {alias.serviceUrl}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${healthDot(alias.healthStatus)}`}
            />
            <span
              className={`font-sans text-sm font-medium capitalize ${healthColor(alias.healthStatus)}`}
            >
              {alias.healthStatus}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <InfoBlock label="Type" value={typeLabel(alias.type)} />
          <InfoBlock
            label="Status"
            value={alias.isActive ? "Active" : "Inactive"}
            valueClass={alias.isActive ? "text-emerald-400" : "text-ph-text-tertiary"}
          />
          <InfoBlock label="Created" value={formatDate(alias.createdAt)} />
          <InfoBlock
            label="Last activity"
            value={alias.lastActivityAt ? formatDate(alias.lastActivityAt) : "—"}
          />
          <InfoBlock label="Spam count" value={String(alias.spamCount)} />
          <InfoBlock label="Alias ID" value={alias.id} mono />
        </div>

        <div className="mt-6 rounded-lg border border-ph-borderSubtle bg-ph-bg p-4">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ph-text-muted">
            Value
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setRevealed((r) => !r)}
              className="min-w-0 flex-1 cursor-pointer break-all text-left font-mono text-sm text-ph-text-primary"
            >
              {maskAliasValue(alias.type, displayValue, revealed)}
            </button>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(displayValue);
                setCopiedId(alias.id);
              }}
              className="shrink-0 cursor-pointer rounded-md border border-ph-border px-3 py-1.5 font-sans text-[10px] text-ph-accent-light hover:bg-ph-raised"
            >
              {copiedId === alias.id ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-ph-borderSubtle pt-6">
          {alias.isActive && (
            <>
              <button
                type="button"
                disabled={rotateMutation.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      "Rotate this alias? The current value will be quarantined."
                    )
                  )
                    rotateMutation.mutate();
                }}
                className="cursor-pointer rounded-md border border-ph-border px-4 py-2 font-sans text-xs text-ph-text-secondary hover:bg-ph-raised disabled:opacity-50"
              >
                {rotateMutation.isPending ? "Rotating…" : "Rotate"}
              </button>
              <button
                type="button"
                disabled={deactivateMutation.isPending}
                onClick={() => {
                  if (window.confirm("Deactivate this alias?"))
                    deactivateMutation.mutate();
                }}
                className="cursor-pointer rounded-md border border-ph-border px-4 py-2 font-sans text-xs text-ph-danger hover:bg-ph-raised disabled:opacity-50"
              >
                {deactivateMutation.isPending
                  ? "Deactivating…"
                  : "Deactivate"}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );

  if (alias.type === "password" && alias.encryptedValue) {
    return <VaultUnlockGate>{page}</VaultUnlockGate>;
  }
  return page;
}

function InfoBlock({
  label,
  value,
  mono,
  valueClass,
}: {
  label: string;
  value: string;
  mono?: boolean;
  valueClass?: string;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-ph-text-muted">
        {label}
      </div>
      <div
        className={[
          "mt-1 text-sm",
          mono ? "font-mono text-[11px] text-ph-text-ghost" : "",
          valueClass ?? "text-ph-text-primary",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </div>
    </div>
  );
}
