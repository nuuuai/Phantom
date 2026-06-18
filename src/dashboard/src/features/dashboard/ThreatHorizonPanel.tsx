import type { ThreatHorizonItem } from "@phantom/shared";
import { Link } from "react-router-dom";
import { LAYER_STYLES } from "@/lib/layerColors.js";

function severityColor(severity: ThreatHorizonItem["severity"]): string {
  if (severity === "high") return "var(--danger)";
  if (severity === "medium") return "var(--warning)";
  return "var(--info)";
}

interface ThreatHorizonPanelProps {
  items: readonly ThreatHorizonItem[];
}

export function ThreatHorizonPanel({ items }: ThreatHorizonPanelProps) {
  if (items.length === 0) return null;

  const brain = LAYER_STYLES.brain;

  return (
    <section className="overflow-hidden rounded-xl border border-ph-border bg-ph-surface">
      <div className="border-b border-ph-border-subtle px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded border px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-wider"
            style={{ color: brain.text, backgroundColor: brain.bg, borderColor: brain.border }}
          >
            Brain
          </span>
          <h2 className="font-sans text-sm font-semibold text-ph-text-primary">
            Threat horizon
          </h2>
        </div>
        <p className="mt-1 font-sans text-xs text-ph-text-tertiary">
          Predictive signals — re-listing risk, scan cadence, and quota pressure.
        </p>
      </div>
      <ul className="divide-y divide-ph-border-subtle">
        {items.map((item) => (
          <li key={item.id} className="px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="font-mono text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: severityColor(item.severity) }}
                  >
                    {item.severity}
                  </span>
                  <span className="font-sans text-sm font-medium text-ph-text-primary">
                    {item.label}
                  </span>
                </div>
                <p className="mt-1 font-sans text-xs text-ph-text-tertiary">
                  {item.description}
                </p>
              </div>
              {item.href ? (
                <Link
                  to={item.href}
                  className="shrink-0 font-sans text-[11px] text-ph-accent-light hover:underline"
                >
                  Review
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
