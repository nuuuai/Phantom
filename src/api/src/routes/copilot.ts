import type {
  ApiResponse,
  CopilotChatResponse,
  CopilotConfirmRequest,
  CopilotConfirmResponse,
  CopilotStatusResponse,
  CopilotToolId,
} from "@phantom/shared";
import { Router } from "express";
import { executeCopilotAction } from "../lib/copilot/executeCopilotAction.js";
import { getCopilotStatus } from "../lib/copilot/envCopilot.js";
import { runCopilotChat } from "../lib/copilot/runCopilotChat.js";

const TOOL_SET = new Set<CopilotToolId>([
  "start_broker_scan",
  "rotate_alias",
  "request_broker_removals",
]);

export const copilotRouter = Router();

copilotRouter.get("/status", (_req, res) => {
  const data = getCopilotStatus();
  const response: ApiResponse<CopilotStatusResponse> = { ok: true, data };
  res.json(response);
});

copilotRouter.post("/chat", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const body = req.body as { message?: unknown };
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 2000) {
    res.status(400).json({
      ok: false,
      error: {
        code: "validation_error",
        message: "message required (max 2000 chars)",
      },
    });
    return;
  }

  try {
    const data = await runCopilotChat(userId, message);
    const response: ApiResponse<CopilotChatResponse> = { ok: true, data };
    res.json(response);
  } catch {
    res.status(500).json({
      ok: false,
      error: {
        code: "copilot_failed",
        message: "Could not complete Copilot request",
      },
    });
  }
});

copilotRouter.post("/confirm", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const body = req.body as CopilotConfirmRequest;
  const toolId = body.toolId;
  if (!toolId || !TOOL_SET.has(toolId)) {
    res.status(400).json({
      ok: false,
      error: { code: "validation_error", message: "Valid toolId required" },
    });
    return;
  }

  try {
    const result = await executeCopilotAction(userId, toolId, body.params);
    if (!result.ok) {
      const status =
        result.code === "rate_limited"
          ? 429
          : result.code === "upgrade_required"
            ? 403
            : 400;
      if (result.retryAfterSeconds) {
        res.setHeader("Retry-After", String(result.retryAfterSeconds));
      }
      res.status(status).json({
        ok: false,
        error: {
          code: result.code,
          message: result.message,
          retryAfterSeconds: result.retryAfterSeconds,
        },
      });
      return;
    }

    const response: ApiResponse<CopilotConfirmResponse> = {
      ok: true,
      data: result.data,
    };
    res.json(response);
  } catch {
    res.status(500).json({
      ok: false,
      error: {
        code: "copilot_confirm_failed",
        message: "Could not execute Copilot action",
      },
    });
  }
});
