import { Link } from "react-router-dom";
import type { ThreatPattern } from "@phantom/shared";
import { LAYER_STYLES } from "@/lib/layerColors.js";
import { formatRelativeTime } from "@/lib/formatRelative.js";
import { DASHBOARD_PATHS } from "@/lib/dashboardRoutes.js";

interface ThreatIntelPreviewPanelProps {
  patterns: readonly ThreatPattern[];
}

function severityClass(severity: ThreatPattern["severity"]): string {
  if (severity === "critical") return "text-ph-danger border-ph-danger/40";
  if (severity === "high") return "text-ph-warning border-ph-warning/40";
  if (severity === "medium") return "text-ph-accent-light border-ph-accent-border";
  return "text-ph-text-tertiary border-ph-border";
}

export function ThreatIntelPreviewPanel({ patterns }: ThreatIntelPreviewPanelProps) {
  if (patterns.length === 0) return null;

  const brain = LAYER_STYLES.brain;
  const top = [...patterns]
    .sort((a, b) => {
      const rank = { critical: 4, high: 3, medium: 2, low: 1 };
      return rank[b.severity] - rank[a.severity];
    })
    .slice(0, 3);

  return (
    <section className="rounded-xl border border-ph-border bg-ph-surface p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded border px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-wider"
            style={{
              color: brain.text,
              backgroundColor: brain.bg,
              borderColor: brain.border,
            }}
          >
            Brain
          </span>
          <h2 className="font-sans text-sm font-semibold text-ph-text-primary">
            Threat horizon
          </h2>
        </div>
        <Link
          to={DASHBOARD_PATHS.threatIntel}
          className="font-sans text-[11px] text-ph-accent-light hover:underline"
        >
          Full intel →
        </Link>
      </div>
      <p className="mb-4 font-sans text-xs text-ph-text-tertiary">
        Anonymized cross-user patterns — no PII. Replaces demo Sword metrics until
        Call Guard ships live.
      </p>
      <ul className="space-y-3">
        {top.map((p) => (
          <li
            key={p.id}
            className="rounded-lg border border-ph-border-subtle bg-ph-raised/20 px-4 py-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase ${severityClass(p.severity)}`}
              >
                {p.severity}
              </span>
              <span className="font-mono text-[10px] text-ph-text-ghost">
                {formatRelativeTime(p.observedAt)}
              </span>
            </div>
            <p className="mt-2 font-sans text-xs leading-relaxed text-ph-text-secondary">
              {p.summary}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
