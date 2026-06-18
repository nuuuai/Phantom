import type { ThreatPattern } from "../types/threatPattern.js";

const NOW = Date.now();
const DAY_MS = 86_400_000;

function daysFromNow(days: number): string {
  return new Date(NOW + days * DAY_MS).toISOString();
}

/** Anonymized cross-user threat patterns — no user ids or raw identifiers. */
export const THREAT_INTEL_CATALOG: readonly ThreatPattern[] = [
  {
    id: "tp-irs-giftcard-v3",
    summary:
      "IRS impersonation calls demanding gift-card payment within 2 hours — spike in area codes ending in 07.",
    severity: "high",
    observedAt: daysFromNow(-3),
    expiresAt: daysFromNow(87),
    anonymizedFingerprint: "voice:en-us-male-urgent;script:irs-giftcard-v3",
  },
  {
    id: "tp-medicare-partd",
    summary:
      "Medicare Part D renewal robocalls referencing fabricated member IDs; callback numbers rotate daily.",
    severity: "medium",
    observedAt: daysFromNow(-5),
    expiresAt: daysFromNow(85),
    anonymizedFingerprint: "robocall:medicare-partd;payment:wire",
  },
  {
    id: "tp-amazon-charge",
    summary:
      "Amazon order confirmation SMS with look-alike domains — credential harvest via fake account lock page.",
    severity: "high",
    observedAt: daysFromNow(-1),
    expiresAt: daysFromNow(89),
    anonymizedFingerprint: "sms:amazon-charge;phish:account-lock",
  },
  {
    id: "tp-ms-support-rdp",
    summary:
      "Microsoft tech-support scams pushing unsigned remote-desktop tools; targets users 55+ demographic.",
    severity: "critical",
    observedAt: daysFromNow(-7),
    expiresAt: daysFromNow(83),
    anonymizedFingerprint: "voice:tech-support;tool:rdp-generic",
  },
  {
    id: "tp-auto-warranty",
    summary:
      "Vehicle extended-warranty calls with spoofed local caller IDs; high engagement on weekday mornings.",
    severity: "medium",
    observedAt: daysFromNow(-2),
    expiresAt: daysFromNow(88),
    anonymizedFingerprint: "voice:auto-warranty;cid:neighbor-spoof",
  },
  {
    id: "tp-broker-relist-wave",
    summary:
      "Three major people-search brokers re-listed profiles within 72h of confirmed removal — coordinated refresh cycle.",
    severity: "medium",
    observedAt: daysFromNow(-4),
    expiresAt: daysFromNow(86),
    anonymizedFingerprint: "broker:relist-cluster;window:72h",
  },
  {
    id: "tp-shopping-alias-sale",
    summary:
      "Shopping alias spam velocity 3× baseline — possible list sale after major retailer breach window.",
    severity: "low",
    observedAt: daysFromNow(-6),
    expiresAt: daysFromNow(84),
    anonymizedFingerprint: "email:shopping-spike;breach:retail-window",
  },
  {
    id: "tp-crypto-investment",
    summary:
      "Social-engineering investment pitches via wrong-number texts leading to fake trading platforms.",
    severity: "high",
    observedAt: daysFromNow(-8),
    expiresAt: daysFromNow(82),
    anonymizedFingerprint: "sms:wrong-number;platform:crypto-fake",
  },
  {
    id: "tp-ssn-suspension",
    summary:
      "Automated calls claiming SSN suspension with DTMF menu to reach live agent — avg. 14 min engagement.",
    severity: "critical",
    observedAt: daysFromNow(-10),
    expiresAt: daysFromNow(80),
    anonymizedFingerprint: "voice:ssn-suspension;dtmf:live-agent",
  },
];

export function listThreatIntelPatterns(): readonly ThreatPattern[] {
  const now = Date.now();
  return THREAT_INTEL_CATALOG.filter(
    (p) => new Date(p.expiresAt).getTime() > now
  );
}
