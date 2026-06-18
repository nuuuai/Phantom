import { describe, expect, it } from "vitest";
import { buildBrokerRemovalNarrative } from "./buildBrokerRemovalNarrative.js";
import type { BrokerScanResult } from "../types/brokerScan.js";

function row(
  name: string,
  dataTypes: BrokerScanResult["dataTypesFound"],
  severity?: number
): BrokerScanResult {
  return {
    id: `r-${name}`,
    userId: "u1",
    brokerScanRunId: "run1",
    broker: {
      id: `b-${name}`,
      name,
      domain: `${name.toLowerCase()}.com`,
      category: "people_search",
      removalMethod: "form",
      avgRemovalDays: 14,
      removalUrl: null,
      removalNotes: null,
      isActive: true,
    },
    dataTypesFound: dataTypes,
    scanDate: new Date().toISOString(),
    status: "found",
    removalSubmittedAt: null,
    removalConfirmedAt: null,
    relistDetectedAt: null,
    exposureSeverity: severity ?? 0,
  };
}

describe("buildBrokerRemovalNarrative", () => {
  it("returns null when no active exposures", () => {
    expect(
      buildBrokerRemovalNarrative([
        { ...row("Clean", []), status: "not_found", exposureSeverity: 0 },
      ])
    ).toBeNull();
  });

  it("builds phased plan sorted by severity", () => {
    const narrative = buildBrokerRemovalNarrative([
      row("LowCo", ["name"], 8),
      row("HighCo", ["address", "phone"], 90),
    ]);
    expect(narrative).not.toBeNull();
    expect(narrative!.phases[0]?.brokerNames[0]).toBe("HighCo");
    expect(narrative!.totalExposures).toBe(2);
  });
});
