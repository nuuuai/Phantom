import { describe, expect, it } from "vitest";
import { buildThreatHorizon } from "./buildThreatHorizon.js";

describe("buildThreatHorizon", () => {
  it("surfaces re-listing and stale scan signals", () => {
    const items = buildThreatHorizon({
      brokersRelisted: 1,
      brokersFound: 4,
      darkWebAlerts: 0,
      hasBrokerScan: true,
      isPaidTier: true,
      daysSinceBrokerScan: 20,
      topRelistedBrokerName: "Spokeo",
      inboxVolumeSpike: null,
      aliasesCompromised: 0,
      aliasesWarning: 0,
    });

    expect(items.some((i) => i.id === "broker_relisted")).toBe(true);
    expect(items.some((i) => i.id === "stale_broker_scan")).toBe(true);
  });
});
