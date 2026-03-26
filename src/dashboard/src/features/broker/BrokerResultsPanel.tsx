import { motion } from "framer-motion";
import { Fragment, useMemo, useState } from "react";
import {
  BROKER_DATA_TYPES,
  brokerRemovalLinkLabel,
  resolveBrokerRemovalHref,
  type BrokerDataType,
  type BrokerScanResult,
  type BrokerScanSummary,
  type User,
} from "@phantom/shared";
import { brokerCategoryBadgeClass, brokerCategoryLabel } from "./brokerCategoryStyle.js";
import { dataTypeLabel, dataTypePillClass } from "./dataTypePillClass.js";
import {
  scanStatusDotClass,
  scanStatusLabel,
  scanStatusMonoClass,
} from "./scanStatusStyle.js";
import { formatRelativeTime } from "@/lib/formatRelative.js";

type TabId = "all" | "found" | "pending" | "removed" | "relisted";

const TABS: { id: TabId; label: string; status?: string }[] = [
  { id: "all", label: "All" },
  { id: "found", label: "Found", status: "found" },
  { id: "pending", label: "Pending", status: "pending" },
  { id: "removed", label: "Removed", status: "removed" },
  { id: "relisted", label: "Re-listed", status: "relisted" },
];

type SortKey = "name" | "category" | "status";

interface BrokerResultsPanelProps {
  summary: BrokerScanSummary;
  items: BrokerScanResult[];
  tab: TabId;
  onTab: (t: TabId) => void;
  searchQ: string;
  onSearchQ: (q: string) => void;
  tier: User["tier"];
  onRemoveAll: () => void;
  onRequestRemoval: (id: string) => void;
  onUpgrade: () => void;
  removeAllBusy: boolean;
  removalBusyId: string | null;
}

export function BrokerResultsPanel({
  summary,
  items,
  tab,
  onTab,
  searchQ,
  onSearchQ,
  tier,
  onRemoveAll,
  onRequestRemoval,
  onUpgrade,
  removeAllBusy,
  removalBusyId,
}: BrokerResultsPanelProps) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [expanded, setExpanded] = useState<string | null>(null);

  const isPaid = tier === "paid" || tier === "enterprise";

  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") {
        cmp = a.broker.name.localeCompare(b.broker.name);
      } else if (sortKey === "category") {
        cmp = a.broker.category.localeCompare(b.broker.category);
      } else {
        cmp = a.status.localeCompare(b.status);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [items, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir("asc");
    }
  };

  const total = summary.totalScanned;
  const exposed = summary.exposureCount;
  const pctRemoved =
    exposed > 0 ? Math.round((summary.removed / exposed) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ph-text-tertiary">
            Scan results
          </div>
          <h2 className="mt-1 font-sans text-lg font-semibold text-ph-text-primary">
            Found on{" "}
            <span className="font-mono text-ph-text-secondary">{exposed}</span>{" "}
            of{" "}
            <span className="font-mono text-ph-text-secondary">{total}</span>{" "}
            brokers
          </h2>
          <p className="mt-2 max-w-2xl font-sans text-sm text-ph-text-tertiary">
            Data types observed across brokers — mono values below are
            aggregate counts from this scan.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {BROKER_DATA_TYPES.map((dt: BrokerDataType) => (
              <span
                key={dt}
                className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${dataTypePillClass(dt)}`}
              >
                {dataTypeLabel(dt)} ·{" "}
                {String(summary.dataTypesBreakdown[dt] ?? 0)}
              </span>
            ))}
          </div>
        </div>

        <div className="flex w-full max-w-sm flex-col gap-3">
          {isPaid ? (
            <button
              type="button"
              disabled={removeAllBusy || summary.found === 0}
              onClick={onRemoveAll}
              className="w-full rounded-[8px] border border-ph-accent-border bg-[#6C3AED15] px-5 py-3 font-sans text-sm font-semibold text-ph-accent-light shadow-[0_0_24px_rgba(108,58,237,0.18)] transition-[transform,background-color] duration-200 hover:bg-[#6C3AED22] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {removeAllBusy ? "Submitting removals…" : "Remove all exposed"}
            </button>
          ) : (
            <button
              type="button"
              onClick={onUpgrade}
              className="w-full rounded-[8px] border border-ph-accent-border bg-[#6C3AED15] px-5 py-3 font-sans text-sm font-semibold text-ph-accent-light transition-colors duration-150 hover:bg-[#6C3AED25]"
            >
              Remove all — Pro
            </button>
          )}
          <div>
            <div className="mb-1.5 flex justify-between font-mono text-[10px] uppercase tracking-wide text-ph-text-muted">
              <span>Removal progress</span>
              <span className="text-ph-text-ghost">
                {String(pctRemoved)}% confirmed
              </span>
            </div>
            <div className="h-1 rounded-sm bg-ph-border">
              <div
                className="h-full rounded-sm bg-ph-success transition-[width] duration-[1500ms] ease-out"
                style={{ width: `${String(pctRemoved)}%` }}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-3 font-mono text-[11px] text-ph-text-ghost">
              <span className="text-ph-success">{summary.removed} removed</span>
              <span className="text-ph-warning">{summary.pending} pending</span>
              <span className="text-ph-danger">{summary.relisted} re-listed</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b border-ph-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTab(t.id)}
              className={[
                "rounded-md px-3 py-1.5 font-sans text-xs font-medium transition-colors duration-150",
                tab === t.id
                  ? "bg-ph-raised text-ph-text-primary"
                  : "text-ph-text-tertiary hover:text-ph-text-secondary",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Search brokers…"
          value={searchQ}
          onChange={(e) => onSearchQ(e.target.value)}
          className="w-full max-w-xs rounded-md border border-ph-border bg-ph-bg px-3 py-2 font-sans text-sm text-ph-text-primary placeholder:text-ph-text-muted focus:border-ph-accent-border focus:outline-none sm:w-64"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-ph-border bg-ph-surface">
        <table className="w-full min-w-[880px] border-collapse text-left">
          <thead>
            <tr className="border-b border-ph-borderSubtle">
              <th className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleSort("name")}
                  className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ph-text-muted"
                >
                  Broker {sortKey === "name" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleSort("category")}
                  className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ph-text-muted"
                >
                  Category {sortKey === "category" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </button>
              </th>
              <th className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ph-text-muted">
                Data types
              </th>
              <th className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleSort("status")}
                  className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ph-text-muted"
                >
                  Status {sortKey === "status" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </button>
              </th>
              <th className="px-4 py-3 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ph-text-muted">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const open = expanded === row.id;
              return (
                <Fragment key={row.id}>
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.04 }}
                    className="border-b border-ph-borderSubtle"
                  >
                    <td className="px-4 py-3 align-top">
                      <button
                        type="button"
                        onClick={() => setExpanded(open ? null : row.id)}
                        className="text-left font-sans text-sm font-medium text-ph-text-primary hover:text-white"
                      >
                        {row.broker.name}
                        <div className="mt-0.5 font-mono text-[11px] font-normal text-ph-text-ghost">
                          {row.broker.domain}
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`inline-block rounded px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${brokerCategoryBadgeClass(row.broker.category)}`}
                      >
                        {brokerCategoryLabel(row.broker.category)}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex max-w-[280px] flex-wrap gap-1">
                        {row.dataTypesFound.length === 0 ? (
                          <span className="font-mono text-[11px] text-ph-text-muted">
                            —
                          </span>
                        ) : (
                          row.dataTypesFound.map((dt) => (
                            <span
                              key={dt}
                              className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${dataTypePillClass(dt)}`}
                            >
                              {dataTypeLabel(dt)}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${scanStatusDotClass(row.status)}`}
                        />
                        <span
                          className={`font-mono text-[11px] ${scanStatusMonoClass(row.status)}`}
                        >
                          {scanStatusLabel(row.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <RemovalAction
                        row={row}
                        isPaid={isPaid}
                        busy={removalBusyId === row.id}
                        onPaid={() => onRequestRemoval(row.id)}
                        onUpgrade={onUpgrade}
                      />
                    </td>
                  </motion.tr>
                  {open ? (
                    <tr className="border-b border-ph-borderSubtle bg-ph-bg">
                      <td colSpan={5} className="px-4 pb-4 pt-0">
                        <div className="border-t border-ph-borderSubtle pt-4">
                          <div className="grid gap-4 md:grid-cols-3">
                            <div>
                              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ph-text-muted">
                                Removal method
                              </div>
                              <p className="mt-1 font-sans text-sm text-ph-text-secondary">
                                {row.broker.removalMethod.toUpperCase()} · typical{" "}
                                <span className="font-mono text-ph-text-tertiary">
                                  {row.broker.avgRemovalDays}d
                                </span>
                              </p>
                            </div>
                            <div>
                              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ph-text-muted">
                                Timeline
                              </div>
                              <ul className="mt-1 space-y-1 font-mono text-[11px] text-ph-text-tertiary">
                                <li>
                                  Found · {formatRelativeTime(row.scanDate)}
                                </li>
                                {row.removalSubmittedAt ? (
                                  <li>
                                    Submitted ·{" "}
                                    {formatRelativeTime(row.removalSubmittedAt)}
                                  </li>
                                ) : null}
                                {row.removalConfirmedAt ? (
                                  <li className="text-ph-success">
                                    Confirmed ·{" "}
                                    {formatRelativeTime(row.removalConfirmedAt)}
                                  </li>
                                ) : null}
                                {row.relistDetectedAt ? (
                                  <li className="text-ph-danger">
                                    Re-listed ·{" "}
                                    {formatRelativeTime(row.relistDetectedAt)}
                                  </li>
                                ) : null}
                              </ul>
                            </div>
                            <div>
                              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ph-text-muted">
                                Self-service (all tiers)
                              </div>
                              <a
                                href={resolveBrokerRemovalHref(row.broker)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex font-sans text-sm font-medium text-ph-accent-light underline-offset-2 hover:underline"
                              >
                                {brokerRemovalLinkLabel(row.broker)}
                              </a>
                              {row.broker.removalNotes ? (
                                <p className="mt-2 font-sans text-[11px] leading-snug text-ph-text-tertiary">
                                  {row.broker.removalNotes}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RemovalAction({
  row,
  isPaid,
  busy,
  onPaid,
  onUpgrade,
}: {
  row: BrokerScanResult;
  isPaid: boolean;
  busy: boolean;
  onPaid: () => void;
  onUpgrade: () => void;
}) {
  if (row.status === "not_found") {
    return (
      <span className="font-mono text-[11px] text-ph-text-muted">—</span>
    );
  }
  if (row.status === "removal_submitted") {
    return (
      <span className="font-mono text-[11px] text-ph-warning">Pending…</span>
    );
  }
  if (row.status === "removal_confirmed") {
    return (
      <span className="font-mono text-[11px] text-ph-success">Removed ✓</span>
    );
  }
  if (row.status === "re_listed") {
    return isPaid ? (
      <button
        type="button"
        disabled={busy}
        onClick={onPaid}
        className="rounded-md border border-ph-danger/40 bg-ph-danger/10 px-2.5 py-1 font-mono text-[11px] text-ph-danger hover:bg-ph-danger/15"
      >
        {busy ? "…" : "Re-remove"}
      </button>
    ) : (
      <button
        type="button"
        onClick={onUpgrade}
        className="rounded-md border border-ph-border px-2.5 py-1 font-mono text-[11px] text-ph-text-secondary"
      >
        Upgrade
      </button>
    );
  }
  if (row.status === "found") {
    return isPaid ? (
      <button
        type="button"
        disabled={busy}
        onClick={onPaid}
        className="rounded-md border border-ph-accent-border bg-[#6C3AED15] px-2.5 py-1 font-mono text-[11px] font-medium text-ph-accent-light hover:bg-[#6C3AED22]"
      >
        {busy ? "…" : "Request removal"}
      </button>
    ) : (
      <button
        type="button"
        onClick={onUpgrade}
        className="rounded-md border border-ph-border px-2.5 py-1 font-mono text-[11px] text-ph-text-secondary"
      >
        Request removal
      </button>
    );
  }
  return null;
}
