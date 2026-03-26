import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyInboundSignature } from "./inboundWebhookSignature.js";

describe("verifyInboundSignature", () => {
  const secret = "test_secret_min_16_chars";
  const body = Buffer.from(JSON.stringify({ aliasAddress: "a@phantom.id" }), "utf8");

  it("accepts valid sha256 HMAC", () => {
    const hex = createHmac("sha256", secret).update(body).digest("hex");
    expect(
      verifyInboundSignature(body, `sha256=${hex}`, secret)
    ).toBe(true);
  });

  it("rejects wrong secret", () => {
    const hex = createHmac("sha256", "other").update(body).digest("hex");
    expect(
      verifyInboundSignature(body, `sha256=${hex}`, secret)
    ).toBe(false);
  });

  it("rejects missing or malformed header", () => {
    expect(verifyInboundSignature(body, undefined, secret)).toBe(false);
    expect(verifyInboundSignature(body, "bad", secret)).toBe(false);
  });
});
