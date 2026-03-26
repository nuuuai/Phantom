import type { BrokerDataType, BrokerScanSummary } from "@phantom/shared";
import { BROKER_DATA_TYPES } from "@phantom/shared";
import type { BrokerScanResult as PrismaResult } from "@prisma/client";

function emptyBreakdown(): Record<BrokerDataType, number> {
  const o = {} as Record<BrokerDataType, number>;
  for (const t of BROKER_DATA_TYPES) {
    o[t] = 0;
  }
  return o;
}

export function computeBrokerScanSummaryFromRows(
  rows: PrismaResult[]
): Omit<BrokerScanSummary, "canRequestRemoval" | "freeTierBrokerScanMaxPer24h"> {
  const dataTypesBreakdown = emptyBreakdown();
  let found = 0;
  let removed = 0;
  let pending = 0;
  let relisted = 0;
  let exposureCount = 0;

  for (const r of rows) {
    switch (r.status) {
      case "not_found":
        break;
      case "found":
        found += 1;
        exposureCount += 1;
        break;
      case "removal_submitted":
        pending += 1;
        exposureCount += 1;
        break;
      case "removal_confirmed":
        removed += 1;
        exposureCount += 1;
        break;
      case "re_listed":
        relisted += 1;
        exposureCount += 1;
        break;
      default:
        break;
    }
    if (r.status !== "not_found") {
      for (const t of r.dataTypesFound) {
        if (t in dataTypesBreakdown) {
          dataTypesBreakdown[t as BrokerDataType] += 1;
        }
      }
    }
  }

  return {
    totalScanned: rows.length,
    exposureCount,
    found,
    removed,
    pending,
    relisted,
    dataTypesBreakdown,
  };
}
