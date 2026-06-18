import { describe, expect, it } from "vitest";
import {
  buildDailyBrief,
  buildIntelligenceItems,
  buildPriorityActions,
  buildRiskFactors,
  resolveCopilotResponse,
  type DashboardIntelligenceContext,
} from "./buildDashboardIntelligence.js";

const baseCtx: DashboardIntelligenceContext = {
  activeAliases: 3,
  aliasesHealthy: 2,
  aliasesWarning: 1,
  aliasesCompromised: 0,
  brokersFound: 10,
  brokersRemoved: 4,
  brokersPending: 2,
  brokersRelisted: 0,
  darkWebAlerts: 0,
  riskScore: 38,
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

describe("buildDashboardIntelligence", () => {
  it("builds six risk factors summing to 100 weight", () => {
    const factors = buildRiskFactors(baseCtx);
    expect(factors).toHaveLength(6);
    expect(factors.reduce((s, f) => s + f.weight, 0)).toBe(100);
  });

  it("prioritizes create alias when none exist", () => {
    const actions = buildPriorityActions({ ...baseCtx, activeAliases: 0 });
    expect(actions[0]?.id).toBe("create_alias");
  });

  it("builds daily brief lines", () => {
    const brief = buildDailyBrief(baseCtx);
    expect(brief.length).toBeGreaterThan(0);
    expect(brief[0]).toMatch(/risk score/i);
  });

  it("resolves risk score copilot prompt", () => {
    const factors = buildRiskFactors(baseCtx);
    const reply = resolveCopilotResponse("Why is my risk score?", {
      ...baseCtx,
      riskFactors: factors,
    });
    expect(reply).toContain("38/100");
    expect(reply).toContain("Factor breakdown");
  });

  it("builds intelligence feed with inbox spike", () => {
    const items = buildIntelligenceItems({
      ...baseCtx,
      inboxVolumeSpike: {
        aliasId: "a1",
        serviceLabel: "Amazon",
        category: "shopping",
        multiplier: 3.2,
      },
    });
    expect(items[0]?.id).toBe("intel_inbox_spike");
    expect(items[0]?.description).toMatch(/3\.2×/);
  });

  it("sorts intelligence by priority", () => {
    const items = buildIntelligenceItems({
      ...baseCtx,
      aliasesCompromised: 1,
      rotationCandidateAliasId: "alias-1",
      hasBrokerScan: false,
    });
    expect(items[0]?.id).toBe("intel_compromised");
    expect(items[0]?.quickAction?.toolId).toBe("rotate_alias");
  });
});
