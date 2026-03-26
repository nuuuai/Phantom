import type { BrokerScanResult as PrismaResult } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { computeBrokerScanSummaryFromRows } from "./computeBrokerScanSummary.js";

function row(partial: Partial<PrismaResult> & Pick<PrismaResult, "status">): PrismaResult {
  return {
    id: partial.id ?? "r1",
    userId: partial.userId ?? "u1",
    brokerScanRunId: partial.brokerScanRunId ?? "run1",
    brokerId: partial.brokerId ?? "b1",
    dataTypesFound: partial.dataTypesFound ?? ["email"],
    scanDate: partial.scanDate ?? new Date(),
    status: partial.status,
    removalSubmittedAt: partial.removalSubmittedAt ?? null,
    removalConfirmedAt: partial.removalConfirmedAt ?? null,
    relistDetectedAt: partial.relistDetectedAt ?? null,
  } as PrismaResult;
}

describe("computeBrokerScanSummaryFromRows", () => {
  it("aggregates counts and exposure", () => {
    const s = computeBrokerScanSummaryFromRows([
      row({ status: "not_found" }),
      row({ status: "found" }),
      row({ status: "removal_submitted" }),
      row({ status: "removal_confirmed" }),
      row({ status: "re_listed" }),
    ]);
    expect(s.totalScanned).toBe(5);
    expect(s.exposureCount).toBe(4);
    expect(s.found).toBe(1);
    expect(s.pending).toBe(1);
    expect(s.removed).toBe(1);
    expect(s.relisted).toBe(1);
    expect("canRequestRemoval" in s).toBe(false);
  });

  it("skips data type breakdown for not_found", () => {
    const s = computeBrokerScanSummaryFromRows([
      row({ status: "not_found", dataTypesFound: ["phone"] }),
      row({ status: "found", dataTypesFound: ["email"] }),
    ]);
    expect(s.dataTypesBreakdown.email).toBe(1);
    expect(s.dataTypesBreakdown.phone).toBe(0);
  });

  it("sums data types across multiple exposed rows", () => {
    const s = computeBrokerScanSummaryFromRows([
      row({ status: "found", dataTypesFound: ["email", "phone"] }),
      row({ status: "found", dataTypesFound: ["email"] }),
    ]);
    expect(s.found).toBe(2);
    expect(s.exposureCount).toBe(2);
    expect(s.dataTypesBreakdown.email).toBe(2);
    expect(s.dataTypesBreakdown.phone).toBe(1);
  });
});
