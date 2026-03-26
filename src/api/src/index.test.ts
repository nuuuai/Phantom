import { describe, expect, it } from "vitest";

describe("api bootstrap", () => {
  it("loads shared health status values", async () => {
    const { HEALTH_STATUS_VALUES } = await import("@phantom/shared");
    expect(HEALTH_STATUS_VALUES.length).toBeGreaterThan(0);
  });
});
