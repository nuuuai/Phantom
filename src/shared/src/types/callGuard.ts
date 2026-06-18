export type CallGuardDecision = "pass" | "screen" | "block" | "engage";

export interface CallGuardCallLog {
  id: string;
  /** Anonymized caller fingerprint — never a raw phone number. */
  callerNumberHash: string;
  callerLabel: string;
  scamConfidence: number;
  decision: CallGuardDecision;
  durationSec: number;
  transcriptPreview: string | null;
  occurredAt: string;
}

export interface CallGuardSummary {
  totalScreened: number;
  scamsBlocked: number;
  scamsEngaged: number;
  avgScamConfidence: number;
  recentLogs: readonly CallGuardCallLog[];
  demoMode: boolean;
}
