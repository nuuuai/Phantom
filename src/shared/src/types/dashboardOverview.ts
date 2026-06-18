import type { ActivityLayerType } from "./activityLayer.js";
import type {
  CopilotPrompt,
  IntelligenceItem,
  PriorityAction,
  RiskFactor,
} from "./dashboardIntelligence.js";
import type { RiskNarrative, RiskTrendPoint } from "./riskNarrative.js";

export interface ActivityItem {
  type: ActivityLayerType;
  label: string;
  desc: string;
  time: string;
}

export interface SystemLayerStatus {
  name: string;
  status: string;
  layer: ActivityLayerType;
}

export interface DashboardOverview {
  userId: string;
  riskScore: number;
  riskTrend: number;
  /** Brain — 13-week (90-day) risk score trend. */
  riskTrendSeries: readonly RiskTrendPoint[];
  /** Brain — band, threshold action, weekly deltas. */
  riskNarrative: RiskNarrative;
  /**
   * When true, Sword / SEE-style counters and weekly chart are **synthetic** for screenshots.
   * Set when API env **`OVERVIEW_DEMO_METRICS=1`**; otherwise **false** (honest Phase 1 zeros).
   */
  metricsDemoMode: boolean;
  activeAliases: number;
  aliasesHealthy: number;
  aliasesWarning: number;
  aliasesCompromised: number;
  brokersFound: number;
  brokersRemoved: number;
  brokersPending: number;
  brokersRelisted: number;
  callsScreened: number;
  scamsEngaged: number;
  scammerMinutes: number;
  complaintsFile: number;
  darkWebAlerts: number;
  activity: readonly ActivityItem[];
  weeklyScams: readonly number[];
  weekDays: readonly string[];
  systemLayers: readonly SystemLayerStatus[];
  /** Brain — personalized summary lines for today. */
  dailyBrief: readonly string[];
  /** Brain — 6-factor risk breakdown. */
  riskFactors: readonly RiskFactor[];
  /** Autopilot — ranked recommended actions. */
  priorityActions: readonly PriorityAction[];
  /** Brain — proactive intelligence (ahead of activity log). */
  intelligence: readonly IntelligenceItem[];
  /** Brain — suggested Copilot prompts. */
  copilotPrompts: readonly CopilotPrompt[];
  /** Unread alias inbox count (Brain signal). */
  unreadInbox: number;
  /** Whether the user has completed at least one broker scan. */
  hasBrokerScan: boolean;
  passwordAliasCount: number;
  isPaidTier: boolean;
}
