import type { BrokerDataType } from "../constants/brokerDataTypes.js";

export type BrokerCategory =
  | "people_search"
  | "marketing"
  | "data_aggregator"
  | "background_check"
  | "public_records";

export type BrokerRemovalMethod = "api" | "form" | "email" | "manual";

export type ScanStatus =
  | "not_found"
  | "found"
  | "removal_submitted"
  | "removal_confirmed"
  | "re_listed";

export interface DataBroker {
  id: string;
  name: string;
  domain: string;
  category: BrokerCategory;
  removalMethod: BrokerRemovalMethod;
  avgRemovalDays: number;
  isActive: boolean;
}

export interface BrokerScanResult {
  id: string;
  userId: string;
  brokerScanRunId: string;
  broker: DataBroker;
  dataTypesFound: BrokerDataType[];
  scanDate: string;
  status: ScanStatus;
  removalSubmittedAt: string | null;
  removalConfirmedAt: string | null;
  relistDetectedAt: string | null;
}

export interface BrokerScanSummary {
  totalScanned: number;
  /** Brokers where any personal data was detected (not `not_found`) */
  exposureCount: number;
  found: number;
  removed: number;
  pending: number;
  relisted: number;
  dataTypesBreakdown: Record<BrokerDataType, number>;
}

export interface BrokerScanStartResponse {
  scanId: string;
  totalBrokers: number;
  estimatedTime: number;
}
