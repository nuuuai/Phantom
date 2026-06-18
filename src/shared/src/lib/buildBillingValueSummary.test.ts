import { describe, expect, it } from "vitest";
import { buildBillingValueSummary } from "./buildBillingValueSummary.js";

describe("buildBillingValueSummary", () => {
  it("computes hours saved from broker removals", () => {
    const summary = buildBillingValueSummary({
      brokersRemoved: 4,
      activeAliases: 6,
      darkWebAlerts: 1,
      priorityActionCount: 2,
      scamsEngaged: 0,
      callsScreened: 0,
    });
    expect(summary.hoursSavedEstimate).toBeGreaterThanOrEqual(8);
  });
});
