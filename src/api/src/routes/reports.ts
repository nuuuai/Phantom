import type { ApiResponse, PrivacyDigest } from "@phantom/shared";
import {
  buildExposureReport,
  buildPrivacyDigest,
  buildPriorityActions,
  formatPrivacyDigestEmail,
} from "@phantom/shared";
import { Router } from "express";
import { buildIntelligenceContext } from "../lib/buildIntelligenceContext.js";
import { mapUserPreferences, USER_AI_PREFERENCES_SELECT } from "../lib/mapUserPreferences.js";
import { prisma } from "../lib/prisma.js";

export const reportsRouter = Router();

async function buildReportBundle(userId: string) {
  const ctx = await buildIntelligenceContext(userId);
  const { userTier: _tier, ...intelCtx } = ctx;
  const report = buildExposureReport({ ...intelCtx, userId });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ...USER_AI_PREFERENCES_SELECT, forwardToEmail: true, email: true },
  });
  const prefs = mapUserPreferences(user);
  const digest = buildPrivacyDigest({
    report,
    priorityActions: buildPriorityActions(ctx),
    digestMode: prefs.notificationDigestMode,
  });
  const digestEmail =
    user?.forwardToEmail?.trim() || user?.email || null;
  return { report, digest, digestEmail };
}

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
    const { report } = await buildReportBundle(userId);
    const response: ApiResponse<{ report: typeof report }> = {
      ok: true,
      data: { report },
    };
    res.json(response);
  } catch {
    res.status(500).json({
      ok: false,
      error: { code: "report_failed", message: "Could not build exposure report" },
    });
  }
});

reportsRouter.get("/digest", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  try {
    const { digest } = await buildReportBundle(userId);
    const response: ApiResponse<PrivacyDigest> = { ok: true, data: digest };
    res.json(response);
  } catch {
    res.status(500).json({
      ok: false,
      error: { code: "digest_failed", message: "Could not build privacy digest" },
    });
  }
});

reportsRouter.get("/digest/email", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  try {
    const { digest, digestEmail } = await buildReportBundle(userId);
    const body = formatPrivacyDigestEmail({ ...digest, digestMode: true });
    const response: ApiResponse<{ to: string | null; subject: string; body: string }> =
      {
        ok: true,
        data: {
          to: digestEmail,
          subject: "Phantom — Daily Privacy Digest",
          body,
        },
      };
    res.json(response);
  } catch {
    res.status(500).json({
      ok: false,
      error: { code: "digest_email_failed", message: "Could not build digest email" },
    });
  }
});
