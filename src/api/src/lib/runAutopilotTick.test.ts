import { describe, expect, it, vi } from "vitest";

vi.mock("./aliasRotate.js", () => ({
  findBestRotationCandidate: vi.fn(),
  rotateAliasForUser: vi.fn(),
}));

vi.mock("./submitBrokerRemovals.js", () => ({
  submitBrokerRemovalsForUser: vi.fn(),
}));

vi.mock("./envOverviewDemo.js", () => ({
  isOverviewDemoMetricsEnabled: vi.fn(),
}));

vi.mock("./prisma.js", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    aliasInboxMessage: { findMany: vi.fn() },
    alias: { findFirst: vi.fn(), update: vi.fn() },
    darkWebFinding: { findMany: vi.fn() },
    autopilotActionLog: { create: vi.fn(), findFirst: vi.fn() },
  },
}));

import { findBestRotationCandidate, rotateAliasForUser } from "./aliasRotate.js";
import { submitBrokerRemovalsForUser } from "./submitBrokerRemovals.js";
import { isOverviewDemoMetricsEnabled } from "./envOverviewDemo.js";
import { prisma } from "./prisma.js";
import { runAutopilotTick } from "./runAutopilotTick.js";

describe("runAutopilotTick", () => {
  it("auto-rotates compromised alias when enabled", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      tier: "free",
      autopilotAutoRotate: true,
      autopilotAutoQuarantine: false,
      autopilotAutoRemoval: false,
      autopilotAutoComplaint: false,
      aiSensitivity: 50,
    } as never);
    vi.mocked(findBestRotationCandidate).mockResolvedValue({
      id: "a1",
      label: "Shop",
      healthStatus: "compromised",
      type: "email",
    });
    vi.mocked(rotateAliasForUser).mockResolvedValue({
      ok: true,
      data: { previousId: "a1", alias: { id: "a2" } as never },
    });
    vi.mocked(prisma.darkWebFinding.findMany).mockResolvedValue([]);
    vi.mocked(isOverviewDemoMetricsEnabled).mockReturnValue(false);
    vi.mocked(prisma.autopilotActionLog.create).mockResolvedValue({} as never);

    const result = await runAutopilotTick("user-1");
    expect(result.rotatedAliasId).toBe("a2");
    expect(rotateAliasForUser).toHaveBeenCalledWith("user-1", "a1");
  });

  it("triggers breach playbook for paid users with critical findings", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      tier: "paid",
      autopilotAutoRotate: true,
      autopilotAutoQuarantine: false,
      autopilotAutoRemoval: false,
      autopilotAutoComplaint: false,
      aiSensitivity: 50,
    } as never);
    vi.mocked(findBestRotationCandidate).mockResolvedValue(null);
    vi.mocked(prisma.darkWebFinding.findMany).mockResolvedValue([
      { id: "f1", title: "Breach", severity: "critical" },
    ] as never);
    vi.mocked(prisma.autopilotActionLog.findFirst).mockResolvedValue(null);
    vi.mocked(isOverviewDemoMetricsEnabled).mockReturnValue(false);
    vi.mocked(prisma.autopilotActionLog.create).mockResolvedValue({} as never);

    const result = await runAutopilotTick("user-1");
    expect(result.breachPlaybooksTriggered).toBe(1);
    expect(prisma.autopilotActionLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ kind: "breach_playbook_triggered" }),
      })
    );
  });
});
