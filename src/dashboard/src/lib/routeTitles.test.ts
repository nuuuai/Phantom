import { describe, expect, it } from "vitest";
import { titleForPath } from "./routeTitles.js";

describe("titleForPath", () => {
  it("maps static routes", () => {
    expect(titleForPath("/")).toBe("Overview");
    expect(titleForPath("/billing")).toBe("Billing");
    expect(titleForPath("/settings")).toBe("Settings");
  });

  it("maps alias list vs detail", () => {
    expect(titleForPath("/aliases")).toBe("Aliases");
    expect(titleForPath("/aliases/abc-123")).toBe("Alias details");
  });

  it("ignores query string", () => {
    expect(titleForPath("/billing?canceled=1")).toBe("Billing");
  });

  it("falls back for unknown paths", () => {
    expect(titleForPath("/unknown-route")).toBe("Phantom");
  });
});
