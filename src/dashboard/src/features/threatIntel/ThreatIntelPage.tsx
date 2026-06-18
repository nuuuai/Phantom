import { clientErrorFromApiFailure, getQueryErrorMessage } from "@phantom/shared";
import { useQuery } from "@tanstack/react-query";
import { SessionGateMessage } from "@/components/SessionGateMessage.js";
import { LAYER_STYLES } from "@/lib/layerColors.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { queryKeys } from "@/lib/queryKeys.js";
import { STALE } from "@/lib/queryStaleTimes.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

function severityClass(sev: string): string {
  if (sev === "critical") return "text-ph-danger border-ph-danger/40 bg-ph-danger/10";
  if (sev === "high") return "text-ph-warning border-ph-warning/40 bg-ph-warning/10";
  if (sev === "medium") return "text-ph-info border-ph-info/30 bg-ph-info/10";
  return "text-ph-success border-ph-success/30 bg-ph-success/10";
}

export function ThreatIntelPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const brain = LAYER_STYLES.brain;

  const patternsQuery = useQuery({
    queryKey: queryKeys.threatIntelPatterns(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.threatIntel.patterns(accessToken!, { signal });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data.patterns;
    },
    enabled: accessToken !== null,
    staleTime: STALE.threatIntel,
  });

  if (!accessToken) return <SessionGateMessage />;

  return (
    <div className="px-4 py-6 sm:px-8">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span
          className="rounded border px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: brain.text, backgroundColor: brain.bg, borderColor: brain.border }}
        >
          Brain
        </span>
        <h1 className="font-sans text-lg font-semibold text-ph-text-primary">
          Threat intelligence
        </h1>
      </div>
      <p className="mt-1 max-w-2xl font-sans text-sm text-ph-text-tertiary">
        Anonymized cross-user scam patterns. No PII — fingerprints only. When a
        campaign hits 50+ users, all Phantom users get pre-protection alerts.
      </p>

      {patternsQuery.isPending && (
        <p className="mt-8 font-sans text-sm text-ph-text-tertiary">Loading…</p>
      )}
      {patternsQuery.isError && (
        <p className="mt-8 font-sans text-sm text-ph-danger">
          {getQueryErrorMessage(patternsQuery.error)}
        </p>
      )}
      {patternsQuery.data && (
        <ul className="mt-6 space-y-3">
          {patternsQuery.data.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-ph-border bg-ph-surface px-5 py-4"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded border px-1.5 py-px font-mono text-[10px] font-semibold uppercase ${severityClass(p.severity)}`}
                >
                  {p.severity}
                </span>
                <span className="font-mono text-[10px] text-ph-text-ghost">
                  {p.anonymizedFingerprint}
                </span>
              </div>
              <p className="font-sans text-sm text-ph-text-primary">{p.summary}</p>
              <p className="mt-1 font-mono text-[10px] text-ph-text-muted">
                Observed {new Date(p.observedAt).toLocaleDateString()} · expires{" "}
                {new Date(p.expiresAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
