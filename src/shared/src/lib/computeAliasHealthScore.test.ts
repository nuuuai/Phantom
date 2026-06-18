import { describe, expect, it } from "vitest";
import { computeAliasHealthScore } from "./computeAliasHealthScore.js";

describe("computeAliasHealthScore", () => {
  it("scores healthy alias high", () => {
    const score = computeAliasHealthScore({
      healthStatus: "healthy",
      spamCount: 0,
      lastActivityAt: new Date().toISOString(),
    });
    expect(score).toBeGreaterThanOrEqual(85);
  });

  it("penalizes compromised status and spam", () => {
    const score = computeAliasHealthScore({
      healthStatus: "compromised",
      spamCount: 10,
      lastActivityAt: null,
    });
    expect(score).toBeLessThan(30);
  });
});
