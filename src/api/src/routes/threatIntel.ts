import type { ApiResponse, ThreatPattern } from "@phantom/shared";
import { listThreatIntelPatterns } from "@phantom/shared";
import { Router } from "express";

export const threatIntelRouter = Router();

threatIntelRouter.get("/patterns", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const patterns: readonly ThreatPattern[] = listThreatIntelPatterns();
  const response: ApiResponse<{ patterns: readonly ThreatPattern[] }> = {
    ok: true,
    data: { patterns },
  };
  res.json(response);
});
