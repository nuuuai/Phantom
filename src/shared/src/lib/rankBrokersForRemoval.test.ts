import { describe, expect, it } from "vitest";
import { rankBrokersForRemoval } from "./rankBrokersForRemoval.js";
import type { BrokerScanResult } from "../types/brokerScan.js";

function row(name: string, severity: number): BrokerScanResult {
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
    dataTypesFound: ["name", "address"],
    scanDate: new Date().toISOString(),
    status: "found",
    removalSubmittedAt: null,
    removalConfirmedAt: null,
    relistDetectedAt: null,
    exposureSeverity: severity,
  };
}

describe("rankBrokersForRemoval", () => {
  it("ranks higher severity brokers first", () => {
    const ranked = rankBrokersForRemoval([row("Low", 30), row("High", 90)]);
    expect(ranked[0]?.brokerName).toBe("High");
  });
});
