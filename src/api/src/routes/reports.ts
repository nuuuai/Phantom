import type { ApiResponse, ExposureReport } from "@phantom/shared";
import { buildExposureReport } from "@phantom/shared";
import { Router } from "express";
import { buildIntelligenceContext } from "../lib/buildIntelligenceContext.js";

export const reportsRouter = Router();

reportsRouter.get("/latest", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  try {
    const ctx = await buildIntelligenceContext(userId);
    const { userTier: _tier, ...intelCtx } = ctx;
    const data: ExposureReport = buildExposureReport({
      ...intelCtx,
      userId,
    });
    const response: ApiResponse<ExposureReport> = { ok: true, data };
    res.json(response);
  } catch {
    res.status(500).json({
      ok: false,
      error: { code: "report_failed", message: "Could not build exposure report" },
    });
  }
});
