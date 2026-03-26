import { afterEach, describe, expect, it, vi } from "vitest";
import {
  delayMs,
  getBrokerScanConcurrency,
  getBrokerScanWorkerDelayMs,
  mapWithConcurrency,
  randomDelayInRange,
  validateBrokerScanRuntimeConfig,
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

  it("getBrokerScanConcurrency clamps and defaults", () => {
    vi.stubEnv("BROKER_SCAN_CONCURRENCY", "");
    expect(getBrokerScanConcurrency()).toBe(8);
    vi.stubEnv("BROKER_SCAN_CONCURRENCY", "4");
    expect(getBrokerScanConcurrency()).toBe(4);
    vi.stubEnv("BROKER_SCAN_CONCURRENCY", "99");
    expect(getBrokerScanConcurrency()).toBe(32);
    vi.stubEnv("BROKER_SCAN_CONCURRENCY", "not-a-number");
    expect(getBrokerScanConcurrency()).toBe(8);
  });

  describe("validateBrokerScanRuntimeConfig", () => {
    it("accepts unset env", () => {
      delete process.env.BROKER_SCAN_CONCURRENCY;
      delete process.env.BROKER_SCAN_WORKER_DELAY_MS;
      expect(validateBrokerScanRuntimeConfig()).toEqual({ ok: true });
    });

    it("rejects concurrency out of range", () => {
      vi.stubEnv("BROKER_SCAN_CONCURRENCY", "99");
      const r = validateBrokerScanRuntimeConfig();
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.message).toContain("1 and 32");
    });

    it("rejects non-integer concurrency", () => {
      vi.stubEnv("BROKER_SCAN_CONCURRENCY", "8abc");
      const r = validateBrokerScanRuntimeConfig();
      expect(r.ok).toBe(false);
    });

    it("accepts concurrency 1–32", () => {
      vi.stubEnv("BROKER_SCAN_CONCURRENCY", "16");
      expect(validateBrokerScanRuntimeConfig()).toEqual({ ok: true });
    });

    it("rejects delay without hyphen", () => {
      vi.stubEnv("BROKER_SCAN_WORKER_DELAY_MS", "25");
      const r = validateBrokerScanRuntimeConfig();
      expect(r.ok).toBe(false);
    });

    it("rejects min > max", () => {
      vi.stubEnv("BROKER_SCAN_WORKER_DELAY_MS", "40-10");
      const r = validateBrokerScanRuntimeConfig();
      expect(r.ok).toBe(false);
    });

    it("rejects max > 120000", () => {
      vi.stubEnv("BROKER_SCAN_WORKER_DELAY_MS", "0-120001");
      const r = validateBrokerScanRuntimeConfig();
      expect(r.ok).toBe(false);
    });

    it("accepts valid delay range", () => {
      vi.stubEnv("BROKER_SCAN_WORKER_DELAY_MS", " 5-25 ");
      expect(validateBrokerScanRuntimeConfig()).toEqual({ ok: true });
    });
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
