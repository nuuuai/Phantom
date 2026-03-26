import { describe, expect, it, vi } from "vitest";
import { computeBrokerScanSummaryFromRows } from "./computeBrokerScanSummary.js";
import { augmentBrokerScanSummary } from "./brokerScanSummaryAugment.js";

describe("augmentBrokerScanSummary", () => {
  it("paid tier: can queue removal, no free cap field", () => {
    const base = computeBrokerScanSummaryFromRows([]);
    const s = augmentBrokerScanSummary({ tier: "paid" }, base);
    expect(s.canRequestRemoval).toBe(true);
    expect(s.freeTierBrokerScanMaxPer24h).toBeNull();
  });

  it("free tier: exposes effective cap from env", () => {
    vi.stubEnv("FREE_TIER_BROKER_SCAN_MAX_PER_24H", "7");
    const base = computeBrokerScanSummaryFromRows([]);
    const s = augmentBrokerScanSummary({ tier: "free" }, base);
    expect(s.canRequestRemoval).toBe(false);
    expect(s.freeTierBrokerScanMaxPer24h).toBe(7);
    vi.unstubAllEnvs();
  });

  it("free tier unlimited: cap is null", () => {
    vi.stubEnv("FREE_TIER_BROKER_SCAN_MAX_PER_24H", "unlimited");
    const base = computeBrokerScanSummaryFromRows([]);
    const s = augmentBrokerScanSummary({ tier: "free" }, base);
    expect(s.freeTierBrokerScanMaxPer24h).toBeNull();
    vi.unstubAllEnvs();
  });
});
