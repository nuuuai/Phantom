import {
  clientErrorFromApiFailure,
  getQueryErrorMessage,
  type DarkWebFindingPublic,
} from "@phantom/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { UpgradeModal } from "@/components/upgrade/UpgradeModal.js";
import { SessionGateMessage } from "@/components/SessionGateMessage.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { formatRelativeTime } from "@/lib/formatRelative.js";
import {
  darkWebAll,
  dashboardOverviewAll,
  queryKeys,
} from "@/lib/queryKeys.js";
import { STALE } from "@/lib/queryStaleTimes.js";
import { useSessionStore } from "@/stores/useSessionStore.js";
import { DarkWebImpactPanel } from "./DarkWebImpactPanel.js";
import { DarkWebBreachTimeline } from "./DarkWebBreachTimeline.js";
import { DarkWebRemediationSteps } from "./DarkWebRemediationSteps.js";

function severityClass(s: DarkWebFindingPublic["severity"]): string {
  if (s === "critical") return "border-rose-500/50 bg-rose-500/10 text-rose-300";
  if (s === "high") return "border-amber-500/50 bg-amber-500/10 text-amber-200";
  if (s === "medium")
    return "border-ph-warning/50 bg-ph-warning/10 text-ph-warning";
  return "border-ph-border bg-ph-bg text-ph-text-tertiary";
}

export function DarkWebPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const qc = useQueryClient();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [refreshNote, setRefreshNote] = useState<string | null>(null);

  const userMeQuery = useQuery({
    queryKey: queryKeys.userMe(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.user.me(accessToken!, { signal });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    enabled: accessToken !== null,
    staleTime: STALE.userMe,
  });

  const summaryQuery = useQuery({
    queryKey: queryKeys.darkWebSummary(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.darkWeb.summary(accessToken!, { signal });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    enabled: accessToken !== null,
    staleTime: STALE.darkWeb,
  });

  const findingsQuery = useQuery({
    queryKey: queryKeys.darkWebFindings(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.darkWeb.findings(
        accessToken!,
        undefined,
        { signal }
      );
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    enabled: accessToken !== null,
    staleTime: STALE.darkWeb,
  });

  const impactQuery = useQuery({
    queryKey: queryKeys.darkWebImpact(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.darkWeb.impact(accessToken!, { signal });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    enabled:
      accessToken !== null && userMeQuery.data?.user.tier !== "free",
    staleTime: STALE.darkWeb,
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const res = await phantomApi.darkWeb.refresh(accessToken!);
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    onSuccess: (data) => {
      setRefreshNote(data.message);
      void qc.invalidateQueries({ queryKey: darkWebAll });
      void qc.invalidateQueries({ queryKey: dashboardOverviewAll });
      void qc.invalidateQueries({
        queryKey: queryKeys.notificationCount(accessToken),
      });
      void qc.invalidateQueries({
        queryKey: queryKeys.notifications(accessToken),
      });
      void qc.invalidateQueries({
        queryKey: queryKeys.darkWebImpact(accessToken),
      });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await phantomApi.darkWeb.dismiss(accessToken!, id);
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: darkWebAll });
      void qc.invalidateQueries({ queryKey: dashboardOverviewAll });
      void qc.invalidateQueries({
        queryKey: queryKeys.notificationCount(accessToken),
      });
      void qc.invalidateQueries({
        queryKey: queryKeys.darkWebImpact(accessToken),
      });
    },
  });

  if (!accessToken) {
    return <SessionGateMessage />;
  }

  const tierFree = userMeQuery.data?.user.tier === "free";
  const tierGated =
    tierFree ||
    summaryQuery.data?.tierGated === true ||
    findingsQuery.data?.tierGated === true;

  const items = findingsQuery.data?.items ?? [];
  const findingsMeta = findingsQuery.data;
  const summary = summaryQuery.data;

  return (
    <div className="px-8 py-6">
      <UpgradeModal
        open={upgradeOpen}
        reason="dark_web"
        onDismiss={() => setUpgradeOpen(false)}
        titleId="dark-web-upgrade-title"
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-sans text-xl font-semibold text-ph-text-primary">
            Dark web monitoring
          </h1>
          <p className="mt-1 max-w-2xl font-sans text-sm text-ph-text-tertiary">
            Metadata-only exposure records (no plaintext passwords). Phase 1 uses
            optional{" "}
            <span className="font-mono text-[11px]">Have I Been Pwned</span> breach
            lookup when <span className="font-mono text-[11px]">DARK_WEB_HIBP_API_KEY</span>{" "}
            is set — not live marketplace crawling.
          </p>
        </div>
        {!tierGated ? (
          <button
            type="button"
            disabled={refreshMutation.isPending}
            onClick={() => {
              setRefreshNote(null);
              refreshMutation.mutate();
            }}
            className="cursor-pointer rounded-md border border-ph-accent-border bg-[#6C3AED15] px-4 py-2 font-sans text-xs font-medium text-ph-accent-light disabled:opacity-50"
          >
            {refreshMutation.isPending ? "Checking…" : "Check exposures"}
          </button>
        ) : null}
      </div>

      {tierGated ? (
        <div className="mt-6 rounded-lg border border-ph-border bg-ph-surface p-5">
          <p className="font-sans text-sm text-ph-text-secondary">
            Dark web breach checks are included with{" "}
            <span className="font-medium text-ph-text-primary">Phantom Pro</span>.
            Upgrade to run Have I Been Pwned lookups and track exposures here.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setUpgradeOpen(true)}
              className="cursor-pointer rounded-md border border-ph-accent-border bg-[#6C3AED15] px-4 py-2 font-sans text-xs font-medium text-ph-accent-light"
            >
              View upgrade options
            </button>
            <Link
              to="/billing"
              className="inline-flex items-center rounded-md border border-ph-border bg-ph-raised px-4 py-2 font-sans text-xs text-ph-text-secondary hover:bg-ph-border/40"
            >
              Billing
            </Link>
          </div>
        </div>
      ) : null}

      {!tierGated && summaryQuery.isSuccess && summary ? (
        <div className="mt-6 flex flex-wrap gap-3 font-mono text-[11px] text-ph-text-muted">
          <span>Open: {String(summary.openCount)}</span>
          <span>
            L/M/H/C: {String(summary.bySeverity.low)}/
            {String(summary.bySeverity.medium)}/{String(summary.bySeverity.high)}/
            {String(summary.bySeverity.critical)}
          </span>
        </div>
      ) : null}

      {refreshNote && !tierGated ? (
        <p
          className="mt-4 rounded-md border border-ph-border bg-ph-raised/40 px-3 py-2 font-sans text-[11px] text-ph-text-secondary"
          role="status"
        >
          {refreshNote}
        </p>
      ) : null}

      {refreshMutation.isError ? (
        <p className="mt-3 font-sans text-[11px] text-ph-danger">
          {getQueryErrorMessage(refreshMutation.error)}
        </p>
      ) : null}

      {!tierGated && impactQuery.data && impactQuery.data.items.length > 0 ? (
        <DarkWebImpactPanel items={impactQuery.data.items} />
      ) : null}

      {findingsQuery.isPending || summaryQuery.isPending ? (
        <p className="mt-8 font-sans text-sm text-ph-text-tertiary">
          Loading…
        </p>
      ) : null}

      {findingsQuery.isError ? (
        <div className="mt-8 rounded-md border border-ph-danger/40 bg-ph-danger/5 px-4 py-3">
          <p className="font-sans text-sm text-ph-danger">
            {getQueryErrorMessage(findingsQuery.error)}
          </p>
          <button
            type="button"
            onClick={() => void findingsQuery.refetch()}
            className="mt-3 cursor-pointer rounded-md border border-ph-border bg-ph-surface px-3 py-1.5 font-sans text-xs text-ph-text-secondary hover:bg-ph-raised"
          >
            Retry
          </button>
        </div>
      ) : null}

      {!tierGated &&
      findingsQuery.isSuccess &&
      items.length === 0 &&
      !findingsQuery.isPending ? (
        <div className="mt-10 rounded-xl border border-dashed border-ph-border bg-ph-surface/50 px-8 py-14 text-center">
          <p className="font-sans text-sm text-ph-text-secondary">
            No exposures recorded yet. Run <strong>Check exposures</strong> when
            your operator has configured the HIBP API key.
          </p>
          {import.meta.env.DEV ? (
            <p className="mt-3 font-sans text-[11px] text-ph-text-muted">
              Paid dev: use <span className="font-mono">POST /api/dark-web/seed-demo</span>{" "}
              (non-production) to insert a demo row.
            </p>
          ) : null}
        </div>
      ) : null}

      {!tierGated &&
      findingsMeta &&
      findingsMeta.total > 0 &&
      !findingsQuery.isPending ? (
        <p className="mt-8 font-mono text-[10px] text-ph-text-muted">
          {findingsMeta.total} total
          {findingsMeta.items.length < findingsMeta.total
            ? ` · showing ${findingsMeta.offset + 1}–${findingsMeta.offset + findingsMeta.items.length}`
            : ""}
        </p>
      ) : null}

      {!tierGated && items.length > 0 ? (
        <ul className="mt-8 space-y-3">
          {items.map((f) => (
            <li
              key={f.id}
              className="rounded-lg border border-ph-border bg-ph-surface p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${severityClass(f.severity)}`}
                    >
                      {f.severity}
                    </span>
                    {f.status === "dismissed" ? (
                      <span className="font-mono text-[10px] text-ph-text-muted">
                        dismissed
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-2 font-sans text-sm font-semibold text-ph-text-primary">
                    {f.title}
                  </h2>
                  <p className="mt-1 font-mono text-[10px] text-ph-text-muted">
                    {f.sourceLabel}
                    {f.breachName ? ` · ${f.breachName}` : ""} ·{" "}
                    {formatRelativeTime(f.detectedAt)}
                  </p>
                  <p className="mt-2 font-sans text-xs text-ph-text-tertiary">
                    {f.identifierType}:{" "}
                    <span className="font-mono text-[11px] text-ph-text-secondary">
                      {f.identifierDisplay}
                    </span>
                  </p>
                  <p className="mt-2 font-sans text-xs leading-relaxed text-ph-text-secondary">
                    {f.summary}
                  </p>
                  <p className="mt-2 font-sans text-[11px] text-ph-accent-light/90">
                    Recommended: {f.recommendedAction}
                  </p>
                  <DarkWebBreachTimeline finding={f} />
                  {f.status === "open" ? <DarkWebRemediationSteps finding={f} /> : null}
                </div>
                {f.status === "open" ? (
                  <button
                    type="button"
                    disabled={dismissMutation.isPending}
                    onClick={() => dismissMutation.mutate(f.id)}
                    className="shrink-0 cursor-pointer rounded-md border border-ph-border px-3 py-1.5 font-sans text-[11px] text-ph-text-secondary hover:bg-ph-raised disabled:opacity-50"
                  >
                    Dismiss
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
