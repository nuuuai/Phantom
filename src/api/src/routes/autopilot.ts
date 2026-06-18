import type { ApiResponse, AutopilotActionsListResponse } from "@phantom/shared";
import { Router } from "express";
import { listAutopilotActionsForUser } from "../lib/listAutopilotActionsForUser.js";

export const autopilotRouter = Router();

autopilotRouter.get("/actions", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const limitRaw = req.query.limit;
  const limit =
    typeof limitRaw === "string" && /^\d+$/.test(limitRaw)
      ? Number(limitRaw)
      : 20;

  const items = await listAutopilotActionsForUser(userId, limit);
  const response: ApiResponse<AutopilotActionsListResponse> = {
    ok: true,
    data: { items },
  };
  res.json(response);
});
