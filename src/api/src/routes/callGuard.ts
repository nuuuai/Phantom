import type { ApiResponse, CallGuardSummary, CallGuardActiveSession } from "@phantom/shared";
import { generateCallGuardDemo, generateActiveCallGuardSession } from "@phantom/shared";
import { Router } from "express";
import { isOverviewDemoMetricsEnabled } from "../lib/envOverviewDemo.js";
import { streamCallGuardLiveDemo } from "../lib/streamCallGuardLive.js";

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

callGuardRouter.get("/sessions/active", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const demo = isOverviewDemoMetricsEnabled();
  const session = generateActiveCallGuardSession(userId, demo);
  const response: ApiResponse<{ session: CallGuardActiveSession | null }> = {
    ok: true,
    data: { session },
  };
  res.json(response);
});

/** NDJSON stream mock for live Call Guard screening (Phase 2 PSTN placeholder). */
callGuardRouter.get("/live/stream", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  if (!isOverviewDemoMetricsEnabled()) {
    res.status(503).json({
      ok: false,
      error: {
        code: "call_guard_live_unavailable",
        message: "Live Call Guard preview requires demo metrics mode",
      },
    });
    return;
  }

  try {
    await streamCallGuardLiveDemo(userId, res);
  } catch {
    if (!res.headersSent) {
      res.status(500).json({
        ok: false,
        error: { code: "stream_failed", message: "Call Guard stream failed" },
      });
    }
  }
});
