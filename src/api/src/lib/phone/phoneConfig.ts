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
 * When `PHONE_PROVIDER` is set to a value other than `mock` / `twilio`, we still use the mock
 * adapter but surface a non-fatal warning (ready stays true).
 */
export function getPhoneProviderEnvWarning(): string | null {
  const raw = process.env.PHONE_PROVIDER?.trim();
  if (!raw) return null;
  const m = raw.toLowerCase();
  if (m === "mock" || m === "twilio") return null;
  return `Unknown PHONE_PROVIDER="${raw}"; using mock adapter.`;
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
    const envWarn = getPhoneProviderEnvWarning();
    const baseMsg =
      "Mock mode: +1-555 numbers only. No carrier. Safe for local development.";
    return {
      provider: "mock",
      ready: true,
      provisioningMode: "mock",
      message: envWarn ? `${envWarn} ${baseMsg}` : baseMsg,
      lastError: envWarn,
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
      lastError:
        "TWILIO_ACCOUNT_SID is not set; phone provisioning is unavailable until configured.",
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
    lastError: null,
    capabilities: {
      forwardTargetStored: true,
      pstnInbound: false,
      smsInbound: false,
    },
  };
}
