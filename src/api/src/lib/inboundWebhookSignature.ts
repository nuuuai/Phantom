import { createHmac, timingSafeEqual } from "node:crypto";

const PREFIX = "sha256=";

/**
 * HMAC-SHA256 over the **raw** request body (bytes as received).
 * Header: `X-Phantom-Signature: sha256=<hex>`
 */
export function verifyInboundSignature(
  rawBody: Buffer,
  headerValue: string | undefined,
  secret: string
): boolean {
  if (!headerValue || !headerValue.startsWith(PREFIX)) {
    return false;
  }
  const providedHex = headerValue.slice(PREFIX.length).trim();
  if (!/^[0-9a-f]{64}$/i.test(providedHex)) {
    return false;
  }
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(providedHex, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
