import { describe, expect, it } from "vitest";
import { delayMs, mapWithConcurrency } from "./brokerScanPipeline.js";

describe("brokerScanPipeline", () => {
  it("mapWithConcurrency preserves order and respects concurrency", async () => {
    let active = 0;
    let maxActive = 0;
    const items = Array.from({ length: 20 }, (_, i) => i);
    const results = await mapWithConcurrency(items, 4, async (n) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await delayMs(1);
      active -= 1;
      return n * 2;
    });
    expect(results).toEqual(items.map((n) => n * 2));
    expect(maxActive).toBeLessThanOrEqual(4);
  });
});
