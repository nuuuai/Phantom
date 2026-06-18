import type { ApiResponse, ScamEngagementSummary } from "@phantom/shared";
import { Router } from "express";
import { buildScamEngageSummaryForUser } from "../lib/buildScamEngageSummaryForUser.js";

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

  const data = await buildScamEngageSummaryForUser(userId);
  const response: ApiResponse<ScamEngagementSummary> = { ok: true, data };
  res.json(response);
});
