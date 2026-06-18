/** Outbound notification email — env-gated; no SMTP sender in Phase 1. */
export function isNotificationsEmailEnabled(): boolean {
  return process.env.NOTIFICATIONS_EMAIL_ENABLED?.trim() === "1";
}
