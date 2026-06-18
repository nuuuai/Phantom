import type { CallGuardDecision } from "./callGuard.js";

export type CallGuardLivePhase =
  | "ringing"
  | "screening"
  | "transcript"
  | "decision"
  | "complete";

export interface CallGuardLiveEvent {
  phase: CallGuardLivePhase;
  transcriptChunk: string | null;
  scamConfidence: number;
  decision: CallGuardDecision | null;
  callerLabel: string;
  elapsedMs: number;
  demoMode: true;
}
