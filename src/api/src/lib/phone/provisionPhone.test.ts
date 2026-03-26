import { afterEach, describe, expect, it } from "vitest";
import { getPhoneProviderMode, provisionPhoneAlias } from "./provisionPhone.js";

describe("provisionPhoneAlias", () => {
  const orig = { ...process.env };

  afterEach(() => {
    process.env = { ...orig };
  });

  it("allocates mock number when PHONE_PROVIDER=mock", () => {
    process.env.PHONE_PROVIDER = "mock";
    const p = provisionPhoneAlias("+15551234567");
    expect(p.ok).toBe(true);
    if (p.ok) {
      expect(p.provider).toBe("mock");
      expect(p.value).toMatch(/^\+1-555-/);
      expect(p.forwardTo).toBe("+15551234567");
    }
  });

  it("getPhoneProviderMode returns twilio when set", () => {
    process.env.PHONE_PROVIDER = "twilio";
    process.env.TWILIO_ACCOUNT_SID = "ACtest";
    expect(getPhoneProviderMode()).toBe("twilio");
  });

  it("fails when twilio selected but account SID missing", () => {
    process.env.PHONE_PROVIDER = "twilio";
    delete process.env.TWILIO_ACCOUNT_SID;
    const p = provisionPhoneAlias(null);
    expect(p.ok).toBe(false);
    if (!p.ok) expect(p.code).toBe("phone_provider_unavailable");
  });

  it("succeeds twilio stub when SID present", () => {
    process.env.PHONE_PROVIDER = "twilio";
    process.env.TWILIO_ACCOUNT_SID = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
    const p = provisionPhoneAlias(null);
    expect(p.ok).toBe(true);
    if (p.ok) {
      expect(p.provider).toBe("twilio");
      expect(p.providerSid).toMatch(/^twilio_stub_/);
    }
  });
});
