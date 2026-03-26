import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getPhoneProviderMode, provisionPhoneAlias } from "./provisionPhone.js";

describe("provisionPhoneAlias", () => {
  const prev = process.env.PHONE_PROVIDER;
  const prevSid = process.env.TWILIO_ACCOUNT_SID;

  afterEach(() => {
    process.env.PHONE_PROVIDER = prev;
    process.env.TWILIO_ACCOUNT_SID = prevSid;
  });

  it("uses mock provider by default", () => {
    delete process.env.PHONE_PROVIDER;
    delete process.env.TWILIO_ACCOUNT_SID;
    const p = provisionPhoneAlias("+15551234567");
    expect(p.provider).toBe("mock");
    expect(p.providerSid.startsWith("mock_")).toBe(true);
    expect(p.value).toMatch(/^\+1-555-/);
    expect(p.forwardTo).toBe("+15551234567");
  });

  it("getPhoneProviderMode returns twilio when set", () => {
    process.env.PHONE_PROVIDER = "twilio";
    expect(getPhoneProviderMode()).toBe("twilio");
  });
});
