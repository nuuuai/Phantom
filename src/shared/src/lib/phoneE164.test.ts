import { describe, expect, it } from "vitest";
import { isValidE164Phone } from "./phoneE164.js";

describe("isValidE164Phone", () => {
  it("accepts plausible E.164", () => {
    expect(isValidE164Phone("+15551234567")).toBe(true);
    expect(isValidE164Phone("+441234567890")).toBe(true);
  });

  it("rejects missing plus or bad length", () => {
    expect(isValidE164Phone("15551234567")).toBe(false);
    expect(isValidE164Phone("+12345")).toBe(false);
    expect(isValidE164Phone("+")).toBe(false);
  });
});
