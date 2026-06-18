import { describe, expect, it } from "vitest";
import { explainAliasHealth } from "./explainAliasHealth.js";

describe("explainAliasHealth", () => {
  it("returns healthy copy for healthy status", () => {
    const exp = explainAliasHealth("healthy");
    expect(exp.headline).toBe("Healthy");
    expect(exp.recommendations.length).toBeGreaterThan(0);
  });

  it("returns compromised recommendations", () => {
    const exp = explainAliasHealth("compromised");
    expect(exp.headline).toBe("Compromised");
    expect(exp.recommendations.some((r) => /rotate/i.test(r))).toBe(true);
  });
});
