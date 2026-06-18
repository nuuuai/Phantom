import { describe, expect, it } from "vitest";
import { scoreInboxPhishing } from "./scoreInboxPhishing.js";

describe("scoreInboxPhishing", () => {
  it("scores benign mail low", () => {
    const result = scoreInboxPhishing({
      subject: "Your order shipped",
      fromAddress: "shipping@store.example",
      snippet: "Track your package with the link in your account.",
    });
    expect(result.level).toBe("low");
    expect(result.score).toBeLessThan(28);
  });

  it("scores phishing patterns high", () => {
    const result = scoreInboxPhishing({
      subject: "Urgent: verify your account",
      fromAddress: "security@paypal-support.fake",
      snippet:
        "Click here to verify your identity within 24 hours or your account will be suspended.",
    });
    expect(result.level).toBe("high");
    expect(result.signals.length).toBeGreaterThan(0);
  });
});
