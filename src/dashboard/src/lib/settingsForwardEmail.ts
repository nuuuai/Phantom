/**
 * Matches API `src/api/src/routes/user.ts` PATCH validation (`EMAIL_RE`).
 * Empty string means “clear” (client sends `null` after trim).
 */
export const FORWARD_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidForwardEmailInput(trimmed: string): boolean {
  if (trimmed.length === 0) return true;
  return FORWARD_EMAIL_RE.test(trimmed);
}
