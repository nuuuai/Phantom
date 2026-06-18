import type { ThreatPattern } from "../types/threatPattern.js";
import { listThreatIntelPatterns } from "./threatIntelCatalog.js";

const HOST_RULES: ReadonlyArray<{
  pattern: RegExp;
  threatId: string;
}> = [
  { pattern: /amazon|amzn/, threatId: "tp-amazon-charge" },
  { pattern: /microsoft|office365|live\.com|windows/, threatId: "tp-ms-support-rdp" },
  { pattern: /login|signin|account|secure|verify|wallet|bank/, threatId: "tp-irs-giftcard-v3" },
  { pattern: /crypto|coin|trade|invest/, threatId: "tp-crypto-investment" },
];

/** Maps current site context to anonymized threat intel patterns (Brain). */
export function matchSiteThreatPatterns(
  hostname: string,
  patterns: readonly ThreatPattern[] = listThreatIntelPatterns()
): ThreatPattern | null {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  if (!host) return null;

  for (const rule of HOST_RULES) {
    if (!rule.pattern.test(host)) continue;
    const hit = patterns.find((p) => p.id === rule.threatId);
    if (hit) return hit;
  }

  return null;
}
