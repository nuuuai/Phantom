/**
 * k-anonymity password breach check via HIBP Pwned Passwords range API.
 * Password never leaves the client — only SHA-1 prefix (5 chars) is sent.
 */

export interface PasswordPwnedResult {
  breachCount: number;
  breached: boolean;
}

export async function sha1HexUpper(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-1", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

/**
 * Queries https://api.pwnedpasswords.com/range/{prefix}
 * Returns total breach count for this password hash (0 if not found).
 */
export async function checkPasswordPwned(
  password: string,
  fetchFn: typeof fetch = fetch
): Promise<PasswordPwnedResult> {
  if (!password) {
    return { breachCount: 0, breached: false };
  }

  const hash = await sha1HexUpper(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const res = await fetchFn(
    `https://api.pwnedpasswords.com/range/${prefix}`,
    {
      headers: { "Add-Padding": "true" },
    }
  );

  if (!res.ok) {
    throw new Error("breach_check_unavailable");
  }

  const body = await res.text();
  let breachCount = 0;

  for (const line of body.split("\n")) {
    const [hashSuffix, countStr] = line.trim().split(":");
    if (hashSuffix?.toUpperCase() === suffix) {
      breachCount = parseInt(countStr ?? "0", 10) || 0;
      break;
    }
  }

  return { breachCount, breached: breachCount > 0 };
}
