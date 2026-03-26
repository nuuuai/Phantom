import { describe, expect, it } from "vitest";

describe("api bootstrap", () => {
  it("loads shared health states", async () => {
    const { HEALTH_STATES } = await import("@phantom/shared");
    expect(HEALTH_STATES.length).toBeGreaterThan(0);
  });
});
