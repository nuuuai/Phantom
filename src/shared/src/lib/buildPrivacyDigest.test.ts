import { describe, expect, it } from "vitest";
import { buildExposureReport } from "./buildExposureReport.js";
import { buildPrivacyDigest } from "./buildPrivacyDigest.js";
import { buildPriorityActions } from "./buildDashboardIntelligence.js";
import type { DashboardIntelligenceContext } from "./buildDashboardIntelligence.js";

const ctx: DashboardIntelligenceContext = {
  activeAliases: 3,
  aliasesHealthy: 1,
  aliasesWarning: 1,
  aliasesCompromised: 1,
  passwordAliasCount: 0,
  brokersFound: 4,
  brokersRemoved: 1,
  brokersPending: 2,
  brokersRelisted: 0,
  hasBrokerScan: true,
  darkWebAlerts: 1,
  unreadInbox: 3,
  isPaidTier: true,
  metricsDemoMode: false,
  riskScore: 72,
  inboxPhishingCount: 1,
  inboxSpamCount: 2,
  daysSinceBrokerScan: 10,
  topRelistedBrokerName: null,
  inboxVolumeSpike: null,
  rotationCandidateAliasId: null,
};

describe("buildPrivacyDigest", () => {
  it("builds headline and actions from report", () => {
    const report = buildExposureReport({ ...ctx, userId: "user-1" });
    const digest = buildPrivacyDigest({
      report,
      priorityActions: buildPriorityActions(ctx),
      digestMode: true,
    });

    expect(digest.headline.length).toBeGreaterThan(10);
    expect(digest.topActions.length).toBeGreaterThan(0);
    expect(digest.digestMode).toBe(true);
  });
});
