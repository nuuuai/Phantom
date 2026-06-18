import { describe, expect, it, vi } from "vitest";
import { generateScamEngageDemo } from "@phantom/shared";

vi.mock("./envOverviewDemo.js", () => ({
  isOverviewDemoMetricsEnabled: vi.fn(),
}));

vi.mock("./prisma.js", () => ({
  prisma: {
    autopilotActionLog: { findMany: vi.fn() },
  },
}));

import { isOverviewDemoMetricsEnabled } from "./envOverviewDemo.js";
import { prisma } from "./prisma.js";
import { buildScamEngageSummaryForUser } from "./buildScamEngageSummaryForUser.js";

describe("buildScamEngageSummaryForUser", () => {
  it("marks sessions with autopilot FTC queue refs", async () => {
    vi.mocked(isOverviewDemoMetricsEnabled).mockReturnValue(true);
    const demo = generateScamEngageDemo("user-1", true);
    const target = demo.sessions.find((s) => !s.complaintFiled);
    expect(target).toBeDefined();

    vi.mocked(prisma.autopilotActionLog.findMany).mockResolvedValue([
      { refId: target!.id },
    ] as never);

    const summary = await buildScamEngageSummaryForUser("user-1");
    const match = summary.sessions.find((s) => s.id === target!.id);
    expect(match?.autopilotComplaintQueued).toBe(true);
    expect(summary.autopilotComplaintsQueued).toBeGreaterThan(0);
  });
});
