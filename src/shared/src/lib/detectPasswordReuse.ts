export interface PasswordReuseEntry {
  id: string;
  label: string;
  /** Plain password string — client-side only; never transmit to server. */
  password: string;
}

export interface PasswordReuseGroup {
  passwordFingerprint: string;
  entryIds: readonly string[];
  labels: readonly string[];
}

function fingerprintPassword(password: string): string {
  let h = 0;
  for (let i = 0; i < password.length; i++) {
    h = (Math.imul(31, h) + password.charCodeAt(i)) | 0;
  }
  return `pw-${(h >>> 0).toString(16)}`;
}

/**
 * Groups vault entries by plain password string for client-side reuse detection.
 * Operates only on in-memory decrypted entries — never log passwords.
 */
export function detectPasswordReuse(
  entries: readonly PasswordReuseEntry[]
): PasswordReuseGroup[] {
  const buckets = new Map<
    string,
    { entryIds: string[]; labels: string[]; fingerprint: string }
  >();

  for (const entry of entries) {
    if (!entry.password || entry.password.length === 0) continue;
    const key = entry.password;
    const fingerprint = fingerprintPassword(entry.password);
    const existing = buckets.get(key);
    if (existing) {
      existing.entryIds.push(entry.id);
      existing.labels.push(entry.label);
    } else {
      buckets.set(key, {
        entryIds: [entry.id],
        labels: [entry.label],
        fingerprint,
      });
    }
  }

  return [...buckets.values()]
    .filter((g) => g.entryIds.length > 1)
    .map((g) => ({
      passwordFingerprint: g.fingerprint,
      entryIds: g.entryIds,
      labels: g.labels,
    }));
}
