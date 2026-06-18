import { isNotificationsEmailEnabled } from "./envNotificationsEmail.js";

export type DigestEmailSendMode = "disabled" | "logged";

export interface DigestEmailSendResult {
  ok: boolean;
  mode: DigestEmailSendMode;
}

/** Queues digest email when enabled — logs intent only until SMTP worker ships. */
export async function sendPrivacyDigestEmail(_payload: {
  to: string;
  subject: string;
  body: string;
}): Promise<DigestEmailSendResult> {
  if (!isNotificationsEmailEnabled()) {
    return { ok: false, mode: "disabled" };
  }

  process.stdout.write(
    "phantom-api: privacy digest email queued (NOTIFICATIONS_EMAIL_ENABLED=1; SMTP sender Phase 2)\n"
  );
  return { ok: true, mode: "logged" };
}
