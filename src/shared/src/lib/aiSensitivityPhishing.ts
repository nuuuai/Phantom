import {
  scoreInboxPhishing,
  type InboxPhishingLevel,
  type InboxPhishingScore,
} from "./scoreInboxPhishing.js";

/** Maps AI sensitivity (0 conservative → 100 aggressive) to inbox quarantine threshold. */
export function resolvePhishingQuarantineThreshold(aiSensitivity: number): number {
  const clamped = Math.min(100, Math.max(0, aiSensitivity));
  return Math.round(85 - (clamped / 100) * 30);
}

/** Adjusts phishing score based on Brain sensitivity setting. */
export function adjustPhishingScoreForSensitivity(
  score: number,
  aiSensitivity: number
): number {
  const clamped = Math.min(100, Math.max(0, aiSensitivity));
  const boost = Math.round((clamped - 50) * 0.2);
  return Math.min(100, Math.max(0, score + boost));
}

function levelFromScore(score: number): InboxPhishingLevel {
  return score >= 55 ? "high" : score >= 28 ? "moderate" : "low";
}

export function scoreInboxPhishingWithSensitivity(
  input: {
    subject: string;
    fromAddress: string;
    snippet: string;
  },
  aiSensitivity: number
): InboxPhishingScore {
  const base = scoreInboxPhishing(input);
  const adjusted = adjustPhishingScoreForSensitivity(base.score, aiSensitivity);
  return { score: adjusted, level: levelFromScore(adjusted), signals: base.signals };
}
