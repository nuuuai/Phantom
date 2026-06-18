import { describe, expect, it } from "vitest";
import { buildBreachTimeline } from "./buildBreachTimeline.js";

describe("buildBreachTimeline", () => {
  it("estimates exposure before detection", () => {
    const point = buildBreachTimeline({
      id: "f-1",
      detectedAt: "2026-06-01T12:00:00.000Z",
      severity: "high",
    });
    expect(point.lagDays).toBeGreaterThan(0);
    expect(new Date(point.estimatedExposedAt).getTime()).toBeLessThan(
      new Date(point.detectedAt).getTime()
    );
  });
});
