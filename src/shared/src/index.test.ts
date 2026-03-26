import { describe, expect, it } from "vitest";
import { RATE_LIMIT_RETRY_MS } from "./constants/http.js";
import { RISK_THRESHOLDS } from "./constants/riskThresholds.js";

describe("shared", () => {
  it("exports risk thresholds", () => {
    expect(RISK_THRESHOLDS.LOW_MAX).toBe(24);
  });

  it("exports rate-limit retry delay", () => {
    expect(RATE_LIMIT_RETRY_MS).toBe(1500);
  });
});
