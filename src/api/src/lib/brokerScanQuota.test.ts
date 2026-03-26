import { afterEach, describe, expect, it } from "vitest";
import {
  FREE_TIER_BROKER_SCAN_WINDOW_MS,
  resolveFreeTierBrokerScanCap,
} from "./brokerScanQuota.js";

describe("brokerScanQuota", () => {
  afterEach(() => {
    delete process.env.FREE_TIER_BROKER_SCAN_MAX_PER_24H;
  });

  it("defaults to shared package constant", () => {
    delete process.env.FREE_TIER_BROKER_SCAN_MAX_PER_24H;
    expect(resolveFreeTierBrokerScanCap()).toBe(3);
  });

  it("unlimited env disables cap", () => {
    process.env.FREE_TIER_BROKER_SCAN_MAX_PER_24H = "unlimited";
    expect(resolveFreeTierBrokerScanCap()).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("0 means unlimited", () => {
    process.env.FREE_TIER_BROKER_SCAN_MAX_PER_24H = "0";
    expect(resolveFreeTierBrokerScanCap()).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("parses positive integer", () => {
    process.env.FREE_TIER_BROKER_SCAN_MAX_PER_24H = "5";
    expect(resolveFreeTierBrokerScanCap()).toBe(5);
  });

  it("caps absurdly large values at 500", () => {
    process.env.FREE_TIER_BROKER_SCAN_MAX_PER_24H = "99999";
    expect(resolveFreeTierBrokerScanCap()).toBe(500);
  });

  it("window is 24h", () => {
    expect(FREE_TIER_BROKER_SCAN_WINDOW_MS).toBe(86_400_000);
  });
});
