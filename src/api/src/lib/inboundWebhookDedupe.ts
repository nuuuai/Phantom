import { createHash } from "node:crypto";

/**
 * Stable idempotency key when the upstream worker does not send `providerMessageId`.
 * Stored in `AliasInboxMessage.providerMessageId` (unique) so replays dedupe like
 * provider-supplied IDs. Prefix avoids collision with real provider message IDs.
 */
export function computePhantomInboundDedupeKey(
  aliasAddress: string,
  fromAddress: string,
  subject: string,
  receivedAt: Date,
  snippet: string,
): string {
  const payload = [
    aliasAddress.trim().toLowerCase(),
    fromAddress.trim().toLowerCase(),
    subject,
    receivedAt.toISOString(),
    snippet,
  ].join("\u001f");
  const hash = createHash("sha256").update(payload, "utf8").digest("hex");
  return `phantom:v1:${hash}`;
}
