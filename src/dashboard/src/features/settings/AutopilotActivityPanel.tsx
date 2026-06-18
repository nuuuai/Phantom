import type { AutopilotActionRecord } from "@phantom/shared";
import { clientErrorFromApiFailure, getQueryErrorMessage } from "@phantom/shared";
import { useQuery } from "@tanstack/react-query";
import { LAYER_STYLES } from "@/lib/layerColors.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { formatRelativeTime } from "@/lib/formatRelative.js";
import { queryKeys } from "@/lib/queryKeys.js";
import { STALE } from "@/lib/queryStaleTimes.js";

function kindLabel(kind: AutopilotActionRecord["kind"]): string {
  if (kind === "ftc_complaint_queued") return "FTC queue";
  if (kind === "breach_playbook_triggered") return "Breach playbook";
  if (kind === "broker_removal_submitted") return "Broker removal";
  if (kind === "alias_rotated") return "Alias rotated";
  return "Inbox warning";
}

interface AutopilotActivityPanelProps {
  accessToken: string;
}

export function AutopilotActivityPanel({ accessToken }: AutopilotActivityPanelProps) {
  const autopilot = LAYER_STYLES.autopilot;

  const query = useQuery({
    queryKey: queryKeys.autopilotActions(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.autopilot.actions(accessToken, { signal });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data.items;
    },
    enabled: accessToken.length > 0,
    staleTime: STALE.autopilotActions,
  });

  if (query.isPending) {
    return (
      <section className="rounded-xl border border-ph-border bg-ph-surface p-5">
        <p className="font-sans text-xs text-ph-text-tertiary">Loading autopilot log…</p>
      </section>
    );
  }

  if (query.isError) {
    return (
      <section className="rounded-xl border border-ph-border bg-ph-surface p-5">
        <p className="font-sans text-xs text-ph-danger">
          {getQueryErrorMessage(query.error)}
        </p>
      </section>
    );
  }

  const items = query.data ?? [];

  return (
    <section className="rounded-xl border border-ph-border bg-ph-surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded border px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-wider"
          style={{
            color: autopilot.text,
            backgroundColor: autopilot.bg,
            borderColor: autopilot.border,
          }}
        >
          Autopilot
        </span>
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-ph-text-muted">
          Action log
        </div>
      </div>
      <p className="mt-2 font-sans text-xs text-ph-text-tertiary">
        Recent autonomous actions triggered by your prefs — append-only audit trail.
      </p>
      {items.length === 0 ? (
        <p className="mt-4 font-sans text-sm text-ph-text-muted">
          No autopilot actions logged yet. Enable prefs above and load the overview
          to run the autopilot tick.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-ph-borderSubtle rounded-lg border border-ph-borderSubtle">
          {items.map((item) => (
            <li key={item.id} className="px-3 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-sans text-sm font-medium text-ph-text-primary">
                  {item.title}
                </span>
                <span className="font-mono text-[9px] uppercase text-ph-text-muted">
                  {kindLabel(item.kind)}
                </span>
              </div>
              <p className="mt-1 font-sans text-xs text-ph-text-tertiary">
                {item.description}
              </p>
              <p className="mt-1 font-mono text-[10px] text-ph-text-ghost">
                {formatRelativeTime(item.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
