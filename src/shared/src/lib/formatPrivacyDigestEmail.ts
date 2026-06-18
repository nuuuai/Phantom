import type { PrivacyDigest } from "../types/privacyDigest.js";

/** Plain-text email body for privacy digest (no HTML — safe for stub mailer). */
export function formatPrivacyDigestEmail(digest: PrivacyDigest): string {
  const lines = [
    "Phantom — Daily Privacy Digest",
    digest.periodLabel,
    "",
    digest.headline,
    "",
    ...digest.highlights.map((h) => `• ${h}`),
    "",
    "Recommended actions:",
    ...digest.topActions.map((a) => `→ ${a}`),
    "",
    "View full report: https://app.phantom.local/reports",
    "",
    `Generated ${digest.generatedAt}`,
  ];
  return lines.join("\n");
}
