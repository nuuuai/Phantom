import type { BrokerScanResult } from "../types/brokerScan.js";
import { computeBrokerExposureSeverity } from "./computeBrokerExposureSeverity.js";
import { exposureSeverityBand } from "./exposureSeverityBand.js";

export interface BrokerRemovalPhase {
  weekLabel: string;
  brokerNames: readonly string[];
  action: string;
}

export interface BrokerRemovalNarrative {
  headline: string;
  summary: string;
  phases: readonly BrokerRemovalPhase[];
  totalExposures: number;
  criticalCount: number;
}

function isActiveExposure(row: BrokerScanResult): boolean {
  return row.status !== "not_found" && row.dataTypesFound.length > 0;
}

function severityFor(row: BrokerScanResult): number {
  if (!isActiveExposure(row)) return 0;
  return row.exposureSeverity ?? computeBrokerExposureSeverity(row.dataTypesFound);
}

/** Prioritized 30-day removal plan from scan results (Brain narrative). */
export function buildBrokerRemovalNarrative(
  items: readonly BrokerScanResult[]
): BrokerRemovalNarrative | null {
  const exposures = items
    .filter(isActiveExposure)
    .map((row) => ({ row, severity: severityFor(row) }))
    .sort((a, b) => b.severity - a.severity);

  if (exposures.length === 0) return null;

  const criticalCount = exposures.filter(
    (e) => exposureSeverityBand(e.severity) === "critical"
  ).length;

  const week1 = exposures.slice(0, 5);
  const week2 = exposures.slice(5, 15);
  const week3Plus = exposures.slice(15);

  const phases: BrokerRemovalPhase[] = [];

  if (week1.length > 0) {
    phases.push({
      weekLabel: "Week 1",
      brokerNames: week1.map((e) => e.row.broker.name),
      action:
        criticalCount > 0
          ? "Submit opt-outs for highest-severity listings (address, phone, relatives)."
          : "Start with the most data-rich broker listings.",
    });
  }

  if (week2.length > 0) {
    phases.push({
      weekLabel: "Week 2",
      brokerNames: week2.map((e) => e.row.broker.name),
      action: "Queue remaining people-search and aggregator removals.",
    });
  }

  if (week3Plus.length > 0) {
    phases.push({
      weekLabel: "Weeks 3–4",
      brokerNames: week3Plus.slice(0, 8).map((e) => e.row.broker.name),
      action: `Finish DIY opt-outs and schedule a re-scan in 14 days${week3Plus.length > 8 ? ` (+${String(week3Plus.length - 8)} more)` : ""}.`,
    });
  }

  const headline =
    criticalCount > 0
      ? `${String(criticalCount)} critical exposure(s) — start removals this week`
      : `${String(exposures.length)} broker listing(s) need a removal plan`;

  const summary = `Phantom ranked ${String(exposures.length)} active listing(s) by data sensitivity. Tackle high-severity brokers first — listings with address, phone, or relatives data carry the most re-identification risk.`;

  return {
    headline,
    summary,
    phases,
    totalExposures: exposures.length,
    criticalCount,
  };
}
