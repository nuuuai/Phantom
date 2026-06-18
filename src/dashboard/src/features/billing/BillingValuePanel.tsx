import { clientErrorFromApiFailure, getQueryErrorMessage } from "@phantom/shared";
import { useQuery } from "@tanstack/react-query";
import { LAYER_STYLES } from "@/lib/layerColors.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { queryKeys } from "@/lib/queryKeys.js";
import { STALE } from "@/lib/queryStaleTimes.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

export function BillingValuePanel() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const brain = LAYER_STYLES.brain;

  const query = useQuery({
    queryKey: queryKeys.billingValueSummary(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.billing.valueSummary(accessToken!, { signal });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    enabled: accessToken !== null,
    staleTime: STALE.billingValueSummary,
  });

  if (!accessToken || query.isPending) return null;
  if (query.isError) {
    return (
      <p className="mt-6 font-sans text-xs text-ph-danger">
        {getQueryErrorMessage(query.error)}
      </p>
    );
  }

  const summary = query.data;
  if (!summary) return null;

  return (
    <section className="mt-6 max-w-xl rounded-xl border border-ph-border bg-ph-surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded border px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-wider"
          style={{ color: brain.text, backgroundColor: brain.bg, borderColor: brain.border }}
        >
          Brain
        </span>
        <div className="font-mono text-[10px] font-semibold uppercase text-ph-text-muted">
          Pro value
        </div>
      </div>
      <p className="mt-3 font-sans text-sm text-ph-text-secondary">{summary.headline}</p>
      <ul className="mt-3 space-y-1 font-sans text-sm text-ph-text-secondary">
        <li>{summary.brokersRemoved} broker removal(s) confirmed</li>
        <li>{summary.activeAliases} active aliases protected</li>
        <li>{summary.darkWebAlerts} dark web alert(s) monitored</li>
        <li>~{summary.autopilotActionsEstimate} autopilot action(s) estimated</li>
        <li>Est. hours saved this month: {summary.hoursSavedEstimate}</li>
      </ul>
    </section>
  );
}
