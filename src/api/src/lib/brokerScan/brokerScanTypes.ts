import type { BrokerDataType } from "@phantom/shared";
import type { BrokerScanStatus } from "@prisma/client";

export interface BrokerScanSubject {
  /** Display-safe search tokens derived from account (never logged). */
  searchQuery: string;
  hasEmail: boolean;
}

export interface BrokerScanProbeResult {
  status: Extract<BrokerScanStatus, "found" | "not_found">;
  dataTypesFound: BrokerDataType[];
  probeMode: "live" | "simulated";
}

export interface DataBrokerRow {
  id: string;
  name: string;
  domain: string;
  category: string;
}
