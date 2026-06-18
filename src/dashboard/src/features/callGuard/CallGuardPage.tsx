import { clientErrorFromApiFailure, getQueryErrorMessage } from "@phantom/shared";
import { useQuery } from "@tanstack/react-query";
import { SessionGateMessage } from "@/components/SessionGateMessage.js";
import { LAYER_STYLES } from "@/lib/layerColors.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { queryKeys } from "@/lib/queryKeys.js";
import { STALE } from "@/lib/queryStaleTimes.js";
import { useSessionStore } from "@/stores/useSessionStore.js";
import { CallGuardLiveDemo } from "./CallGuardLiveDemo.js";
import { CallGuardActiveBanner } from "./CallGuardActiveBanner.js";

export function CallGuardPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const sword = LAYER_STYLES.sword;

  const logsQuery = useQuery({
    queryKey: queryKeys.callGuardLogs(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.callGuard.logs(accessToken!, { signal });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    enabled: accessToken !== null,
    staleTime: STALE.callGuard,
  });

  if (!accessToken) return <SessionGateMessage />;

  return (
    <div className="px-4 py-6 sm:px-8">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span
          className="rounded border px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: sword.text, backgroundColor: sword.bg, borderColor: sword.border }}
        >
          Sword
        </span>
        <h1 className="font-sans text-lg font-semibold text-ph-text-primary">
          Call Guard
        </h1>
      </div>
      <p className="mt-1 max-w-2xl font-sans text-sm text-ph-text-tertiary">
        AI call screening with intent classification and scam confidence scoring.
        PSTN integration ships Phase 2 — logs below use deterministic demo data until
        telephony is live.
      </p>

      <CallGuardActiveBanner />

      {logsQuery.isPending && (
        <p className="mt-8 font-sans text-sm text-ph-text-tertiary">Loading…</p>
      )}
      {logsQuery.isError && (
        <p className="mt-8 font-sans text-sm text-ph-danger">
          {getQueryErrorMessage(logsQuery.error)}
        </p>
      )}
      {logsQuery.data && (
        <>
          {logsQuery.data.demoMode ? (
            <p className="mt-4 rounded-md border border-ph-warning/40 bg-ph-warning/10 px-3 py-2 font-sans text-[11px] text-ph-warning">
              Demo telemetry — enable live Call Guard when carrier integration ships.
            </p>
          ) : null}
          {logsQuery.data.demoMode ? <CallGuardLiveDemo /> : null}
          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-ph-border md:grid-cols-4">
            {[
              { label: "Screened", value: logsQuery.data.totalScreened },
              { label: "Blocked", value: logsQuery.data.scamsBlocked },
              { label: "SEE handoffs", value: logsQuery.data.scamsEngaged },
              { label: "Avg confidence", value: `${logsQuery.data.avgScamConfidence}%` },
            ].map((cell) => (
              <div key={cell.label} className="bg-ph-surface px-4 py-5">
                <div className="font-mono text-[10px] uppercase tracking-wide text-ph-text-muted">
                  {cell.label}
                </div>
                <div className="mt-1 text-2xl font-light text-ph-text-primary">
                  {cell.value}
                </div>
              </div>
            ))}
          </div>
          <ul className="mt-6 divide-y divide-ph-borderSubtle rounded-xl border border-ph-border bg-ph-surface">
            {logsQuery.data.recentLogs.map((log) => (
              <li key={log.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-sans text-sm font-medium text-ph-text-primary">
                    {log.callerLabel}
                  </span>
                  <span className="font-mono text-[10px] text-ph-text-muted">
                    {log.scamConfidence}% scam · {log.decision}
                  </span>
                </div>
                {log.transcriptPreview ? (
                  <p className="mt-2 font-sans text-xs italic text-ph-text-tertiary">
                    &ldquo;{log.transcriptPreview}&rdquo;
                  </p>
                ) : null}
                <div className="mt-1 font-mono text-[10px] text-ph-text-ghost">
                  {Math.floor(log.durationSec / 60)}m {log.durationSec % 60}s
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
