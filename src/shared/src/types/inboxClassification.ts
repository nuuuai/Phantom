export type InboxMessageCategory =
  | "spam"
  | "marketing"
  | "transactional"
  | "phishing"
  | "personal"
  | "unknown";

export interface InboxMessageClassification {
  messageId: string;
  category: InboxMessageCategory;
  phishingScore: number;
  confidence: number;
  signals: readonly string[];
}

export interface InboxSummary {
  totalMessages: number;
  unreadCount: number;
  byCategory: Record<InboxMessageCategory, number>;
  topThreats: readonly InboxMessageClassification[];
}
