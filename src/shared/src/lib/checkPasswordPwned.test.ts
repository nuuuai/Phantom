import { describe, expect, it, vi } from "vitest";
import { checkPasswordPwned, sha1HexUpper } from "./checkPasswordPwned.js";

describe("checkPasswordPwned", () => {
  it("computes known SHA-1", async () => {
    const hash = await sha1HexUpper("password");
    expect(hash).toBe("5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8");
  });

  it("returns breached when suffix matches range response", async () => {
    const hash = await sha1HexUpper("password");
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `${suffix}:373047\n`,
    });
    const result = await checkPasswordPwned("password", fetchFn as typeof fetch);
    expect(fetchFn).toHaveBeenCalledWith(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      expect.objectContaining({ headers: { "Add-Padding": "true" } })
    );
    expect(result.breached).toBe(true);
    expect(result.breachCount).toBe(373047);
  });

  it("returns not breached when suffix absent", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "00000:1\n",
    });
    const result = await checkPasswordPwned("unique-password-xyz", fetchFn as typeof fetch);
    expect(result.breached).toBe(false);
    expect(result.breachCount).toBe(0);
  });
});
