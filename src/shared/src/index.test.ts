import { describe, expect, it } from "vitest";
import { RISK_THRESHOLDS } from "./constants/riskThresholds.js";

describe("shared", () => {
  it("exports risk thresholds", () => {
    expect(RISK_THRESHOLDS.LOW_MAX).toBe(24);
  });
});
