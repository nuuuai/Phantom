import type { ApiResponse, CallGuardSummary } from "@phantom/shared";
import { generateCallGuardDemo } from "@phantom/shared";
import { Router } from "express";
import { isOverviewDemoMetricsEnabled } from "../lib/envOverviewDemo.js";

export const callGuardRouter = Router();

callGuardRouter.get("/logs", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const demo = isOverviewDemoMetricsEnabled();
  const data: CallGuardSummary = generateCallGuardDemo(userId, demo);
  const response: ApiResponse<CallGuardSummary> = { ok: true, data };
  res.json(response);
});
