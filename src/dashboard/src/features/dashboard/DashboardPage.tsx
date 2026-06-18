import { clientErrorFromApiFailure, getQueryErrorMessage } from "@phantom/shared";
import { useQuery } from "@tanstack/react-query";
import { CopilotPanel } from "./CopilotPanel.js";
import { DailyBrief } from "./DailyBrief.js";
import { PriorityActionsQueue } from "./PriorityActionsQueue.js";
import { RiskIntelligenceCard } from "./RiskIntelligenceCard.js";
import { IntelligenceFeedPanel } from "./IntelligenceFeedPanel.js";
import { ActivityTimeline } from "./ActivityTimeline.js";
import { QuickActionsGrid } from "./QuickActionsGrid.js";
import { StatGrid } from "./StatGrid.js";
import { SystemLayersPanel } from "./SystemLayersPanel.js";
import { ThreatIntelPreviewPanel } from "./ThreatIntelPreviewPanel.js";
import { WeeklyScamsChart } from "./WeeklyScamsChart.js";
import { DashboardGettingStarted } from "./DashboardGettingStarted.js";
import { shouldSkipDevBootstrap } from "@/lib/devBootstrap.js";
import { queryKeys } from "@/lib/queryKeys.js";
import { STALE } from "@/lib/queryStaleTimes.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

export function DashboardPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const devBootstrapError = useSessionStore((s) => s.devBootstrapError);

  const overviewQuery = useQuery({
    queryKey: queryKeys.dashboardOverview(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.dashboard.overview(accessToken ?? undefined, {
        signal,
      });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    enabled: accessToken !== null,
    staleTime: STALE.dashboardOverview,
  });

  const threatPreviewQuery = useQuery({
    queryKey: queryKeys.threatIntelPatterns(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.threatIntel.patterns(accessToken!, { signal });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data.patterns;
    },
    enabled: accessToken !== null && overviewQuery.data?.metricsDemoMode === false,
    staleTime: STALE.threatIntel,
  });

  if (!accessToken) {
    if (shouldSkipDevBootstrap()) {
      return (
      <div className="px-4 py-6 sm:px-8">
        <h1 className="font-sans text-xl font-semibold text-ph-text-primary">
          Overview
        </h1>
        <p className="mt-3 max-w-md font-sans text-sm leading-relaxed text-ph-text-tertiary">
            You are signed out. Use{" "}
            <span className="font-medium text-ph-text-secondary">
              Resume dev session
            </span>{" "}
            in the top bar to sign in again with the seeded dev account.
          </p>
        </div>
      );
    }
    return (
      <div className="px-4 py-6 sm:px-8">
        <h1 className="font-sans text-xl font-semibold text-ph-text-primary">
          Overview
        </h1>
        {devBootstrapError ? (
          <p className="mt-3 max-w-lg font-sans text-sm text-ph-danger">
            {devBootstrapError}
          </p>
        ) : (
          <p className="mt-3 font-sans text-sm text-ph-text-tertiary">
            Connecting session…
          </p>
        )}
      </div>
    );
  }

  if (overviewQuery.isPending) {
    return (
      <div className="px-4 py-6 font-sans text-sm text-ph-text-tertiary sm:px-8">
        Loading overview…
      </div>
    );
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <div className="px-4 py-6 sm:px-8">
        <h1 className="font-sans text-xl font-semibold text-ph-text-primary">
          Overview
        </h1>
        <p className="mt-3 max-w-lg font-sans text-sm text-ph-danger">
          {overviewQuery.isError
            ? getQueryErrorMessage(overviewQuery.error)
            : "Could not load overview."}
        </p>
        <p className="mt-2 font-sans text-xs text-ph-text-muted">
          Check that the API is running and reachable (see{" "}
          <span className="font-mono">DEPLOYMENT.md</span> /{" "}
          <span className="font-mono">VITE_API_URL</span>).
        </p>
        <button
          type="button"
          onClick={() => void overviewQuery.refetch()}
          className="mt-4 rounded-md border border-ph-border bg-ph-raised px-4 py-2 font-sans text-xs font-medium text-ph-text-primary hover:bg-ph-border/50"
        >
          Retry
        </button>
      </div>
    );
  }

  const data = overviewQuery.data;

  return (
    <div className="px-4 py-6 sm:px-8">
      {data.metricsDemoMode ? (
        <p
          className="mb-4 rounded-md border border-ph-warning/40 bg-ph-warning/10 px-3 py-2 font-sans text-[11px] text-ph-warning"
          role="status"
        >
          Sword / weekly chart metrics are <strong>synthetic</strong> (
          <span className="font-mono">DASHBOARD_DEMO_METRICS=1</span> or{" "}
          <span className="font-mono">OVERVIEW_DEMO_METRICS=1</span> on the API).
          Unset for honest Phase 1 zeros.
        </p>
      ) : null}
      {data.activeAliases === 0 ? <DashboardGettingStarted /> : null}
      <DailyBrief lines={data.dailyBrief} />
      <PriorityActionsQueue actions={data.priorityActions} />
      <RiskIntelligenceCard
        riskScore={data.riskScore}
        riskTrend={data.riskTrend}
        factors={data.riskFactors}
        trendSeries={data.riskTrendSeries}
        narrative={data.riskNarrative}
      />
      <StatGrid data={data} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-5">
          <IntelligenceFeedPanel items={data.intelligence} />
          <CopilotPanel overview={data} />
          <ActivityTimeline items={data.activity} />
        </div>
        <div className="flex flex-col gap-5">
          {data.metricsDemoMode ? (
            <WeeklyScamsChart
              values={data.weeklyScams}
              labels={data.weekDays}
              demoMode={data.metricsDemoMode}
            />
          ) : threatPreviewQuery.data && threatPreviewQuery.data.length > 0 ? (
            <ThreatIntelPreviewPanel patterns={threatPreviewQuery.data} />
          ) : null}
          <SystemLayersPanel layers={data.systemLayers} />
          <QuickActionsGrid />
        </div>
      </div>
    </div>
  );
}
