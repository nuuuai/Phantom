import type { ExposureReport, ExposureSeverity } from "../types/exposureReport.js";
import type { DashboardIntelligenceContext } from "./buildDashboardIntelligence.js";

function severityFromScore(score: number): ExposureSeverity {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "low";
}

function overallSeverity(ctx: DashboardIntelligenceContext): ExposureSeverity {
  return severityFromScore(ctx.riskScore);
}

export interface ExposureReportInput extends DashboardIntelligenceContext {
  userId: string;
}

/**
 * Builds a narrative exposure report from dashboard intelligence context.
 * Phase 1 heuristic — no LLM; structured sections for reports UI.
 */
export function buildExposureReport(input: ExposureReportInput): ExposureReport {
  const generatedAt = new Date().toISOString();
  const periodLabel = "Last 30 days";
  const severity = overallSeverity(input);

  const sections: ExposureReport["sections"] = [
    {
      id: "brokers",
      title: "Data broker exposure",
      summary: input.hasBrokerScan
        ? `${input.brokersFound} listing(s) found · ${input.brokersRemoved} removed · ${input.brokersPending} pending`
        : "No broker scan completed yet — run a scan to establish baseline exposure.",
      severity: severityFromScore(
        input.brokersFound > 0
          ? ((input.brokersFound - input.brokersRemoved) / input.brokersFound) * 100
          : input.hasBrokerScan
            ? 15
            : 45
      ),
      actionItems: input.brokersPending > 0
        ? ["Confirm pending broker removals", "Schedule re-scan in 14 days"]
        : input.hasBrokerScan
          ? ["Maintain quarterly broker scans"]
          : ["Run your first broker scan"],
    },
    {
      id: "aliases",
      title: "Alias health",
      summary: `${input.activeAliases} active alias(es) · ${input.aliasesCompromised} critical · ${input.aliasesWarning} warning`,
      severity: severityFromScore(
        input.activeAliases === 0
          ? 50
          : ((input.aliasesWarning + input.aliasesCompromised * 2) /
              Math.max(1, input.activeAliases)) *
              50
      ),
      actionItems:
        input.aliasesCompromised > 0
          ? ["Rotate compromised aliases immediately", "Review inbox for phishing"]
          : input.aliasesWarning > 0
            ? ["Monitor warning aliases for spam spikes"]
            : ["Continue category-based alias hygiene"],
    },
    {
      id: "dark_web",
      title: "Dark web & breaches",
      summary:
        input.darkWebAlerts > 0
          ? `${input.darkWebAlerts} open high-severity exposure(s) require review`
          : input.isPaidTier
            ? "No open critical breach alerts on record"
            : "Upgrade to Pro for continuous breach monitoring",
      severity: severityFromScore(Math.min(100, input.darkWebAlerts * 25)),
      actionItems:
        input.darkWebAlerts > 0
          ? ["Rotate affected aliases", "Audit vault for password reuse"]
          : ["Enable breach monitoring on Pro tier"],
    },
    {
      id: "inbox",
      title: "Inbox & email threats",
      summary:
        input.unreadInbox > 0
          ? `${input.unreadInbox} unread message(s) — review for phishing before forwarding`
          : "Inbox clear — no unread alias mail",
      severity: severityFromScore(Math.min(60, input.unreadInbox * 8)),
      actionItems:
        input.unreadInbox > 5
          ? ["Triage unread inbox", "Quarantine suspicious senders"]
          : ["Keep inbox monitoring enabled"],
    },
    {
      id: "autopilot",
      title: "Autopilot readiness",
      summary: input.isPaidTier
        ? "Autopilot actions available on Pro — configure auto-rotate and quarantine in settings"
        : "Autopilot requires Pro tier for autonomous remediation",
      severity: "low",
      actionItems: ["Review autopilot preferences in settings"],
    },
  ];

  const narrativeParts = [
    `Your privacy posture score is ${input.riskScore}/100 (${severity} overall).`,
    input.brokersFound > 0
      ? `Broker exposure: ${input.brokersFound - input.brokersRemoved} listing(s) still active.`
      : input.hasBrokerScan
        ? "Broker scan shows no active listings."
        : "Complete a broker scan to quantify data-broker exposure.",
    input.aliasesCompromised > 0
      ? `${input.aliasesCompromised} alias(es) need immediate rotation.`
      : "Alias health is stable — continue monitoring inbox velocity.",
  ];

  return {
    id: `report-${input.userId.slice(0, 8)}-${generatedAt.slice(0, 10)}`,
    generatedAt,
    periodLabel,
    overallSeverity: severity,
    narrative: narrativeParts.join(" "),
    sections,
  };
}
