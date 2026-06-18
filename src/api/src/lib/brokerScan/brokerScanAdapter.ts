import type { DataBroker } from "@phantom/shared";
import { simulateOneBroker } from "../brokerScanSimulation.js";
import {
  getBrokerScanLiveDomains,
  getBrokerScanProviderId,
  shouldUseLiveProbe,
} from "./brokerScanConfig.js";
import { probeBrokerViaHttp } from "./httpSearchAdapter.js";
import type {
  BrokerScanProbeResult,
  BrokerScanSubject,
} from "./brokerScanTypes.js";

export interface ScanOneBrokerInput {
  broker: Pick<DataBroker, "id" | "name" | "domain" | "category">;
  userId: string;
  subject: BrokerScanSubject;
  /** Simulation-only: whether this index was selected as "found". */
  simIsFound: boolean;
  fetchFn?: typeof fetch;
}

export async function scanOneBroker(
  input: ScanOneBrokerInput
): Promise<BrokerScanProbeResult> {
  if (shouldUseLiveProbe(input.broker.domain)) {
    return probeBrokerViaHttp(
      input.broker.domain,
      input.subject,
      input.fetchFn
    );
  }

  const sim = simulateOneBroker(
    {
      id: input.broker.id,
      name: input.broker.name,
      domain: input.broker.domain,
      category: input.broker.category,
      removalMethod: "form",
      avgRemovalDays: 14,
      removalUrl: null,
      removalNotes: null,
      isActive: true,
    },
    input.userId,
    input.simIsFound
  );

  return {
    status: sim.status === "found" ? "found" : "not_found",
    dataTypesFound: [...sim.dataTypesFound],
    probeMode: "simulated",
  };
}

export function countLiveProbeBrokers(brokers: readonly { domain: string }[]): number {
  return brokers.filter((b) => shouldUseLiveProbe(b.domain)).length;
}

export function getBrokerScanProviderLabel(): string {
  return getBrokerScanProviderId();
}

export function getLiveDomainCount(): number {
  return getBrokerScanLiveDomains().size;
}
