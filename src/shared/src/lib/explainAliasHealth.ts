import type { HealthStatus } from "../types/alias.js";

export interface AliasHealthExplanation {
  headline: string;
  summary: string;
  recommendations: readonly string[];
}

const EXPLANATIONS: Record<HealthStatus, AliasHealthExplanation> = {
  healthy: {
    headline: "Healthy",
    summary:
      "No significant spam signals, breach cross-references, or compromise indicators for this alias.",
    recommendations: [
      "Continue using this alias for its assigned service category.",
      "Enable inbox monitoring when inbound mail is configured.",
    ],
  },
  warning: {
    headline: "Warning",
    summary:
      "Minor risk signals detected — elevated spam, a minor breach match, or declining usage patterns.",
    recommendations: [
      "Review recent inbox messages for phishing or list-sale patterns.",
      "Consider rotating if spam volume increases over the next week.",
      "Check dark web findings for identifiers tied to this alias.",
    ],
  },
  compromised: {
    headline: "Compromised",
    summary:
      "Significant exposure detected — major breach match, heavy spam, or confirmed abuse of this alias.",
    recommendations: [
      "Rotate this alias immediately and update credentials on linked services.",
      "Quarantine forwarding until a replacement alias is active.",
      "Review vault entries tied to this service for password reuse.",
    ],
  },
  quarantined: {
    headline: "Quarantined",
    summary:
      "Forwarding is disabled. This alias is isolated pending rotation or manual review.",
    recommendations: [
      "Generate a replacement alias for any services still using this address.",
      "Deactivate or archive after migrating accounts.",
    ],
  },
};

export function explainAliasHealth(status: HealthStatus): AliasHealthExplanation {
  return EXPLANATIONS[status];
}
