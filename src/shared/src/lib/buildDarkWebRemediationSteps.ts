import type { DarkWebFindingPublic } from "../types/darkWebFinding.js";
import type { DarkWebRemediationStep } from "../types/darkWebRemediation.js";

/** Personalized remediation steps per finding — metadata only, no PII. */
export function buildDarkWebRemediationSteps(
  finding: Pick<
    DarkWebFindingPublic,
    "id" | "severity" | "identifierType" | "breachName" | "title"
  >
): readonly DarkWebRemediationStep[] {
  const steps: DarkWebRemediationStep[] = [];
  const breach = finding.breachName ?? finding.title;
  const isPassword =
    finding.identifierType.toLowerCase().includes("password") ||
    finding.identifierType.toLowerCase().includes("credential");

  if (isPassword || finding.severity === "critical" || finding.severity === "high") {
    steps.push({
      id: "rotate_vault",
      title: "Rotate affected vault passwords",
      description: `Run a vault breach check and rotate credentials linked to ${breach}.`,
      priority: 1,
      href: "/vault",
    });
  }

  if (
    finding.identifierType.toLowerCase().includes("email") ||
    finding.identifierType.toLowerCase().includes("phone")
  ) {
    steps.push({
      id: "review_aliases",
      title: "Review alias forwarding",
      description:
        "Check inbox volume on aliases that share this identifier — rotate if phishing spikes.",
      priority: 2,
      href: "/aliases",
    });
  }

  steps.push({
    id: "enable_autopilot",
    title: "Enable breach autopilot playbook",
    description:
      "Turn on auto-rotate in Settings so critical findings trigger remediation logs automatically.",
    priority: 3,
    href: "/settings",
  });

  if (finding.severity === "critical") {
    steps.push({
      id: "dark_web_monitor",
      title: "Re-check exposures in 7 days",
      description: "Schedule a follow-up HIBP refresh to confirm the breach is contained.",
      priority: 4,
      href: "/dark-web",
    });
  }

  return steps.sort((a, b) => a.priority - b.priority);
}
