import type {
  ScamEngagementSession,
  ScamEngagementSummary,
  ScamPersonaId,
  ScamTranscriptLine,
} from "../types/scamEngage.js";
import { createSeededRandom, hashUserSeed } from "./hashUserSeed.js";

interface PersonaTemplate {
  id: ScamPersonaId;
  label: string;
  scamType: string;
  durationMin: number;
  durationMax: number;
  transcript: readonly ScamTranscriptLine[];
  intel: readonly string[];
}

const PERSONAS: readonly PersonaTemplate[] = [
  {
    id: "confused_retiree",
    label: "Confused Retiree",
    scamType: "IRS / Medicare impersonation",
    durationMin: 12 * 60,
    durationMax: 18 * 60,
    intel: [
      "Callback number uses VoIP prefix pattern",
      "Script references expired SSN suspension",
      "Payment requested via gift cards",
    ],
    transcript: [
      { speaker: "scammer", text: "This is the IRS. Your social is suspended.", timestampOffsetSec: 0 },
      { speaker: "phantom", text: "I'm sorry, could you repeat that? My hearing aid is buzzing.", timestampOffsetSec: 8 },
      { speaker: "scammer", text: "You owe back taxes. Pay today or face arrest.", timestampOffsetSec: 22 },
      { speaker: "phantom", text: "My grandson handles the taxes. Let me find his number…", timestampOffsetSec: 45 },
      { speaker: "scammer", text: "No — you must pay now with gift cards.", timestampOffsetSec: 90 },
      { speaker: "phantom", text: "Gift cards? At the pharmacy? Which aisle again?", timestampOffsetSec: 120 },
    ],
  },
  {
    id: "nervous_newbie",
    label: "Nervous Newbie",
    scamType: "Tech support remote access",
    durationMin: 15 * 60,
    durationMax: 25 * 60,
    intel: [
      "Remote desktop tool suggested (non-brand)",
      "Caller claims Microsoft security division",
      "Urgency tied to expired Windows license",
    ],
    transcript: [
      { speaker: "scammer", text: "Microsoft security — we detected a virus on your PC.", timestampOffsetSec: 0 },
      { speaker: "phantom", text: "Oh no! Where is the start menu again? I'm on the laptop.", timestampOffsetSec: 12 },
      { speaker: "scammer", text: "Press Windows key and R, type the support code.", timestampOffsetSec: 35 },
      { speaker: "phantom", text: "I pressed something and now the screen went black!", timestampOffsetSec: 70 },
      { speaker: "scammer", text: "Stay calm. Download our repair tool.", timestampOffsetSec: 95 },
      { speaker: "phantom", text: "It says administrator password — I never set one?", timestampOffsetSec: 140 },
    ],
  },
  {
    id: "interested_buyer",
    label: "Interested Buyer",
    scamType: "Extended warranty / auto services",
    durationMin: 8 * 60,
    durationMax: 15 * 60,
    intel: [
      "Warranty vendor name mismatches DMV records pattern",
      "Payment plan offered without vehicle VIN verification",
      "Script loops on spouse approval delay tactic",
    ],
    transcript: [
      { speaker: "scammer", text: "Your vehicle warranty is expiring today.", timestampOffsetSec: 0 },
      { speaker: "phantom", text: "Which car? We have two — the blue one or the sedan?", timestampOffsetSec: 10 },
      { speaker: "scammer", text: "The 2019 model. Coverage ends at midnight.", timestampOffsetSec: 28 },
      { speaker: "phantom", text: "That sounds important. I need to check with my spouse first.", timestampOffsetSec: 55 },
      { speaker: "scammer", text: "This offer is one-time only — lock it in now.", timestampOffsetSec: 80 },
      { speaker: "phantom", text: "She's at the store. Can you explain the platinum tier again?", timestampOffsetSec: 110 },
    ],
  },
];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function buildSession(
  template: PersonaTemplate,
  index: number,
  rand: () => number
): ScamEngagementSession {
  const span = template.durationMax - template.durationMin;
  const durationSec = template.durationMin + Math.floor(rand() * span);
  const engagementScore = Math.round(65 + rand() * 30);

  return {
    id: `see-demo-${template.id}-${index + 1}`,
    personaId: template.id,
    personaLabel: template.label,
    scamType: template.scamType,
    durationSec,
    engagementScore,
    intelExtracted: template.intel,
    transcript: template.transcript,
    startedAt: isoDaysAgo(index + 1),
    complaintFiled: rand() > 0.35,
  };
}

/** Three SEE personas per spec — deterministic ordering from user id when demo enabled. */
export function generateScamEngageDemo(
  userId: string,
  demoMode: boolean
): ScamEngagementSummary {
  if (!demoMode) {
    return {
      totalSessions: 0,
      totalMinutesWasted: 0,
      complaintsFiled: 0,
      sessions: [],
      demoMode: false,
    };
  }

  const rand = createSeededRandom(hashUserSeed(`${userId}:see`));
  const sessions = PERSONAS.map((p, i) => buildSession(p, i, rand));

  const totalMinutesWasted = Math.round(
    sessions.reduce((s, x) => s + x.durationSec, 0) / 60
  );
  const complaintsFiled = sessions.filter((s) => s.complaintFiled).length;

  return {
    totalSessions: sessions.length,
    totalMinutesWasted,
    complaintsFiled,
    sessions,
    demoMode: true,
  };
}

export function generateScamEngageDemoSessions(
  userId: string
): ScamEngagementSession[] {
  return [...generateScamEngageDemo(userId, true).sessions];
}

export const SCAM_ENGAGE_PERSONA_IDS = PERSONAS.map((p) => p.id);
