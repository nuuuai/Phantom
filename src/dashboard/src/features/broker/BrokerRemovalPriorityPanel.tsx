import type { BrokerRemovalPriorityItem } from "@phantom/shared";
import { clientErrorFromApiFailure, getQueryErrorMessage } from "@phantom/shared";
import { useQuery } from "@tanstack/react-query";
import { LAYER_STYLES } from "@/lib/layerColors.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { queryKeys } from "@/lib/queryKeys.js";
import { STALE } from "@/lib/queryStaleTimes.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

function bandClass(band: string): string {
  if (band === "critical") return "text-ph-danger";
  if (band === "high") return "text-ph-warning";
  return "text-ph-text-secondary";
}

export function BrokerRemovalPriorityPanel() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const autopilot = LAYER_STYLES.autopilot;

  const query = useQuery({
    queryKey: queryKeys.brokerRemovalPriority(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.brokerScan.removalPriority(accessToken!, {
        signal,
      });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data.items;
    },
    enabled: accessToken !== null,
    staleTime: STALE.brokerScanResults,
  });

  if (!accessToken || query.isPending || query.isError) {
    if (query.isError) {
      return (
        <p className="mt-4 font-sans text-xs text-ph-danger">
          {getQueryErrorMessage(query.error)}
        </p>
      );
    }
    return null;
  }

  const items = query.data ?? [];
  if (items.length === 0) return null;

  return (
    <section className="mt-6 rounded-xl border border-ph-border bg-ph-surface">
      <header className="border-b border-ph-borderSubtle px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded border px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-wider"
            style={{
              color: autopilot.text,
              backgroundColor: autopilot.bg,
              borderColor: autopilot.border,
            }}
          >
            Autopilot
          </span>
          <h2 className="font-sans text-sm font-semibold text-ph-text-secondary">
            Removal orchestration
          </h2>
        </div>
        <p className="mt-1 font-sans text-xs text-ph-text-tertiary">
          Severity-ranked broker listings — submit opt-outs in this order (Pro).
        </p>
      </header>
      <ul className="divide-y divide-ph-borderSubtle">
        {items.map((item: BrokerRemovalPriorityItem) => (
          <li key={item.brokerScanResultId} className="px-5 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-sans text-sm font-medium text-ph-text-primary">
                #{item.priorityRank} {item.brokerName}
              </span>
              <span className={`font-mono text-[10px] uppercase ${bandClass(item.severityBand)}`}>
                {item.severityBand} · {item.severity}/100
              </span>
            </div>
            <p className="mt-1 font-mono text-[10px] text-ph-text-muted">
              {item.dataTypesFound.join(", ")} · {item.status}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
