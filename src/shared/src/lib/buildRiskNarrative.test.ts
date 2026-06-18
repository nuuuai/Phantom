import { describe, expect, it } from "vitest";
import type { DashboardIntelligenceContext } from "./buildDashboardIntelligence.js";
import {
  buildRiskBand,
  buildRiskNarrative,
  buildRiskThresholdAction,
  riskTrendFromSeries,
} from "./buildRiskNarrative.js";

const ctx: DashboardIntelligenceContext = {
  activeAliases: 3,
  aliasesHealthy: 2,
  aliasesWarning: 1,
  aliasesCompromised: 0,
  brokersFound: 10,
  brokersRemoved: 4,
  brokersPending: 2,
  brokersRelisted: 0,
  darkWebAlerts: 0,
  riskScore: 67,
  hasBrokerScan: true,
  unreadInbox: 2,
  passwordAliasCount: 1,
  isPaidTier: true,
  metricsDemoMode: false,
  inboxPhishingCount: 0,
  inboxSpamCount: 0,
  daysSinceBrokerScan: 5,
  topRelistedBrokerName: null,
  inboxVolumeSpike: null,
  rotationCandidateAliasId: null,
};

describe("buildRiskNarrative", () => {
  it("maps score to elevated band", () => {
    expect(buildRiskBand(67).id).toBe("elevated");
  });

  it("maps critical above 79", () => {
    expect(buildRiskBand(85).id).toBe("critical");
  });

  it("returns threshold action for elevated scores", () => {
    const action = buildRiskThresholdAction(67, ctx);
    expect(action).toBeTruthy();
  });

  it("computes week-over-week delta from series", () => {
    expect(
      riskTrendFromSeries([{ score: 40 }, { score: 42 }, { score: 45 }])
    ).toBe(3);
  });

  it("builds narrative with week changes", () => {
    const narrative = buildRiskNarrative(ctx, ["2 broker removals confirmed."]);
    expect(narrative.band.id).toBe("elevated");
    expect(narrative.weekChanges).toHaveLength(1);
  });
});
