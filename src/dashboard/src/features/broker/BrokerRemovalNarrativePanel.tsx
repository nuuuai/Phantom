import type { BrokerRemovalNarrative } from "@phantom/shared";
import { LAYER_STYLES } from "@/lib/layerColors.js";

interface BrokerRemovalNarrativePanelProps {
  narrative: BrokerRemovalNarrative;
}

export function BrokerRemovalNarrativePanel({
  narrative,
}: BrokerRemovalNarrativePanelProps) {
  const brain = LAYER_STYLES.brain;

  return (
    <section className="mt-6 rounded-xl border border-ph-border bg-ph-surface p-5">
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
          30-day removal plan
        </h2>
      </div>
      <p className="mt-2 font-sans text-sm font-medium text-ph-text-secondary">
        {narrative.headline}
      </p>
      <p className="mt-1 max-w-3xl font-sans text-xs leading-relaxed text-ph-text-tertiary">
        {narrative.summary}
      </p>

      <ol className="mt-5 space-y-4">
        {narrative.phases.map((phase) => (
          <li
            key={phase.weekLabel}
            className="rounded-lg border border-ph-border-subtle bg-ph-raised/20 px-4 py-3"
          >
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ph-text-muted">
              {phase.weekLabel}
            </div>
            <p className="mt-1 font-sans text-xs text-ph-text-secondary">
              {phase.action}
            </p>
            <p className="mt-2 font-mono text-[11px] text-ph-text-tertiary">
              {phase.brokerNames.join(" · ")}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
