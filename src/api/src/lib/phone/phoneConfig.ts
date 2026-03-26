import type { PhoneProviderStatus } from "@phantom/shared";

export type PhoneAdapterId = "mock" | "twilio";

/**
 * Reads `PHONE_PROVIDER` (default mock). Unknown values fall back to mock with a note in status.
 */
export function getPhoneAdapterId(): PhoneAdapterId {
  const m = process.env.PHONE_PROVIDER?.trim().toLowerCase();
  if (m === "twilio") return "twilio";
  return "mock";
}

export function getTwilioAccountSid(): string | null {
  const s = process.env.TWILIO_ACCOUNT_SID?.trim();
  return s && s.length > 0 ? s : null;
}

/**
 * Twilio adapter is "configured" when account SID is present (auth token needed for real API later).
 */
export function isTwilioConfigured(): boolean {
  return getTwilioAccountSid() !== null;
}

/** Alias for older call sites; same as {@link getPhoneAdapterId}. */
export function getPhoneProviderMode(): PhoneAdapterId {
  return getPhoneAdapterId();
}

export function getPhoneProviderPublicStatus(): PhoneProviderStatus {
  const id = getPhoneAdapterId();
  const twilioOk = isTwilioConfigured();

  if (id === "mock") {
    return {
      provider: "mock",
      ready: true,
      provisioningMode: "mock",
      message:
        "Mock mode: +1-555 numbers only. No carrier. Safe for local development.",
      capabilities: {
        forwardTargetStored: true,
        pstnInbound: false,
        smsInbound: false,
      },
    };
  }

  if (id === "twilio" && !twilioOk) {
    return {
      provider: "twilio",
      ready: false,
      provisioningMode: "unavailable",
      message:
        "PHONE_PROVIDER=twilio but TWILIO_ACCOUNT_SID is missing. Set it or use PHONE_PROVIDER=mock.",
      capabilities: {
        forwardTargetStored: true,
        pstnInbound: false,
        smsInbound: false,
      },
    };
  }

  return {
    provider: "twilio",
    ready: true,
    provisioningMode: "twilio_stub",
    message:
      "Twilio stub: numbers and SIDs are simulated. Real Number API + PSTN/SMS are not wired in Phase 1.",
    capabilities: {
      forwardTargetStored: true,
      pstnInbound: false,
      smsInbound: false,
    },
  };
}
