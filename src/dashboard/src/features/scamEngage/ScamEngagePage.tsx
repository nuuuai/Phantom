import { clientErrorFromApiFailure, getQueryErrorMessage } from "@phantom/shared";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SessionGateMessage } from "@/components/SessionGateMessage.js";
import { LAYER_STYLES } from "@/lib/layerColors.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { queryKeys } from "@/lib/queryKeys.js";
import { STALE } from "@/lib/queryStaleTimes.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

export function ScamEngagePage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const sword = LAYER_STYLES.sword;

  const sessionsQuery = useQuery({
    queryKey: queryKeys.scamEngageSessions(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.scamEngage.sessions(accessToken!, { signal });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    enabled: accessToken !== null,
    staleTime: STALE.scamEngage,
  });

  if (!accessToken) return <SessionGateMessage />;

  const selected = sessionsQuery.data?.sessions.find((s) => s.id === selectedId);

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
          Scam Engagement Engine
        </h1>
      </div>
      <p className="mt-1 max-w-2xl font-sans text-sm text-ph-text-tertiary">
        AI personas waste scammers&apos; time and extract intelligence. Live PSTN
        engagement ships Phase 2 — sessions below are demo transcripts.
      </p>

      {sessionsQuery.isPending && (
        <p className="mt-8 font-sans text-sm text-ph-text-tertiary">Loading…</p>
      )}
      {sessionsQuery.data && (
        <>
          <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-ph-border">
            {[
              { label: "Sessions", value: sessionsQuery.data.totalSessions },
              { label: "Minutes wasted", value: sessionsQuery.data.totalMinutesWasted },
              { label: "Complaints filed", value: sessionsQuery.data.complaintsFiled },
            ].map((c) => (
              <div key={c.label} className="bg-ph-surface px-4 py-5">
                <div className="font-mono text-[10px] uppercase text-ph-text-muted">
                  {c.label}
                </div>
                <div className="mt-1 text-2xl font-light text-ph-danger">{c.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_1fr]">
            <ul className="divide-y divide-ph-borderSubtle rounded-xl border border-ph-border bg-ph-surface">
              {sessionsQuery.data.sessions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(s.id)}
                    className={`w-full px-5 py-4 text-left hover:bg-ph-raised/40 ${
                      selectedId === s.id ? "bg-ph-raised/60" : ""
                    }`}
                  >
                    <div className="font-sans text-sm font-medium text-ph-text-primary">
                      {s.personaLabel}
                    </div>
                    <div className="font-sans text-xs text-ph-text-tertiary">
                      {s.scamType} · {Math.round(s.durationSec / 60)} min · score{" "}
                      {s.engagementScore}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            <div className="rounded-xl border border-ph-border bg-ph-surface p-5">
              {selected ? (
                <>
                  <h2 className="font-mono text-xs uppercase text-ph-text-tertiary">
                    Transcript
                  </h2>
                  <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto">
                    {selected.transcript.map((line, i) => (
                      <li
                        key={`${line.timestampOffsetSec}-${i}`}
                        className={`rounded px-3 py-2 font-sans text-xs ${
                          line.speaker === "phantom"
                            ? "bg-ph-accent/[0.08] text-ph-text-secondary"
                            : "bg-ph-raised text-ph-text-tertiary"
                        }`}
                      >
                        <span className="font-mono text-[10px] uppercase text-ph-text-muted">
                          {line.speaker}
                        </span>
                        <p className="mt-0.5">{line.text}</p>
                      </li>
                    ))}
                  </ul>
                  {selected.intelExtracted.length > 0 && (
                    <div className="mt-4 border-t border-ph-borderSubtle pt-4">
                      <h3 className="font-mono text-[10px] uppercase text-ph-text-muted">
                        Intel extracted
                      </h3>
                      <ul className="mt-2 space-y-1">
                        {selected.intelExtracted.map((item) => (
                          <li key={item} className="font-sans text-xs text-ph-text-secondary">
                            · {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="font-sans text-sm text-ph-text-muted">
                  Select a session to view the transcript.
                </p>
              )}
            </div>
          </div>
        </>
      )}
      {sessionsQuery.isError && (
        <p className="mt-8 font-sans text-sm text-ph-danger">
          {getQueryErrorMessage(sessionsQuery.error)}
        </p>
      )}
    </div>
  );
}
