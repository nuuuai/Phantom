/**
 * Forward-to email validation for `PATCH /api/user/me` and dashboard Settings.
 * Single source of truth for API + UI parity.
 */
export const FORWARD_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidForwardEmailInput(trimmed: string): boolean {
  if (trimmed.length === 0) return true;
  return FORWARD_EMAIL_RE.test(trimmed);
}

export type ParseForwardToEmailPatchResult =
  | { ok: true; value: string | null }
  | { ok: false; message: string };

/**
 * Parses `PATCH /api/user/me` body for `forwardToEmail` (string | null).
 * Matches Express route behavior in `src/api/src/routes/user.ts`.
 */
export function parseForwardToEmailPatchBody(
  body: unknown
): ParseForwardToEmailPatchResult {
  if (body == null || typeof body !== "object" || !("forwardToEmail" in body)) {
    return {
      ok: false,
      message: "forwardToEmail required (use null to clear)",
    };
  }

  const b = body as { forwardToEmail?: unknown };

  if (b.forwardToEmail === null) {
    return { ok: true, value: null };
  }

  if (typeof b.forwardToEmail === "string") {
    const t = b.forwardToEmail.trim();
    if (t.length === 0) {
      return { ok: true, value: null };
    }
    if (!FORWARD_EMAIL_RE.test(t)) {
      return {
        ok: false,
        message: "forwardToEmail must be a valid email or empty",
      };
    }
    return { ok: true, value: t.toLowerCase() };
  }

  return { ok: false, message: "forwardToEmail must be string or null" };
}
