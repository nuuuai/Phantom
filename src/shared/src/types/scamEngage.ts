export type ScamPersonaId =
  | "confused_retiree"
  | "nervous_newbie"
  | "interested_buyer";

export interface ScamTranscriptLine {
  speaker: "phantom" | "scammer";
  text: string;
  timestampOffsetSec: number;
}

export interface ScamEngagementSession {
  id: string;
  personaId: ScamPersonaId;
  personaLabel: string;
  scamType: string;
  durationSec: number;
  engagementScore: number;
  intelExtracted: readonly string[];
  transcript: readonly ScamTranscriptLine[];
  startedAt: string;
  complaintFiled: boolean;
  /** Autopilot queued an FTC stub for this session (demo + pref enabled). */
  autopilotComplaintQueued?: boolean;
}

export interface ScamEngagementSummary {
  totalSessions: number;
  totalMinutesWasted: number;
  complaintsFiled: number;
  /** Sessions with Autopilot FTC queue stubs not yet marked filed. */
  autopilotComplaintsQueued?: number;
  sessions: readonly ScamEngagementSession[];
  demoMode: boolean;
}
