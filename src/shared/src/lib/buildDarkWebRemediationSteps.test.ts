import { describe, expect, it } from "vitest";
import { buildDarkWebRemediationSteps } from "./buildDarkWebRemediationSteps.js";

describe("buildDarkWebRemediationSteps", () => {
  it("includes vault rotation for password breaches", () => {
    const steps = buildDarkWebRemediationSteps({
      id: "f1",
      severity: "critical",
      identifierType: "password",
      breachName: "ExampleBreach",
      title: "Example breach",
    });
    expect(steps.some((s) => s.id === "rotate_vault")).toBe(true);
  });
});
