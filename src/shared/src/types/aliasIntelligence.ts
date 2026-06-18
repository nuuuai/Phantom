import type { AliasCategory } from "./alias.js";

export interface AliasUsagePoint {
  date: string;
  inboundCount: number;
}

export interface AliasHealthIntel {
  aliasId: string;
  healthScore: number;
  suggestedCategory: AliasCategory | null;
  explanationHeadline: string;
  usageSeries: readonly AliasUsagePoint[];
  recommendations: readonly string[];
}
