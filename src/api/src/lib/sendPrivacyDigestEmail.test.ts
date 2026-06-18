import { afterEach, describe, expect, it, vi } from "vitest";
import { sendPrivacyDigestEmail } from "./sendPrivacyDigestEmail.js";

describe("sendPrivacyDigestEmail", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns disabled when env is unset", async () => {
    vi.stubEnv("NOTIFICATIONS_EMAIL_ENABLED", "0");
    const result = await sendPrivacyDigestEmail({
      to: "user@example.com",
      subject: "Test",
      body: "Body",
    });
    expect(result).toEqual({ ok: false, mode: "disabled" });
  });

  it("logs when enabled", async () => {
    vi.stubEnv("NOTIFICATIONS_EMAIL_ENABLED", "1");
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const result = await sendPrivacyDigestEmail({
      to: "user@example.com",
      subject: "Test",
      body: "Body",
    });
    expect(result).toEqual({ ok: true, mode: "logged" });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
