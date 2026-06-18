import { describe, expect, it } from "vitest";
import { buildDarkWebImpactAnalysis } from "./buildDarkWebImpactAnalysis.js";
import type { DarkWebFindingPublic } from "../types/darkWebFinding.js";

function finding(
  overrides: Partial<DarkWebFindingPublic> = {}
): DarkWebFindingPublic {
  return {
    id: "f1",
    severity: "high",
    status: "open",
    title: "Sample breach",
    summary: "Email and password exposed in breach dump.",
    sourceLabel: "HIBP",
    breachName: "TestBreach",
    identifierType: "email_address",
    identifierDisplay: "j***@example.com",
    recommendedAction: "Change your password immediately.",
    detectedAt: new Date().toISOString(),
    dismissedAt: null,
    ...overrides,
  };
}

describe("buildDarkWebImpactAnalysis", () => {
  it("links account email matches", () => {
    const analysis = buildDarkWebImpactAnalysis({
      finding: finding(),
      accountEmail: "john@example.com",
      aliasEmails: [],
      passwordAliasCount: 0,
      compromisedAliasCount: 0,
    });
    expect(analysis.links.some((l) => l.type === "account_email")).toBe(true);
    expect(analysis.impactScore).toBeGreaterThan(50);
  });

  it("flags password risk and vault audit", () => {
    const analysis = buildDarkWebImpactAnalysis({
      finding: finding({ identifierType: "password" }),
      accountEmail: "other@test.com",
      aliasEmails: [],
      passwordAliasCount: 2,
      compromisedAliasCount: 0,
    });
    expect(analysis.links.some((l) => l.type === "password_risk")).toBe(true);
    expect(analysis.remediationSteps.some((s) => s.includes("vault"))).toBe(true);
  });
});
