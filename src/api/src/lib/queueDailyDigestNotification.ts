import {
  buildExposureReport,
  buildPrivacyDigest,
  buildPriorityActions,
  formatPrivacyDigestEmail,
} from "@phantom/shared";
import { buildIntelligenceContext } from "./buildIntelligenceContext.js";
import { mapUserPreferences, USER_AI_PREFERENCES_SELECT } from "./mapUserPreferences.js";
import { sendPrivacyDigestEmail } from "./sendPrivacyDigestEmail.js";
import { prisma } from "./prisma.js";

const DIGEST_TITLE = "Daily privacy digest";

/** Creates one in-app digest notification per UTC day when digest mode is enabled. */
export async function queueDailyDigestNotification(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ...USER_AI_PREFERENCES_SELECT, forwardToEmail: true, email: true },
  });
  const prefs = mapUserPreferences(user);
  if (!prefs.notificationDigestMode) return;

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      title: DIGEST_TITLE,
      createdAt: { gte: startOfDay },
    },
    select: { id: true },
  });
  if (existing) return;

  const ctx = await buildIntelligenceContext(userId);
  const { userTier: _tier, ...intelCtx } = ctx;
  const report = buildExposureReport({ ...intelCtx, userId });
  const digest = buildPrivacyDigest({
    report,
    priorityActions: buildPriorityActions(ctx),
    digestMode: true,
  });

  const body = [
    digest.headline,
    ...digest.topActions.slice(0, 3).map((a) => `• ${a}`),
  ].join("\n");

  await prisma.notification.create({
    data: {
      userId,
      layer: "autopilot",
      priority: digest.overallSeverity === "critical" ? "high" : "medium",
      category: "system",
      title: DIGEST_TITLE,
      body: [
        body,
        user?.forwardToEmail?.trim() || user?.email
          ? `\n\nEmail digest queued when NOTIFICATIONS_EMAIL_ENABLED=1 (Phase 2 SMTP).`
          : "",
      ].join(""),
      linkTo: "/reports",
    },
  });

  const recipient = user?.forwardToEmail?.trim() || user?.email;
  if (recipient) {
    const emailBody = formatPrivacyDigestEmail({ ...digest, digestMode: true });
    void sendPrivacyDigestEmail({
      to: recipient,
      subject: "Phantom — Daily Privacy Digest",
      body: emailBody,
    });
  }
}
