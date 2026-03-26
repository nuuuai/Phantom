import { useQuery } from "@tanstack/react-query";
import { ActivityTimeline } from "./ActivityTimeline.js";
import { QuickActionsGrid } from "./QuickActionsGrid.js";
import { StatGrid } from "./StatGrid.js";
import { SystemLayersPanel } from "./SystemLayersPanel.js";
import { WeeklyScamsChart } from "./WeeklyScamsChart.js";
import { queryKeys } from "@/lib/queryKeys.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

export function DashboardPage() {
  const accessToken = useSessionStore((s) => s.accessToken);

  const overviewQuery = useQuery({
    queryKey: queryKeys.dashboardOverview(accessToken),
    queryFn: async () => {
      const res = await phantomApi.dashboard.overview(accessToken ?? undefined);
      if (!res.ok) {
        throw new Error(res.error.message);
      }
      return res.data;
    },
  });

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
