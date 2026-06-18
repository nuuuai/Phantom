import type { AliasRotationCandidate } from "@phantom/shared";
import { clientErrorFromApiFailure, getQueryErrorMessage } from "@phantom/shared";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { LAYER_STYLES } from "@/lib/layerColors.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { queryKeys } from "@/lib/queryKeys.js";
import { STALE } from "@/lib/queryStaleTimes.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

function healthColor(score: number): string {
  if (score >= 70) return "var(--success)";
  if (score >= 45) return "var(--warning)";
  return "var(--danger)";
}

function CandidateRow({ candidate }: { candidate: AliasRotationCandidate }) {
  const autopilot = LAYER_STYLES.autopilot;
  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className="font-mono text-[10px] text-ph-text-muted">
            #{candidate.priorityRank}
          </span>{" "}
          <Link
            to={`/aliases/${candidate.aliasId}`}
            className="font-sans text-sm font-medium text-ph-accent-light hover:underline"
          >
            {candidate.label}
          </Link>
          <span className="ml-2 font-mono text-[10px] uppercase text-ph-text-ghost">
            {candidate.type} · {candidate.healthStatus}
          </span>
        </div>
        <span
          className="font-mono text-xs font-medium"
          style={{ color: healthColor(candidate.healthScore) }}
        >
          {candidate.healthScore}/100
        </span>
      </div>
      <p className="mt-1 font-sans text-xs text-ph-text-tertiary">{candidate.reason}</p>
      <span
        className="mt-2 inline-block rounded border px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-wider"
        style={{
          color: autopilot.text,
          backgroundColor: autopilot.bg,
          borderColor: autopilot.border,
        }}
      >
        Autopilot
      </span>
    </li>
  );
}

export function RotationCandidatesPanel() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const brain = LAYER_STYLES.brain;

  const query = useQuery({
    queryKey: queryKeys.rotationCandidates(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.intelligence.rotationCandidates(accessToken!, {
        signal,
      });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    enabled: accessToken !== null,
    staleTime: STALE.rotationCandidates,
  });

  if (!accessToken || query.isPending) return null;
  if (query.isError) {
    return (
      <p className="mt-4 font-sans text-xs text-ph-danger">
        {getQueryErrorMessage(query.error)}
      </p>
    );
  }

  const { candidates, totalEligible } = query.data;
  if (totalEligible === 0) return null;

  return (
    <section className="mt-6 rounded-xl border border-ph-border bg-ph-surface">
      <header className="border-b border-ph-borderSubtle px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded border px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: brain.text, backgroundColor: brain.bg, borderColor: brain.border }}
          >
            Brain
          </span>
          <h2 className="font-sans text-sm font-semibold text-ph-text-secondary">
            Rotation priority
          </h2>
        </div>
        <p className="mt-1 font-sans text-xs text-ph-text-tertiary">
          Health-ranked suggestions across {totalEligible} rotatable alias(es). Password
          vault entries rotate from Vault.
        </p>
      </header>
      {candidates.length === 0 ? (
        <p className="px-5 py-4 font-sans text-sm text-ph-text-tertiary">
          All rotatable aliases look healthy — no proactive rotation needed.
        </p>
      ) : (
        <ul className="divide-y divide-ph-borderSubtle">
          {candidates.map((c) => (
            <CandidateRow key={c.aliasId} candidate={c} />
          ))}
        </ul>
      )}
    </section>
  );
}
