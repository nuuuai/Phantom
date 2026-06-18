import { describe, expect, it } from "vitest";
import { buildExposureReport } from "./buildExposureReport.js";
import type { DashboardIntelligenceContext } from "./buildDashboardIntelligence.js";

const ctx: DashboardIntelligenceContext = {
  activeAliases: 5,
  aliasesHealthy: 4,
  aliasesWarning: 1,
  aliasesCompromised: 0,
  brokersFound: 8,
  brokersRemoved: 3,
  brokersPending: 2,
  brokersRelisted: 0,
  darkWebAlerts: 1,
  riskScore: 52,
  hasBrokerScan: true,
  unreadInbox: 3,
  passwordAliasCount: 2,
  isPaidTier: true,
  metricsDemoMode: false,
  inboxPhishingCount: 1,
  inboxSpamCount: 2,
  daysSinceBrokerScan: 10,
  topRelistedBrokerName: null,
  inboxVolumeSpike: null,
  rotationCandidateAliasId: null,
  aiSensitivity: 50,
};

describe("buildExposureReport", () => {
  it("builds sections from intelligence context", () => {
    const report = buildExposureReport({ ...ctx, userId: "user-test" });
    expect(report.sections.length).toBeGreaterThanOrEqual(4);
    expect(report.narrative).toContain("52/100");
    expect(report.periodLabel).toBe("Last 30 days");
  });
});
