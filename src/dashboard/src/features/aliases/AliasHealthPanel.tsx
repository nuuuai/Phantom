import { explainAliasHealth, type HealthStatus } from "@phantom/shared";
import { LAYER_STYLES } from "@/lib/layerColors.js";

interface AliasHealthPanelProps {
  status: HealthStatus;
}

export function AliasHealthPanel({ status }: AliasHealthPanelProps) {
  const explanation = explainAliasHealth(status);
  const brain = LAYER_STYLES.brain;

  return (
    <section
      className="mt-4 rounded-lg border border-ph-border bg-ph-raised/30 p-4"
      aria-label="Alias health intelligence"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
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
        <h3 className="font-sans text-sm font-medium text-ph-text-primary">
          Why {explanation.headline.toLowerCase()}?
        </h3>
      </div>
      <p className="font-sans text-xs leading-relaxed text-ph-text-tertiary">
        {explanation.summary}
      </p>
      <ul className="mt-3 space-y-1.5">
        {explanation.recommendations.map((rec) => (
          <li
            key={rec}
            className="flex gap-2 font-sans text-xs text-ph-text-secondary"
          >
            <span className="text-ph-accent-light" aria-hidden>
              →
            </span>
            {rec}
          </li>
        ))}
      </ul>
    </section>
  );
}
