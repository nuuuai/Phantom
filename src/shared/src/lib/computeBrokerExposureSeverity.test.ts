import { describe, expect, it } from "vitest";
import { computeBrokerExposureSeverity } from "./computeBrokerExposureSeverity.js";

describe("computeBrokerExposureSeverity", () => {
  it("scores higher for sensitive data types", () => {
    const low = computeBrokerExposureSeverity(["name"]);
    const high = computeBrokerExposureSeverity(["address", "phone", "relatives"]);
    expect(high).toBeGreaterThan(low);
  });

  it("returns baseline for empty types", () => {
    expect(computeBrokerExposureSeverity([])).toBe(25);
  });
});
