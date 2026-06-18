import { clientErrorFromApiFailure, getQueryErrorMessage } from "@phantom/shared";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { SessionGateMessage } from "@/components/SessionGateMessage.js";
import { LAYER_STYLES } from "@/lib/layerColors.js";
import { DASHBOARD_PATHS } from "@/lib/dashboardRoutes.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { queryKeys } from "@/lib/queryKeys.js";
import { STALE } from "@/lib/queryStaleTimes.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

export function FamilyPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const shield = LAYER_STYLES.shield;

  const familyQuery = useQuery({
    queryKey: queryKeys.familySnapshot(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.family.snapshot(accessToken!, { signal });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    enabled: accessToken !== null,
    staleTime: STALE.family,
  });

  if (!accessToken) return <SessionGateMessage />;

  return (
    <div className="px-4 py-6 sm:px-8">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span
          className="rounded border px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: shield.text, backgroundColor: shield.bg, borderColor: shield.border }}
        >
          Shield
        </span>
        <h1 className="font-sans text-lg font-semibold text-ph-text-primary">
          Family
        </h1>
      </div>
      <p className="mt-1 max-w-2xl font-sans text-sm text-ph-text-tertiary">
        Shared threat intelligence and multi-seat protection for households.
        Enterprise tier unlocks full seat management.
      </p>

      {familyQuery.isPending && (
        <p className="mt-8 font-sans text-sm text-ph-text-tertiary">Loading…</p>
      )}
      {familyQuery.isError && (
        <p className="mt-8 font-sans text-sm text-ph-danger">
          {getQueryErrorMessage(familyQuery.error)}
        </p>
      )}
      {familyQuery.data && (
        <>
          {familyQuery.data.tierGated ? (
            <div className="mt-6 rounded-xl border border-ph-accent-border bg-ph-accent/[0.08] px-5 py-4">
              <p className="font-sans text-sm text-ph-text-secondary">
                Family seats require Enterprise. Your current plan shows a preview of
                the owner seat only.
              </p>
              <Link
                to={DASHBOARD_PATHS.billing}
                className="mt-3 inline-block font-sans text-xs font-medium text-ph-accent-light hover:underline"
              >
                View billing →
              </Link>
            </div>
          ) : null}
          <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-ph-border">
            {[
              { label: "Seats", value: `${familyQuery.data.seatsUsed}/${familyQuery.data.seatCount}` },
              { label: "Shared patterns", value: familyQuery.data.sharedThreatPatterns },
              { label: "Members", value: familyQuery.data.members.length },
            ].map((c) => (
              <div key={c.label} className="bg-ph-surface px-4 py-5">
                <div className="font-mono text-[10px] uppercase text-ph-text-muted">
                  {c.label}
                </div>
                <div className="mt-1 text-2xl font-light text-ph-text-primary">
                  {c.value}
                </div>
              </div>
            ))}
          </div>
          <ul className="mt-6 divide-y divide-ph-borderSubtle rounded-xl border border-ph-border bg-ph-surface">
            {familyQuery.data.members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <div className="font-sans text-sm font-medium text-ph-text-primary">
                    {m.displayLabel}
                  </div>
                  <div className="font-sans text-xs capitalize text-ph-text-tertiary">
                    {m.role}
                  </div>
                </div>
                <div className="flex gap-4 font-mono text-[10px] text-ph-text-muted">
                  <span>{m.aliasesProtected} aliases</span>
                  <span>{m.threatAlerts} alerts</span>
                  <span>{m.callGuardEnabled ? "Call Guard on" : "Call Guard off"}</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
