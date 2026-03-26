import { randomBytes } from "node:crypto";
import { generatePhoneValue } from "../aliasGenerators.js";
import {
  getPhoneAdapterId,
  isTwilioConfigured,
} from "./phoneConfig.js";

export type PhoneProvisionSuccess = {
  ok: true;
  value: string;
  provider: string;
  providerSid: string;
  forwardTo: string | null;
};

export type PhoneProvisionFailure = {
  ok: false;
  code: string;
  message: string;
};

export type PhoneProvisionResult = PhoneProvisionSuccess | PhoneProvisionFailure;

function mockProvision(forwardTo: string | null): PhoneProvisionSuccess {
  return {
    ok: true,
    value: generatePhoneValue(),
    provider: "mock",
    providerSid: `mock_${randomBytes(8).toString("hex")}`,
    forwardTo,
  };
}

function twilioStubProvision(forwardTo: string | null): PhoneProvisionSuccess {
  return {
    ok: true,
    value: generatePhoneValue(),
    provider: "twilio",
    providerSid: `twilio_stub_${randomBytes(6).toString("hex")}`,
    forwardTo,
  };
}

/**
 * Provider-agnostic entry: env selects adapter; Twilio requires account SID for stub path.
 */
export function provisionPhoneAlias(forwardToE164: string | null): PhoneProvisionResult {
  const adapter = getPhoneAdapterId();

  if (adapter === "mock") {
    return mockProvision(forwardToE164);
  }

  if (adapter === "twilio") {
    if (!isTwilioConfigured()) {
      return {
        ok: false,
        code: "phone_provider_unavailable",
        message:
          "Phone provisioning is unavailable: set TWILIO_ACCOUNT_SID or use PHONE_PROVIDER=mock.",
      };
    }
    return twilioStubProvision(forwardToE164);
  }

  return mockProvision(forwardToE164);
}
