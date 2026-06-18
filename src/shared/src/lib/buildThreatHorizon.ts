import type { InboxVolumeSpikeSignal } from "../types/dashboardIntelligence.js";
import type { ThreatHorizonItem } from "../types/threatHorizon.js";

export interface ThreatHorizonInput {
  brokersRelisted: number;
  brokersFound: number;
  darkWebAlerts: number;
  hasBrokerScan: boolean;
  isPaidTier: boolean;
  daysSinceBrokerScan: number | null;
  topRelistedBrokerName: string | null;
  inboxVolumeSpike: InboxVolumeSpikeSignal | null;
  aliasesCompromised: number;
  aliasesWarning: number;
}

/** Predictive Brain signals — re-listing risk, scan cadence, quota pressure. */
export function buildThreatHorizon(
  input: ThreatHorizonInput
): readonly ThreatHorizonItem[] {
  const items: ThreatHorizonItem[] = [];

  if (input.brokersRelisted > 0) {
    items.push({
      id: "broker_relisted",
      label: "Broker re-listing risk",
      description: input.topRelistedBrokerName
        ? `${input.topRelistedBrokerName} re-published your profile — schedule a re-scan within 14 days.`
        : `${input.brokersRelisted} broker re-listing(s) detected — exposure may return without monitoring.`,
      severity: input.brokersRelisted >= 2 ? "high" : "medium",
      href: "/brokers?tab=relisted",
    });
  }

  if (!input.hasBrokerScan) {
    items.push({
      id: "no_baseline_scan",
      label: "No broker baseline",
      description:
        "Run your first exposure scan to establish a removal baseline and Brain risk factors.",
      severity: "medium",
      href: "/brokers",
    });
  } else if (
    input.daysSinceBrokerScan !== null &&
    input.daysSinceBrokerScan >= 14
  ) {
    items.push({
      id: "stale_broker_scan",
      label: "Scan cadence overdue",
      description: `Last broker scan was ${input.daysSinceBrokerScan} days ago — re-scan to catch new listings.`,
      severity: input.daysSinceBrokerScan >= 28 ? "high" : "medium",
      href: "/brokers",
    });
  }

  if (input.darkWebAlerts > 0) {
    items.push({
      id: "dark_web_open",
      label: "Open breach exposures",
      description: `${input.darkWebAlerts} monitored breach finding(s) need review — rotate linked credentials.`,
      severity: input.darkWebAlerts >= 3 ? "high" : "medium",
      href: "/dark-web",
    });
  }

  if (input.inboxVolumeSpike) {
    const s = input.inboxVolumeSpike;
    items.push({
      id: "inbox_volume_spike",
      label: "Inbox volume anomaly",
      description: `${s.serviceLabel} alias received ${s.multiplier}× its prior-week volume — review for spam or compromise.`,
      severity: s.multiplier >= 4 ? "high" : "medium",
      href: "/inbox",
    });
  }

  if (input.aliasesCompromised > 0 || input.aliasesWarning > 0) {
    items.push({
      id: "alias_hygiene",
      label: "Alias hygiene pressure",
      description: `${input.aliasesCompromised + input.aliasesWarning} alias(es) in warning or compromised state — rotation recommended.`,
      severity: input.aliasesCompromised > 0 ? "high" : "medium",
      href: "/aliases",
    });
  }

  if (!input.isPaidTier && input.brokersFound >= 3) {
    items.push({
      id: "free_tier_cap",
      label: "Free tier scan limits",
      description:
        "Multiple broker exposures found — Pro unlocks unlimited scans and automated removal queue.",
      severity: "low",
      href: "/billing",
    });
  }

  return items
    .sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 };
      return rank[a.severity] - rank[b.severity];
    })
    .slice(0, 4);
}
