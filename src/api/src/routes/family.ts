import type { ApiResponse, FamilySnapshot } from "@phantom/shared";
import { Router } from "express";
import { isOverviewDemoMetricsEnabled } from "../lib/envOverviewDemo.js";
import { prisma } from "../lib/prisma.js";

export const familyRouter = Router();

familyRouter.get("/snapshot", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true },
  });
  if (!user) {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "User not found" },
    });
    return;
  }

  const aliasCount = await prisma.alias.count({
    where: { userId, isActive: true },
  });

  const tierGated = user.tier !== "enterprise";
  const demo = isOverviewDemoMetricsEnabled();

  const data: FamilySnapshot = tierGated
    ? {
        seatCount: 1,
        seatsUsed: 1,
        members: [
          {
            id: "owner",
            displayLabel: "Account owner",
            role: "owner",
            threatAlerts: 0,
            aliasesProtected: aliasCount,
            callGuardEnabled: false,
          },
        ],
        sharedThreatPatterns: demo ? 9 : 0,
        tierGated: true,
      }
    : {
        seatCount: 5,
        seatsUsed: demo ? 3 : 1,
        members: demo
          ? [
              {
                id: "owner",
                displayLabel: "Account owner",
                role: "owner",
                threatAlerts: 1,
                aliasesProtected: aliasCount,
                callGuardEnabled: true,
              },
              {
                id: "member-2",
                displayLabel: "Family member 2",
                role: "adult",
                threatAlerts: 0,
                aliasesProtected: 4,
                callGuardEnabled: true,
              },
              {
                id: "member-3",
                displayLabel: "Family member 3",
                role: "child",
                threatAlerts: 2,
                aliasesProtected: 2,
                callGuardEnabled: false,
              },
            ]
          : [
              {
                id: "owner",
                displayLabel: "Account owner",
                role: "owner",
                threatAlerts: 0,
                aliasesProtected: aliasCount,
                callGuardEnabled: false,
              },
            ],
        sharedThreatPatterns: demo ? 9 : 0,
        tierGated: false,
      };

  const response: ApiResponse<FamilySnapshot> = { ok: true, data };
  res.json(response);
});
