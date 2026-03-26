import type { DataBroker as PrismaBroker, BrokerScanResult as PrismaResult } from "@prisma/client";
import type {
  BrokerCategory,
  BrokerDataType,
  BrokerRemovalMethod,
  BrokerScanResult,
  DataBroker,
  ScanStatus,
} from "@phantom/shared";
import { BROKER_DATA_TYPES } from "@phantom/shared";

function mapBroker(row: PrismaBroker): DataBroker {
  return {
    id: row.id,
    name: row.name,
    domain: row.domain,
    category: row.category as BrokerCategory,
    removalMethod: row.removalMethod as BrokerRemovalMethod,
    avgRemovalDays: row.avgRemovalDays,
    removalUrl: row.removalUrl ?? null,
    removalNotes: row.removalNotes ?? null,
    isActive: row.isActive,
  };
}

const DATA_TYPE_SET = new Set<string>(BROKER_DATA_TYPES);

function filterDataTypes(raw: string[]): BrokerDataType[] {
  return raw.filter((t): t is BrokerDataType => DATA_TYPE_SET.has(t));
}

export function mapBrokerScanResult(
  row: PrismaResult & { broker: PrismaBroker }
): BrokerScanResult {
  return {
    id: row.id,
    userId: row.userId,
    brokerScanRunId: row.brokerScanRunId,
    broker: mapBroker(row.broker),
    dataTypesFound: filterDataTypes(row.dataTypesFound),
    scanDate: row.scanDate.toISOString(),
    status: row.status as ScanStatus,
    removalSubmittedAt: row.removalSubmittedAt?.toISOString() ?? null,
    removalConfirmedAt: row.removalConfirmedAt?.toISOString() ?? null,
    relistDetectedAt: row.relistDetectedAt?.toISOString() ?? null,
  };
}

export { mapBroker };
