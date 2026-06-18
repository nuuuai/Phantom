export interface CallGuardActiveSession {
  sessionId: string;
  callerLabel: string;
  scamConfidence: number;
  phase: "ringing" | "screening" | "transcript";
  startedAt: string;
  demoMode: true;
}
