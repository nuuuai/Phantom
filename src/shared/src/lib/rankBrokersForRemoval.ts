import type { BrokerScanResult } from "../types/brokerScan.js";
import type { ExposureSeverityBand } from "./exposureSeverityBand.js";
import { computeBrokerExposureSeverity } from "./computeBrokerExposureSeverity.js";
import { exposureSeverityBand } from "./exposureSeverityBand.js";

export interface BrokerRemovalPriorityItem {
  brokerScanResultId: string;
  brokerName: string;
  brokerId: string;
  severity: number;
  severityBand: ExposureSeverityBand;
  priorityRank: number;
  dataTypesFound: readonly string[];
  status: BrokerScanResult["status"];
}

function isActiveExposure(row: BrokerScanResult): boolean {
  return row.status !== "not_found" && row.dataTypesFound.length > 0;
}

function severityFor(row: BrokerScanResult): number {
  if (!isActiveExposure(row)) return 0;
  return row.exposureSeverity ?? computeBrokerExposureSeverity(row.dataTypesFound);
}

/** Ranks broker scan results for removal orchestration (highest severity first). */
export function rankBrokersForRemoval(
  items: readonly BrokerScanResult[],
  limit = 15
): BrokerRemovalPriorityItem[] {
  return items
    .filter(isActiveExposure)
    .map((row) => ({
      row,
      severity: severityFor(row),
    }))
    .sort((a, b) => b.severity - a.severity)
    .slice(0, limit)
    .map(({ row, severity }, index) => ({
      brokerScanResultId: row.id,
      brokerName: row.broker.name,
      brokerId: row.broker.id,
      severity,
      severityBand: exposureSeverityBand(severity),
      priorityRank: index + 1,
      dataTypesFound: row.dataTypesFound,
      status: row.status,
    }));
}
