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
