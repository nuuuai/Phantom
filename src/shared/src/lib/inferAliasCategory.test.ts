import { describe, expect, it } from "vitest";
import { inferAliasCategory } from "./inferAliasCategory.js";

describe("inferAliasCategory", () => {
  it("infers shopping from amazon domain", () => {
    expect(inferAliasCategory("https://www.amazon.com")).toBe("shopping");
  });

  it("infers finance from bank domain", () => {
    expect(inferAliasCategory("chase.com")).toBe("finance");
  });

  it("returns null for empty url", () => {
    expect(inferAliasCategory(null)).toBeNull();
  });
});
