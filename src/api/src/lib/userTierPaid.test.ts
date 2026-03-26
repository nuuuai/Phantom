import { describe, expect, it } from "vitest";
import { isPaidTier } from "./userTierPaid.js";

describe("isPaidTier", () => {
  it("returns true for paid and enterprise", () => {
    expect(isPaidTier("paid")).toBe(true);
    expect(isPaidTier("enterprise")).toBe(true);
  });

  it("returns false for free", () => {
    expect(isPaidTier("free")).toBe(false);
  });
});
