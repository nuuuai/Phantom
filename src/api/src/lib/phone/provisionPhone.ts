import { randomBytes } from "node:crypto";
import { generatePhoneValue } from "../aliasGenerators.js";

export type PhoneProviderMode = "mock" | "twilio";

export function getPhoneProviderMode(): PhoneProviderMode {
  const m = process.env.PHONE_PROVIDER?.trim().toLowerCase();
  if (m === "twilio") return "twilio";
  return "mock";
}

/**
 * Allocate a phone alias value + provider metadata. Twilio path is a stub until API calls are added.
 */
export function provisionPhoneAlias(forwardToE164: string | null): {
  value: string;
  provider: PhoneProviderMode;
  providerSid: string;
  forwardTo: string | null;
} {
  const mode = getPhoneProviderMode();
  const value = generatePhoneValue();
  const forwardTo = forwardToE164?.trim() || null;

  if (mode === "twilio" && process.env.TWILIO_ACCOUNT_SID?.trim()) {
    return {
      value,
      provider: "twilio",
      providerSid: `twilio_stub_${randomBytes(6).toString("hex")}`,
      forwardTo,
    };
  }

  return {
    value,
    provider: "mock",
    providerSid: `mock_${randomBytes(8).toString("hex")}`,
    forwardTo,
  };
}
