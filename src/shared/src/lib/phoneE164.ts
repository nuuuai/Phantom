/** Loose E.164 check for forward targets (+country + 7–15 digits). */
export function isValidE164Phone(s: string): boolean {
  const t = s.trim();
  if (t.length === 0) return false;
  return /^\+[1-9]\d{6,14}$/.test(t);
}
