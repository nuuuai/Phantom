import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { Alias, AliasCategory, HealthStatus } from "@phantom/shared";
import { EditAliasModal } from "./EditAliasModal.js";
import { GenerateAliasModal } from "./GenerateAliasModal.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { categoryBadgeClass, categoryLabel } from "@/lib/categoryBadgeStyle.js";
import { formatRelativeTime } from "@/lib/formatRelative.js";
import { maskAliasValue } from "@/lib/maskAliasValue.js";
import { queryKeys } from "@/lib/queryKeys.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

const CATEGORY_TABS: { id: "all" | AliasCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "shopping", label: "Shopping" },
  { id: "social", label: "Social" },
  { id: "finance", label: "Finance" },
  { id: "work", label: "Work" },
  { id: "dating", label: "Dating" },
  { id: "newsletter", label: "Newsletter" },
  { id: "temp", label: "Temp" },
];

const HEALTH_OPTIONS: { id: "all" | HealthStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "healthy", label: "Healthy" },
  { id: "warning", label: "Warning" },
  { id: "compromised", label: "Compromised" },
  { id: "quarantined", label: "Quarantined" },
];

function typeGlyph(type: Alias["type"]): string {
  if (type === "email") return "@";
  if (type === "phone") return "☎";
  if (type === "username") return "◇";
  return "⌘";
}

function healthDotClass(h: HealthStatus): string {
  if (h === "healthy") return "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]";
  if (h === "warning") return "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.45)]";
  if (h === "compromised") return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.45)]";
  return "bg-ph-text-tertiary shadow-[0_0_6px_rgba(85,85,94,0.4)]";
}

export function AliasesPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [categoryTab, setCategoryTab] = useState<"all" | AliasCategory>("all");
  const [healthFilter, setHealthFilter] = useState<"all" | HealthStatus>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editAlias, setEditAlias] = useState<Alias | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const queryParams = useMemo(
    () => ({
      category:
        categoryTab === "all" ? undefined : categoryTab,
      health: healthFilter === "all" ? undefined : healthFilter,
    }),
    [categoryTab, healthFilter]
  );

  const listQuery = useQuery({
    queryKey: queryKeys.aliasesList(
      accessToken,
      categoryTab,
      healthFilter
    ),
    queryFn: async () => {
      const res = await phantomApi.aliases.list(accessToken, queryParams);
      if (!res.ok) throw new Error(res.error.message);
      return res.data.items;
    },
    enabled: accessToken !== null,
  });

  const userMeQuery = useQuery({
    queryKey: queryKeys.userMe(accessToken),
    queryFn: async () => {
      const res = await phantomApi.user.me(accessToken);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
    enabled: accessToken !== null,
  });

  const rotateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await phantomApi.aliases.rotate(accessToken, id);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["aliases"] });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.userMe(accessToken),
      });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await phantomApi.aliases.remove(accessToken, id);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["aliases"] });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.userMe(accessToken),
      });
    },
  });

  const copyValue = (value: string) => {
    void navigator.clipboard.writeText(value);
  };

  const toggleReveal = (id: string) => {
    setRevealed((r) => ({ ...r, [id]: !r[id] }));
  };

  if (!accessToken) {
    return (
      <div className="px-8 py-6 font-sans text-sm text-ph-text-tertiary">
        Connecting session… ensure API is running and dev credentials match the
        seeded user (see .env.example).
      </div>
    );
  }

  const items = listQuery.data ?? [];

  return (
    <div className="px-8 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-sans text-xl font-semibold text-ph-text-primary">
            Aliases
          </h1>
          <p className="mt-1 font-sans text-sm text-ph-text-tertiary">
            Shield identities for every signup — email, phone, username, and
            passwords.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-md border border-ph-accent-border bg-[#6C3AED15] px-4 py-2 font-sans text-xs font-medium text-ph-accent-light"
        >
          + Generate alias
        </button>
      </div>

      {userMeQuery.data?.user.tier === "free" ? (
        <div className="mt-4 flex flex-wrap gap-3 rounded-lg border border-ph-border bg-ph-bg px-4 py-3 font-mono text-[11px] text-ph-text-tertiary">
          <span className="text-ph-text-muted">Free tier usage:</span>
          {userMeQuery.data.aliasUsage.map((u) => (
            <span key={u.type}>
              {u.type}{" "}
              <span className="text-ph-text-secondary">
                {u.used}/{u.max === null ? "∞" : u.max}
              </span>
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1">
          {CATEGORY_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setCategoryTab(t.id)}
              className={`rounded-full px-3 py-1.5 font-sans text-xs font-medium transition-colors ${
                categoryTab === t.id
                  ? "bg-ph-raised text-ph-text-primary ring-1 ring-ph-border"
                  : "text-ph-text-tertiary hover:text-ph-text-secondary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase text-ph-text-muted">
            Health
          </span>
          <select
            value={healthFilter}
            onChange={(e) =>
              setHealthFilter(e.target.value as "all" | HealthStatus)
            }
            className="rounded-md border border-ph-border bg-ph-bg px-3 py-1.5 font-sans text-xs text-ph-text-primary"
          >
            {HEALTH_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {listQuery.isPending ? (
        <p className="mt-8 font-sans text-sm text-ph-text-tertiary">
          Loading…
        </p>
      ) : null}
      {listQuery.isError ? (
        <p className="mt-8 font-sans text-sm text-ph-danger">
          Could not load aliases. Is the API running with PostgreSQL migrated?
        </p>
      ) : null}

      {!listQuery.isPending && !listQuery.isError && items.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-ph-border bg-ph-surface/50 px-8 py-16 text-center">
          <p className="font-sans text-sm text-ph-text-secondary">
            No aliases yet. Generate one to start shielding signups.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-4 rounded-md border border-ph-accent-border bg-[#6C3AED15] px-4 py-2 font-sans text-xs font-medium text-ph-accent-light"
          >
            Generate your first alias
          </button>
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="mt-8 overflow-x-auto rounded-xl border border-ph-border">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead>
              <tr className="border-b border-ph-border bg-ph-bg font-mono text-[10px] uppercase tracking-wide text-ph-text-muted">
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Health</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-ph-borderSubtle last:border-0"
                >
                  <td className="px-4 py-3 font-mono text-sm text-ph-text-secondary">
                    <span title={row.type}>{typeGlyph(row.type)}</span>
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleReveal(row.id)}
                      className="break-all text-left font-mono text-xs text-ph-text-primary hover:text-ph-accent-light"
                    >
                      {maskAliasValue(
                        row.type,
                        row.value,
                        revealed[row.id] ?? false
                      )}
                    </button>
                  </td>
                  <td className="max-w-[200px] px-4 py-3">
                    <div className="font-sans text-xs text-ph-text-secondary">
                      {row.serviceName ?? "—"}
                    </div>
                    {row.serviceUrl ? (
                      <div className="truncate font-mono text-[10px] text-ph-text-ghost">
                        {row.serviceUrl}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${categoryBadgeClass(row.category)}`}
                    >
                      {categoryLabel(row.category)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${healthDotClass(row.healthStatus)}`}
                      />
                      <span className="font-sans text-xs text-ph-text-tertiary">
                        {row.healthStatus}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-ph-text-ghost">
                    {formatRelativeTime(row.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      <button
                        type="button"
                        className="rounded px-2 py-1 font-sans text-[10px] text-ph-accent-light hover:bg-ph-raised"
                        onClick={() => copyValue(row.value)}
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        className="rounded px-2 py-1 font-sans text-[10px] text-ph-text-secondary hover:bg-ph-raised"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Rotate this alias? The current value will be quarantined."
                            )
                          ) {
                            rotateMutation.mutate(row.id);
                          }
                        }}
                      >
                        Rotate
                      </button>
                      <button
                        type="button"
                        className="rounded px-2 py-1 font-sans text-[10px] text-ph-text-secondary hover:bg-ph-raised"
                        onClick={() => setEditAlias(row)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded px-2 py-1 font-sans text-[10px] text-ph-danger hover:bg-ph-raised"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Deactivate this alias? You can filter inactive later."
                            )
                          ) {
                            deactivateMutation.mutate(row.id);
                          }
                        }}
                      >
                        Deactivate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <GenerateAliasModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <EditAliasModal
        alias={editAlias}
        open={editAlias !== null}
        onClose={() => setEditAlias(null)}
      />
    </div>
  );
}
