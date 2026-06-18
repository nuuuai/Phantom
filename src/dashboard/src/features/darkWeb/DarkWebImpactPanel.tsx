import { Link } from "react-router-dom";
import type { DarkWebImpactAnalysis } from "@phantom/shared";
import { LAYER_STYLES } from "@/lib/layerColors.js";

interface DarkWebImpactPanelProps {
  items: readonly DarkWebImpactAnalysis[];
}

function impactBandClass(score: number): string {
  if (score >= 75) return "border-ph-danger/40 text-ph-danger";
  if (score >= 50) return "border-ph-warning/40 text-ph-warning";
  return "border-ph-accent-border text-ph-accent-light";
}

export function DarkWebImpactPanel({ items }: DarkWebImpactPanelProps) {
  if (items.length === 0) return null;

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
          Breach impact analysis
        </h2>
      </div>
      <p className="mt-2 font-sans text-xs text-ph-text-tertiary">
        Cross-links open findings to your account email, aliases, and vault posture —
        no plaintext credentials leave the server.
      </p>

      <ul className="mt-4 space-y-4">
        {items.slice(0, 5).map((item) => (
          <li
            key={item.findingId}
            className="rounded-lg border border-ph-border-subtle bg-ph-raised/20 p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${impactBandClass(item.impactScore)}`}
              >
                Impact {item.impactScore}/100
              </span>
              <span className="font-sans text-sm font-medium text-ph-text-primary">
                {item.headline}
              </span>
            </div>

            {item.links.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {item.links.map((link) => (
                  <li key={`${item.findingId}-${link.type}`}>
                    <div className="font-sans text-xs font-medium text-ph-text-secondary">
                      {link.label}
                    </div>
                    <p className="font-sans text-[11px] text-ph-text-tertiary">
                      {link.detail}
                      {link.href ? (
                        <>
                          {" "}
                          <Link
                            to={link.href}
                            className="text-ph-accent-light underline-offset-2 hover:underline"
                          >
                            Open →
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}

            <ul className="mt-3 space-y-1">
              {item.remediationSteps.slice(0, 3).map((step) => (
                <li
                  key={step}
                  className="font-sans text-[11px] text-ph-text-secondary"
                >
                  → {step}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
