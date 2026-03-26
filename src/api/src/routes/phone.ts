import type { ApiFailure, ApiResponse, PhoneProviderStatus } from "@phantom/shared";
import { Router } from "express";
import { getPhoneProviderPublicStatus } from "../lib/phone/phoneConfig.js";

export const phoneRouter = Router();

/** Public adapter status for dashboard (no secrets). Misconfigured Twilio → **503** + stable `error.code`. */
phoneRouter.get("/provider", async (_req, res) => {
  const data = getPhoneProviderPublicStatus();
  if (!data.ready) {
    const failure: ApiFailure = {
      ok: false,
      error: {
        code: "phone_provider_unavailable",
        message: data.message,
        lastError: data.lastError,
      },
    };
    res.status(503).json(failure);
    return;
  }
  const response: ApiResponse<PhoneProviderStatus> = {
    ok: true,
    data,
  };
  res.json(response);
});
