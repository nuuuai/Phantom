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
  /** Known opt-out URL from catalog; null = UI uses search fallback. */
  removalUrl: string | null;
  /** Short DIY guidance when links drift or are unknown. */
  removalNotes: string | null;
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
  /** Server truth: paid/enterprise can enqueue removal; free tier is scan + DIY links only. */
  canRequestRemoval: boolean;
  /**
   * Effective free-tier cap for full scans per rolling 24h (matches API env
   * `FREE_TIER_BROKER_SCAN_MAX_PER_24H`). `null` when user is paid/enterprise,
   * or when the free-tier cap is disabled (unlimited in dev).
   */
  freeTierBrokerScanMaxPer24h: number | null;
}

export interface BrokerScanStartResponse {
  scanId: string;
  totalBrokers: number;
  estimatedTime: number;
}
