import type { InboxMessageCategory } from "../types/inboxClassification.js";
import { scoreInboxPhishing } from "./scoreInboxPhishing.js";

export interface ClassifyInboxMessageInput {
  messageId: string;
  subject: string;
  fromAddress: string;
  snippet: string;
}

export interface ClassifyInboxMessageResult {
  messageId: string;
  category: InboxMessageCategory;
  phishingScore: number;
  confidence: number;
  signals: readonly string[];
}

const MARKETING_SUBJECT = [
  /sale|discount|%\s*off|limited time|exclusive offer/i,
  /newsletter|unsubscribe/i,
];

const TRANSACTIONAL_SUBJECT = [
  /order (confirmed|shipped|delivered)/i,
  /receipt|invoice|payment (received|confirmed)/i,
  /verification code|one-time pass/i,
  /password reset/i,
];

const SPAM_SUBJECT = [
  /winner|lottery|prize|claim now/i,
  /work from home|make \$/i,
  /crypto|bitcoin|investment opportunity/i,
];

/**
 * Classifies inbox mail beyond phishing — spam, marketing, transactional, phishing.
 */
export function classifyInboxMessage(
  input: ClassifyInboxMessageInput
): ClassifyInboxMessageResult {
  const phishing = scoreInboxPhishing({
    subject: input.subject,
    fromAddress: input.fromAddress,
    snippet: input.snippet,
  });

  const signals = [...phishing.signals];

  if (phishing.level === "high") {
    return {
      messageId: input.messageId,
      category: "phishing",
      phishingScore: phishing.score,
      confidence: Math.min(95, 60 + phishing.score / 3),
      signals,
    };
  }

  for (const re of TRANSACTIONAL_SUBJECT) {
    if (re.test(input.subject)) {
      signals.push("Transactional subject pattern");
      return {
        messageId: input.messageId,
        category: "transactional",
        phishingScore: phishing.score,
        confidence: 72,
        signals,
      };
    }
  }

  for (const re of SPAM_SUBJECT) {
    if (re.test(input.subject) || re.test(input.snippet)) {
      signals.push("Bulk spam pattern");
      return {
        messageId: input.messageId,
        category: "spam",
        phishingScore: phishing.score,
        confidence: 78,
        signals,
      };
    }
  }

  for (const re of MARKETING_SUBJECT) {
    if (re.test(input.subject) || /unsubscribe/i.test(input.snippet)) {
      signals.push("Marketing / newsletter pattern");
      return {
        messageId: input.messageId,
        category: "marketing",
        phishingScore: phishing.score,
        confidence: 68,
        signals,
      };
    }
  }

  if (phishing.level === "moderate") {
    return {
      messageId: input.messageId,
      category: "phishing",
      phishingScore: phishing.score,
      confidence: 55 + phishing.score / 4,
      signals,
    };
  }

  if (/noreply|no-reply|notifications?@/i.test(input.fromAddress)) {
    return {
      messageId: input.messageId,
      category: "transactional",
      phishingScore: phishing.score,
      confidence: 55,
      signals: [...signals, "Automated sender address"],
    };
  }

  return {
    messageId: input.messageId,
    category: "unknown",
    phishingScore: phishing.score,
    confidence: 45,
    signals,
  };
}
