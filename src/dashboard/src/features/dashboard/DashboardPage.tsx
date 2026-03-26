import { useQuery } from "@tanstack/react-query";
import { ActivityTimeline } from "./ActivityTimeline.js";
import { QuickActionsGrid } from "./QuickActionsGrid.js";
import { StatGrid } from "./StatGrid.js";
import { SystemLayersPanel } from "./SystemLayersPanel.js";
import { WeeklyScamsChart } from "./WeeklyScamsChart.js";
import { DashboardGettingStarted } from "./DashboardGettingStarted.js";
import { shouldSkipDevBootstrap } from "@/lib/devBootstrap.js";
import { queryKeys } from "@/lib/queryKeys.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

export function DashboardPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const devBootstrapError = useSessionStore((s) => s.devBootstrapError);

  const overviewQuery = useQuery({
    queryKey: queryKeys.dashboardOverview(accessToken),
    queryFn: async () => {
      const res = await phantomApi.dashboard.overview(accessToken ?? undefined);
      if (!res.ok) {
        throw new Error(res.error.message);
      }
      return res.data;
    },
    enabled: accessToken !== null,
  });

  if (!accessToken) {
    if (shouldSkipDevBootstrap()) {
      return (
        <div className="px-8 py-6">
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
      <div className="px-8 py-6">
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
      <div className="px-8 py-6 font-sans text-sm text-ph-text-tertiary">
        Loading overview…
      </div>
    );
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    const detail =
      overviewQuery.error instanceof Error
        ? overviewQuery.error.message
        : "Could not load overview.";
    return (
      <div className="px-8 py-6">
        <h1 className="font-sans text-xl font-semibold text-ph-text-primary">
          Overview
        </h1>
        <p className="mt-3 max-w-lg font-sans text-sm text-ph-danger">
          {detail}
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
    <div className="px-8 py-6">
      {data.activeAliases === 0 ? <DashboardGettingStarted /> : null}
      <StatGrid data={data} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
        <ActivityTimeline items={data.activity} />
        <div className="flex flex-col gap-5">
          <WeeklyScamsChart
            values={data.weeklyScams}
            labels={data.weekDays}
          />
          <SystemLayersPanel layers={data.systemLayers} />
          <QuickActionsGrid />
        </div>
      </div>
    </div>
  );
}
