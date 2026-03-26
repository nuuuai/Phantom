import type { ActivityLayerType } from "./activityLayer.js";

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
}
