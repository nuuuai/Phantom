import { describe, expect, it } from "vitest";
import {
  aliasesAll,
  aliasDetailAll,
  brokerScanResultsAll,
  dashboardOverviewAll,
  queryKeys,
  vaultAll,
} from "./queryKeys.js";

describe("queryKeys", () => {
  it("aliasDetail matches aliasDetailAll prefix", () => {
    const detail = queryKeys.aliasDetail("tok", "id-1");
    expect(detail[0]).toBe(aliasDetailAll[0]);
    expect(queryKeys.aliasDetailAll).toBe(aliasDetailAll);
  });

  it("lists share stable prefix keys", () => {
    expect(aliasesAll[0]).toBe("aliases");
    expect(vaultAll[0]).toBe("vault");
    expect(dashboardOverviewAll[0]).toBe("dashboard-overview");
    expect(brokerScanResultsAll[0]).toBe("broker-scan-results");
    expect(queryKeys.aliasesList("t", "a", "h")[0]).toBe("aliases");
  });

  it("vaultList and notificationPrefs are scoped", () => {
    expect(queryKeys.vaultList("tok", "all")[0]).toBe("vault");
    expect(queryKeys.notificationPrefs("tok")[0]).toBe("notification-prefs");
  });

  it("emailInbox is scoped", () => {
    expect(queryKeys.emailInbox("tok")[0]).toBe("email-inbox");
  });
});
