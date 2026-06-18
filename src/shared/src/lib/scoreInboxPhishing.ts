export type InboxPhishingLevel = "low" | "moderate" | "high";

export interface InboxPhishingScore {
  score: number;
  level: InboxPhishingLevel;
  signals: readonly string[];
}

const PHISHING_SUBJECT = [
  /urgent/i,
  /verify your account/i,
  /suspend/i,
  /password reset/i,
  /confirm your identity/i,
  /wire transfer/i,
  /invoice attached/i,
  /security alert/i,
];

const PHISHING_FROM = [
  /noreply@.*(?!phantom)/i,
  /support@.*bank/i,
  /paypal/i,
  /amazon-security/i,
  /microsoft.*account/i,
];

const PHISHING_SNIPPET = [
  /click (here|below|the link)/i,
  /verify (your|account|identity)/i,
  /within 24 hours/i,
  /unusual (activity|sign-in)/i,
  /confirm (payment|billing)/i,
  /ssn|social security/i,
  /gift card/i,
];

/**
 * Heuristic phishing score for alias inbox messages (Phase 1 Brain).
 * No ML — rule-based signals only; never logs message content.
 */
export function scoreInboxPhishing(input: {
  subject: string;
  fromAddress: string;
  snippet: string;
}): InboxPhishingScore {
  const signals: string[] = [];
  let score = 0;

  for (const re of PHISHING_SUBJECT) {
    if (re.test(input.subject)) {
      signals.push("Suspicious subject pattern");
      score += 22;
      break;
    }
  }

  for (const re of PHISHING_FROM) {
    if (re.test(input.fromAddress)) {
      signals.push("Sender resembles brand impersonation");
      score += 18;
      break;
    }
  }

  let snippetHits = 0;
  for (const re of PHISHING_SNIPPET) {
    if (re.test(input.snippet)) {
      snippetHits += 1;
    }
  }
  if (snippetHits >= 2) {
    signals.push("Multiple urgency / credential phrases in body");
    score += 35;
  } else if (snippetHits === 1) {
    signals.push("Urgency or credential phrase in body");
    score += 18;
  }

  if (/http:\/\//i.test(input.snippet)) {
    signals.push("Insecure HTTP link in message");
    score += 12;
  }

  const clamped = Math.min(100, Math.max(0, score));
  const level: InboxPhishingLevel =
    clamped >= 55 ? "high" : clamped >= 28 ? "moderate" : "low";

  return { score: clamped, level, signals };
}
