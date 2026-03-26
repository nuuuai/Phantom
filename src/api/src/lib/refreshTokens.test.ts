import { describe, expect, it } from "vitest";
import { hashRefreshToken } from "./refreshTokens.js";

describe("refreshTokens", () => {
  it("hashRefreshToken is stable for the same input", () => {
    const t =
      "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456";
    expect(hashRefreshToken(t)).toBe(hashRefreshToken(t));
  });

  it("hashRefreshToken differs for different tokens", () => {
    const a = "aa".repeat(32);
    const b = "bb".repeat(32);
    expect(hashRefreshToken(a)).not.toBe(hashRefreshToken(b));
  });
});
