import { describe, expect, it } from "vitest";
import { DASHBOARD_PATHS, QUICK_ACTIONS } from "./dashboardRoutes.js";

describe("dashboardRoutes", () => {
  it("exposes stable path constants", () => {
    expect(DASHBOARD_PATHS.billing).toBe("/billing");
    expect(DASHBOARD_PATHS.inbox).toBe("/inbox");
  });

  it("quick actions point at known routes", () => {
    const paths = new Set(QUICK_ACTIONS.map((a) => a.to));
    expect(paths.has("/billing")).toBe(true);
    expect(paths.has("/settings")).toBe(true);
  });
});
