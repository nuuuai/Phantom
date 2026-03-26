import { describe, expect, it } from "vitest";
import { DASHBOARD_PATHS, QUICK_ACTIONS } from "./dashboardRoutes.js";

/** Unique `linkTo` values from `POST /api/notifications/seed-demo` — must exist as routes. */
const NOTIFICATION_SEED_DEMO_LINKS = ["/brokers", "/aliases", "/dark-web"] as const;

describe("dashboardRoutes", () => {
  it("exposes stable path constants", () => {
    expect(DASHBOARD_PATHS.billing).toBe("/billing");
    expect(DASHBOARD_PATHS.inbox).toBe("/inbox");
    expect(DASHBOARD_PATHS.darkWeb).toBe("/dark-web");
  });

  it("quick actions point at known routes", () => {
    const paths = new Set(QUICK_ACTIONS.map((a) => a.to));
    expect(paths.has("/billing")).toBe(true);
    expect(paths.has("/settings")).toBe(true);
    expect(paths.has("/dark-web")).toBe(true);
  });

  it("notification demo deep links resolve to dashboard paths", () => {
    const known = new Set<string>(Object.values(DASHBOARD_PATHS));
    for (const link of NOTIFICATION_SEED_DEMO_LINKS) {
      expect(link.startsWith("/")).toBe(true);
      expect(known.has(link)).toBe(true);
    }
  });
});
