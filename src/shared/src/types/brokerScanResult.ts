export interface BrokerScanResult {
  id: string;
  brokerName: string;
  status: "pending" | "found" | "removed" | "relapsed";
  lastCheckedAt: string;
  exposureCount: number;
}
