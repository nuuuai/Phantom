import { describe, expect, it } from "vitest";
import { FREE_TIER_ALIAS_MAX } from "@phantom/shared";

describe("FREE_TIER_ALIAS_MAX", () => {
  it("matches Phase 1 free-tier product caps", () => {
    expect(FREE_TIER_ALIAS_MAX.email).toBe(3);
    expect(FREE_TIER_ALIAS_MAX.phone).toBe(1);
    expect(FREE_TIER_ALIAS_MAX.username).toBe(5);
    expect(FREE_TIER_ALIAS_MAX.password).toBe(25);
  });
});
