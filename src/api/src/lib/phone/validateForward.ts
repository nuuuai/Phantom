import { isValidE164Phone } from "@phantom/shared";

/**
 * Normalize optional forward target: empty → null; non-empty must be valid E.164.
 */
export function parsePhoneForwardTo(
  raw: string | null | undefined
):
  | { ok: true; value: string | null }
  | { ok: false; message: string } {
  if (raw === undefined || raw === null) {
    return { ok: true, value: null };
  }
  const t = raw.trim();
  if (t.length === 0) return { ok: true, value: null };
  if (!isValidE164Phone(t)) {
    return {
      ok: false,
      message:
        "Forward target must be empty or E.164 (e.g. +15551234567).",
    };
  }
  return { ok: true, value: t };
}
