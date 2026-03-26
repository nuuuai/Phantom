import type { ApiResponse, PhoneProviderStatus } from "@phantom/shared";
import { Router } from "express";
import { getPhoneProviderPublicStatus } from "../lib/phone/phoneConfig.js";

export const phoneRouter = Router();

/** Public adapter status for dashboard (no secrets). */
phoneRouter.get("/provider", async (_req, res) => {
  const data = getPhoneProviderPublicStatus();
  const response: ApiResponse<PhoneProviderStatus> = {
    ok: true,
    data,
  };
  res.json(response);
});
