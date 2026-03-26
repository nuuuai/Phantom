import { describe, expect, it } from "vitest";
import { isFreeTierAliasTypeAtCap } from "./tierQuota.js";

describe("isFreeTierAliasTypeAtCap", () => {
  const usage = [
    { type: "email" as const, used: 3, max: 3 },
    { type: "phone" as const, used: 0, max: 1 },
  ];

  it("returns false for paid tier", () => {
    expect(
      isFreeTierAliasTypeAtCap("paid", "email", usage)
    ).toBe(false);
  });

  it("returns true when used >= max on free tier", () => {
    expect(
      isFreeTierAliasTypeAtCap("free", "email", usage)
    ).toBe(true);
  });

  it("returns false when under cap", () => {
    expect(
      isFreeTierAliasTypeAtCap("free", "phone", usage)
    ).toBe(false);
  });
});
