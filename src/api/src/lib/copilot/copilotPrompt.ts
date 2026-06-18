import type {
  CopilotPrompt,
  PriorityAction,
  RiskFactor,
} from "@phantom/shared";

/** Sanitized account snapshot for LLM — no emails, alias values, or passwords. */
export interface CopilotAccountSnapshot {
  tier: string;
  riskScore: number;
  riskFactors: readonly RiskFactor[];
  priorityActions: readonly PriorityAction[];
  dailyBrief: readonly string[];
  activeAliases: number;
  aliasesHealthy: number;
  aliasesWarning: number;
  aliasesCompromised: number;
  passwordAliasCount: number;
  brokersFound: number;
  brokersRemoved: number;
  brokersPending: number;
  brokersRelisted: number;
  hasBrokerScan: boolean;
  darkWebAlerts: number;
  unreadInbox: number;
  metricsDemoMode: boolean;
  /** 0–100 — higher = more aggressive threat recommendations. */
  aiSensitivity: number;
}

export function buildCopilotSystemPrompt(snapshot: CopilotAccountSnapshot): string {
  return `You are Phantom Copilot, the Brain layer of an AI privacy operations center.

RULES:
- Answer ONLY using the ACCOUNT SNAPSHOT JSON below. Do not invent metrics.
- Never ask for or repeat passwords, full emails, phone numbers, or alias values.
- Be concise (2–5 short paragraphs max). Use plain language.
- Reference Phantom layers when relevant: Shield (defense), Brain (intelligence), Sword (scam counter-ops), Autopilot (automation).
- If the user asks to perform an action (rotate alias, run scan), you may call the available tools — the dashboard will show a Confirm button; never claim an action ran without confirmation.
- Available tools: start_broker_scan, rotate_alias (optional aliasId), request_broker_removals.
- If data is missing (e.g. no broker scan), say so and recommend the action.
- User AI sensitivity is ${snapshot.aiSensitivity}/100 — higher values mean more aggressive phishing and quarantine recommendations; calibrate urgency accordingly.

ACCOUNT SNAPSHOT:
${JSON.stringify(snapshot, null, 2)}`;
}

export function buildCopilotUserMessage(message: string): string {
  return message.trim().slice(0, 2000);
}

export const DEFAULT_COPILOT_PROMPTS: readonly CopilotPrompt[] = [
  {
    id: "risk_why",
    label: "Why this risk score?",
    prompt: "Why is my risk score what it is?",
  },
  {
    id: "rotate_which",
    label: "What to rotate?",
    prompt: "Which aliases should I rotate?",
  },
  {
    id: "week_summary",
    label: "Summarize my week",
    prompt: "Summarize my privacy posture this week",
  },
  {
    id: "next_steps",
    label: "What should I do next?",
    prompt: "What should I do next?",
  },
] as const;
