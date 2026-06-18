import type { ApiResponse, ScamEngagementSummary } from "@phantom/shared";
import { generateScamEngageDemo } from "@phantom/shared";
import { Router } from "express";
import { isOverviewDemoMetricsEnabled } from "../lib/envOverviewDemo.js";

export const scamEngageRouter = Router();

scamEngageRouter.get("/sessions", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const demo = isOverviewDemoMetricsEnabled();
  const data: ScamEngagementSummary = generateScamEngageDemo(userId, demo);
  const response: ApiResponse<ScamEngagementSummary> = { ok: true, data };
  res.json(response);
});
