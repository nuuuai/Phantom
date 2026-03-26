import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isOverviewDemoMetricsEnabled } from "./envOverviewDemo.js";

describe("isOverviewDemoMetricsEnabled", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is false when both env vars unset", () => {
    expect(isOverviewDemoMetricsEnabled()).toBe(false);
  });

  it("is true when DASHBOARD_DEMO_METRICS=1", () => {
    vi.stubEnv("DASHBOARD_DEMO_METRICS", "1");
    expect(isOverviewDemoMetricsEnabled()).toBe(true);
  });

  it("is true when OVERVIEW_DEMO_METRICS=1 (alias)", () => {
    vi.stubEnv("OVERVIEW_DEMO_METRICS", "1");
    expect(isOverviewDemoMetricsEnabled()).toBe(true);
  });
});
