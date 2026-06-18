import type { IntelligenceItem } from "@phantom/shared";
import { clientErrorFromApiFailure } from "@phantom/shared";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { phantomApi } from "@/lib/api/phantomApi.js";
import {
  aliasDetailAll,
  aliasesAll,
  brokerScanResultsAll,
  brokerScanSummaryAll,
  dashboardOverviewAll,
} from "@/lib/queryKeys.js";
import { LAYER_STYLES } from "@/lib/layerColors.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

interface IntelligenceFeedPanelProps {
  items: readonly IntelligenceItem[];
}

export function IntelligenceFeedPanel({ items }: IntelligenceFeedPanelProps) {
  const accessToken = useSessionStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<ReadonlySet<string>>(new Set());

  const invalidateCaches = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: dashboardOverviewAll });
    void queryClient.invalidateQueries({ queryKey: aliasesAll });
    void queryClient.invalidateQueries({ queryKey: aliasDetailAll });
    void queryClient.invalidateQueries({ queryKey: brokerScanSummaryAll });
    void queryClient.invalidateQueries({ queryKey: brokerScanResultsAll });
  }, [queryClient]);

  const runQuickAction = useCallback(
    async (item: IntelligenceItem) => {
      if (!accessToken || !item.quickAction) return;
      setBusyId(item.id);
      setActionError(null);
      try {
        const res = await phantomApi.copilot.confirm(accessToken, {
          toolId: item.quickAction.toolId,
          params: item.quickAction.params,
        });
        if (!res.ok) {
          setActionError(clientErrorFromApiFailure(res).message);
          return;
        }
        setDoneIds((prev) => new Set([...prev, item.id]));
        invalidateCaches();
      } catch {
        setActionError("Action failed. Try again from the target page.");
      } finally {
        setBusyId(null);
      }
    },
    [accessToken, invalidateCaches]
  );

  if (items.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-xl border border-ph-border bg-ph-surface p-5"
      aria-label="Intelligence feed"
    >
      <div className="mb-1 font-mono text-xs font-semibold uppercase tracking-wide text-ph-text-tertiary">
        Intelligence feed
      </div>
      <p className="mb-4 font-sans text-xs text-ph-text-muted">
        AI-prioritized signals — what to do next, not just what happened.
      </p>

      {actionError ? (
        <p className="mb-3 font-sans text-xs text-ph-danger" role="alert">
          {actionError}
        </p>
      ) : null}

      <ul className="space-y-0">
        {items.map((item, i) => {
          const layer = LAYER_STYLES[item.layer];
          const done = doneIds.has(item.id);
          return (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="border-b border-ph-borderSubtle py-3.5 last:border-0 last:pb-0"
            >
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span
                  className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: layer.text,
                    boxShadow: `0 0 6px ${layer.text}80`,
                  }}
                  aria-hidden
                />
                <span
                  className="rounded border px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    color: layer.text,
                    backgroundColor: layer.bg,
                    borderColor: layer.border,
                  }}
                >
                  {item.layer}
                </span>
                <span className="font-mono text-[10px] text-ph-text-muted">
                  {item.confidence}% conf
                </span>
              </div>
              <div className="font-sans text-[13px] font-medium text-ph-text-primary">
                {item.label}
                {done ? (
                  <span className="ml-2 font-sans text-xs font-normal text-ph-success">
                    Done
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 font-sans text-xs leading-relaxed text-ph-text-tertiary">
                {item.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.quickAction && !done ? (
                  <button
                    type="button"
                    onClick={() => void runQuickAction(item)}
                    disabled={busyId === item.id}
                    aria-busy={busyId === item.id}
                    className="rounded-md border border-ph-accent-border bg-ph-accent/[0.12] px-2.5 py-1 font-sans text-[11px] font-medium text-ph-accent-light hover:bg-ph-accent/[0.2] disabled:opacity-50"
                  >
                    {busyId === item.id ? "Running…" : "Run now"}
                  </button>
                ) : null}
                {item.href && item.actionLabel ? (
                  <Link
                    to={item.href}
                    className="rounded-md border border-ph-border px-2.5 py-1 font-sans text-[11px] text-ph-text-secondary hover:bg-ph-raised"
                  >
                    {item.actionLabel} →
                  </Link>
                ) : null}
              </div>
            </motion.li>
          );
        })}
      </ul>
    </motion.section>
  );
}
