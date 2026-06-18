import { describe, expect, it } from "vitest";
import { classifyInboxMessage } from "./classifyInboxMessage.js";

describe("classifyInboxMessage", () => {
  it("classifies phishing mail", () => {
    const result = classifyInboxMessage({
      messageId: "m1",
      subject: "Urgent: verify your account",
      fromAddress: "security@paypal-support.fake",
      snippet: "Click here to verify your identity within 24 hours.",
    });
    expect(result.category).toBe("phishing");
    expect(result.phishingScore).toBeGreaterThan(50);
  });

  it("classifies transactional mail", () => {
    const result = classifyInboxMessage({
      messageId: "m2",
      subject: "Your order shipped",
      fromAddress: "shipping@store.example",
      snippet: "Track your package in your account.",
    });
    expect(["transactional", "unknown"]).toContain(result.category);
  });
});
