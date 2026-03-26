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

  it("confirmationProbabilityForBroker ranks email above manual", () => {
    const email = confirmationProbabilityForBroker("email", 14);
    const manual = confirmationProbabilityForBroker("manual", 14);
    expect(email).toBeGreaterThan(manual);
  });

  it("confirmationProbabilityForBroker clamps high method scores to 0.42", () => {
    const p = confirmationProbabilityForBroker("api", 7);
    expect(p).toBeLessThanOrEqual(0.42);
  });
});
