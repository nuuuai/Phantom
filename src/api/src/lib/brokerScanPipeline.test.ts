import { afterEach, describe, expect, it, vi } from "vitest";
import {
  delayMs,
  getBrokerScanWorkerDelayMs,
  mapWithConcurrency,
  randomDelayInRange,
} from "./brokerScanPipeline.js";

describe("brokerScanPipeline", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("getBrokerScanWorkerDelayMs parses BROKER_SCAN_WORKER_DELAY_MS", () => {
    vi.stubEnv("BROKER_SCAN_WORKER_DELAY_MS", " 10-30 ");
    expect(getBrokerScanWorkerDelayMs()).toEqual({ min: 10, max: 30 });
  });

  it("getBrokerScanWorkerDelayMs falls back on invalid env", () => {
    vi.stubEnv("BROKER_SCAN_WORKER_DELAY_MS", "not-a-range");
    expect(getBrokerScanWorkerDelayMs()).toEqual({ min: 5, max: 25 });
  });

  it("randomDelayInRange is within bounds", () => {
    for (let i = 0; i < 30; i++) {
      const v = randomDelayInRange(3, 9);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(9);
    }
  });

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
