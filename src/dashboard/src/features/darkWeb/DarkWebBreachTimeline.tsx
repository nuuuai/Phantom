import { buildBreachTimeline } from "@phantom/shared";
import type { DarkWebFindingPublic } from "@phantom/shared";
import { formatRelativeTime } from "@/lib/formatRelative.js";

interface DarkWebBreachTimelineProps {
  finding: Pick<DarkWebFindingPublic, "id" | "detectedAt" | "severity">;
}

export function DarkWebBreachTimeline({ finding }: DarkWebBreachTimelineProps) {
  const point = buildBreachTimeline(finding);

  return (
    <div className="mt-3 rounded-md border border-ph-border-subtle bg-ph-raised/30 px-3 py-2">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-wide text-ph-text-muted">
        Exposure timeline · Brain
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-[11px] text-ph-text-tertiary">
        <span>
          Est. exposed{" "}
          <span className="font-mono text-ph-text-secondary">
            {formatRelativeTime(point.estimatedExposedAt)}
          </span>
        </span>
        <span>
          Detected{" "}
          <span className="font-mono text-ph-text-secondary">
            {formatRelativeTime(point.detectedAt)}
          </span>
        </span>
        <span className="font-mono text-ph-text-muted">
          ~{point.lagDays}d lag
        </span>
      </div>
    </div>
  );
}
