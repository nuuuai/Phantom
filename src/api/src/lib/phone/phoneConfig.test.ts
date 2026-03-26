import { afterEach, describe, expect, it } from "vitest";
import { getPhoneProviderPublicStatus } from "./phoneConfig.js";

describe("getPhoneProviderPublicStatus", () => {
  const orig = { ...process.env };

  afterEach(() => {
    process.env = { ...orig };
  });

  it("mock is ready", () => {
    process.env.PHONE_PROVIDER = "mock";
    const s = getPhoneProviderPublicStatus();
    expect(s.ready).toBe(true);
    expect(s.provisioningMode).toBe("mock");
    expect(s.lastError).toBeNull();
  });

  it("twilio without SID is unavailable", () => {
    process.env.PHONE_PROVIDER = "twilio";
    delete process.env.TWILIO_ACCOUNT_SID;
    const s = getPhoneProviderPublicStatus();
    expect(s.ready).toBe(false);
    expect(s.provisioningMode).toBe("unavailable");
    expect(s.lastError).toContain("TWILIO_ACCOUNT_SID");
  });

  it("twilio with SID is stub-ready", () => {
    process.env.PHONE_PROVIDER = "twilio";
    process.env.TWILIO_ACCOUNT_SID = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
    const s = getPhoneProviderPublicStatus();
    expect(s.ready).toBe(true);
    expect(s.provisioningMode).toBe("twilio_stub");
    expect(s.lastError).toBeNull();
  });

  it("unknown PHONE_PROVIDER falls back to mock with warning", () => {
    process.env.PHONE_PROVIDER = "telnyx";
    const s = getPhoneProviderPublicStatus();
    expect(s.ready).toBe(true);
    expect(s.provisioningMode).toBe("mock");
    expect(s.lastError).toContain("Unknown PHONE_PROVIDER");
    expect(s.message).toContain("telnyx");
  });
});
