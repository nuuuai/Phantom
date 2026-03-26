/** Public phone adapter status (no secrets) — GET /api/phone/provider */
export interface PhoneProviderStatus {
  /** Resolved adapter id from env (e.g. mock, twilio). */
  provider: string;
  /** Whether the API can provision new phone aliases right now. */
  ready: boolean;
  /** How numbers are allocated in this deployment. */
  provisioningMode: "mock" | "twilio_stub" | "unavailable";
  /** Human-readable status for dashboard copy. */
  message: string;
  capabilities: {
    /** We persist `phoneForwardTo` for future PSTN routing. */
    forwardTargetStored: boolean;
    /** Live inbound PSTN (not Phase 1). */
    pstnInbound: boolean;
    /** SMS to dashboard inbox (not Phase 1). */
    smsInbound: boolean;
  };
}
