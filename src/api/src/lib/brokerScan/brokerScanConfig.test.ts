import { afterEach, describe, expect, it } from "vitest";
import {
  getBrokerScanLiveDomains,
  getBrokerScanProviderId,
  shouldUseLiveProbe,
} from "./brokerScanConfig.js";

describe("brokerScanConfig", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it("defaults to mock provider", () => {
    delete process.env.BROKER_SCAN_PROVIDER;
    expect(getBrokerScanProviderId()).toBe("mock");
    expect(shouldUseLiveProbe("spokeo.com")).toBe(false);
  });

  it("enables live probe for allowlisted domains in hybrid mode", () => {
    process.env.BROKER_SCAN_PROVIDER = "hybrid";
    expect(shouldUseLiveProbe("spokeo.com")).toBe(true);
    expect(shouldUseLiveProbe("phantom-broker-051.example")).toBe(false);
  });

  it("parses custom live domain list", () => {
    process.env.BROKER_SCAN_LIVE_DOMAINS = "foo.com, bar.com";
    expect(getBrokerScanLiveDomains().has("foo.com")).toBe(true);
  });
});
