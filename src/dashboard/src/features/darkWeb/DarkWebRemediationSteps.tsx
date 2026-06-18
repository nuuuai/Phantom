import type { DarkWebFindingPublic } from "@phantom/shared";
import { buildDarkWebRemediationSteps } from "@phantom/shared";
import { Link } from "react-router-dom";
import { LAYER_STYLES } from "@/lib/layerColors.js";

interface DarkWebRemediationStepsProps {
  finding: Pick<
    DarkWebFindingPublic,
    "id" | "severity" | "identifierType" | "breachName" | "title"
  >;
}

export function DarkWebRemediationSteps({ finding }: DarkWebRemediationStepsProps) {
  const steps = buildDarkWebRemediationSteps(finding);
  if (steps.length === 0) return null;

  const autopilot = LAYER_STYLES.autopilot;

  return (
    <div className="mt-3 rounded-md border border-ph-border-subtle bg-ph-raised/30 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded border px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-wider"
          style={{
            color: autopilot.text,
            backgroundColor: autopilot.bg,
            borderColor: autopilot.border,
          }}
        >
          Autopilot
        </span>
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-ph-text-muted">
          Remediation steps
        </span>
      </div>
      <ol className="mt-2 space-y-1.5">
        {steps.map((step) => (
          <li key={step.id} className="font-sans text-[11px] text-ph-text-tertiary">
            <span className="font-medium text-ph-text-secondary">
              {step.priority}. {step.title}
            </span>
            {" — "}
            {step.description}
            {step.href ? (
              <>
                {" "}
                <Link to={step.href} className="text-ph-accent-light hover:underline">
                  Open
                </Link>
              </>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
