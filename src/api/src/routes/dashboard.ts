import type { ApiResponse, DashboardOverview } from "@phantom/shared";
import { Router } from "express";
import { buildDashboardOverview } from "../lib/buildDashboardOverview.js";

export const dashboardRouter = Router();

dashboardRouter.get("/metrics", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  try {
    const data = await buildDashboardOverview(userId);
    const response: ApiResponse<DashboardOverview> = { ok: true, data };
    res.json(response);
  } catch {
    res.status(500).json({
      ok: false,
      error: { code: "overview_failed", message: "Could not load overview" },
    });
  }
});
