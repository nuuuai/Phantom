import { describe, expect, it } from "vitest";
import {
  confirmationProbabilityForBroker,
  relistProbabilityForBroker,
} from "./brokerRemovalPipeline.js";

describe("brokerRemovalPipeline", () => {
  it("confirmationProbabilityForBroker ranks api above manual and clamps", () => {
    const api = confirmationProbabilityForBroker("api", 14);
    const manual = confirmationProbabilityForBroker("manual", 14);
    expect(api).toBeGreaterThan(manual);
    expect(api).toBeLessThanOrEqual(0.42);
    expect(manual).toBeGreaterThan(0);
  });

  it("relistProbabilityForBroker decreases as avgRemovalDays increases", () => {
    const fast = relistProbabilityForBroker(10);
    const slow = relistProbabilityForBroker(40);
    expect(fast).toBeGreaterThan(slow);
  });
});
