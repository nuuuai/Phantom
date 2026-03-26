import { useQuery } from "@tanstack/react-query";
import { ActivityTimeline } from "./ActivityTimeline.js";
import { QuickActionsGrid } from "./QuickActionsGrid.js";
import { StatGrid } from "./StatGrid.js";
import { SystemLayersPanel } from "./SystemLayersPanel.js";
import { WeeklyScamsChart } from "./WeeklyScamsChart.js";
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
    return (
      <div className="px-8 py-6 font-sans text-sm text-ph-danger">
        Could not load overview. Is the API running on port 8787?
      </div>
    );
  }

  const data = overviewQuery.data;

  return (
    <div className="px-8 py-6">
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
