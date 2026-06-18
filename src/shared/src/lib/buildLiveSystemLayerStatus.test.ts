import { describe, expect, it } from "vitest";
import { buildLiveSystemLayerStatus } from "./buildLiveSystemLayerStatus.js";

describe("buildLiveSystemLayerStatus", () => {
  it("uses live alias and broker counts for Shield", () => {
    const layers = buildLiveSystemLayerStatus({
      activeAliases: 4,
      aliasesHealthy: 3,
      brokersFound: 5,
      brokersRemoved: 2,
      brokersPending: 1,
      riskScore: 44,
      intelligenceCount: 2,
      darkWebAlerts: 0,
      unreadInbox: 3,
      hasBrokerScan: true,
      autopilotAutoRotate: false,
      autopilotAutoQuarantine: false,
      autopilotAutoComplaint: false,
      autopilotAutoRemoval: false,
    });
    expect(layers[0]?.status).toContain("3/4 aliases healthy");
    expect(layers[0]?.status).toContain("2/5 broker removals");
    expect(layers[1]?.status).toContain("Risk 44/100");
  });
});
