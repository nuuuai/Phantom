import type { ActivityLayerType } from "./activityLayer.js";
import type { CopilotActionParams, CopilotToolId } from "./copilotTools.js";

/** One factor in the 6-factor Brain risk model (Phase 1 heuristic). */
export interface RiskFactor {
  id: string;
  label: string;
  /** Factor contribution 0–100 (higher = more risk from this factor). */
  score: number;
  /** Weight as percentage of total model (sums to 100 across factors). */
  weight: number;
  summary: string;
}

/** Recommended next step ranked by impact × urgency. */
export interface PriorityAction {
  id: string;
  title: string;
  description: string;
  layer: ActivityLayerType;
  href: string;
  /** Lower = higher priority. */
  priority: number;
}

/** Proactive intelligence surfaced ahead of raw activity logs. */
export interface IntelligenceQuickAction {
  toolId: CopilotToolId;
  params?: CopilotActionParams;
}

/** Proactive intelligence surfaced ahead of raw activity logs. */
export interface IntelligenceItem {
  id: string;
  layer: ActivityLayerType;
  label: string;
  description: string;
  /** Model confidence 0–100. */
  confidence: number;
  /** Lower = higher priority in the feed. */
  priority: number;
  href?: string;
  actionLabel?: string;
  /** One-click execute via Copilot confirm (write actions). */
  quickAction?: IntelligenceQuickAction;
}

/** Inbox volume anomaly for proactive feed. */
export interface InboxVolumeSpikeSignal {
  aliasId: string;
  serviceLabel: string;
  category: string;
  /** Recent 7d volume vs prior 7d baseline (e.g. 3 = 3× normal). */
  multiplier: number;
}

/** Suggested Copilot prompt chip. */
export interface CopilotPrompt {
  id: string;
  label: string;
  prompt: string;
}
