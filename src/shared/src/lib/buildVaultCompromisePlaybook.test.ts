import { describe, expect, it } from "vitest";
import { buildVaultCompromisePlaybook } from "./buildVaultCompromisePlaybook.js";

describe("buildVaultCompromisePlaybook", () => {
  it("returns steps when breaches are found", () => {
    const steps = buildVaultCompromisePlaybook({
      breachedEntryCount: 2,
      reuseGroupCount: 1,
      topRotationLabels: ["Bank", "Shop"],
    });
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0]?.id).toBe("rotate_breached");
  });

  it("returns empty when vault is clean", () => {
    expect(
      buildVaultCompromisePlaybook({
        breachedEntryCount: 0,
        reuseGroupCount: 0,
        topRotationLabels: [],
      })
    ).toEqual([]);
  });
});
