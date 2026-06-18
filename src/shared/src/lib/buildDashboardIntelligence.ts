import type {
  CopilotPrompt,
  InboxVolumeSpikeSignal,
  IntelligenceItem,
  PriorityAction,
  RiskFactor,
} from "../types/dashboardIntelligence.js";
import type { AliasRotationCandidate } from "../types/aliasRotation.js";
import { formatRotationCandidatesReply } from "./rankAliasesForRotation.js";

/** Inputs for Phase 1 heuristic intelligence (no ML). */
export type { InboxVolumeSpikeSignal };

/** Inputs for Phase 1 heuristic intelligence (no ML). */
export interface DashboardIntelligenceContext {
  activeAliases: number;
  aliasesHealthy: number;
  aliasesWarning: number;
  aliasesCompromised: number;
  brokersFound: number;
  brokersRemoved: number;
  brokersPending: number;
  brokersRelisted: number;
  darkWebAlerts: number;
  riskScore: number;
  hasBrokerScan: boolean;
  unreadInbox: number;
  passwordAliasCount: number;
  isPaidTier: boolean;
  metricsDemoMode: boolean;
  inboxPhishingCount: number;
  inboxSpamCount: number;
  daysSinceBrokerScan: number | null;
  topRelistedBrokerName: string | null;
  inboxVolumeSpike: InboxVolumeSpikeSignal | null;
  /** Best alias to rotate via Copilot (non-password). */
  rotationCandidateAliasId: string | null;
}

function clampScore(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function buildRiskFactors(ctx: DashboardIntelligenceContext): RiskFactor[] {
  const exposurePct =
    ctx.brokersFound > 0
      ? ((ctx.brokersFound - ctx.brokersRemoved) / ctx.brokersFound) * 100
      : ctx.hasBrokerScan
        ? 5
        : 40;

  const aliasTotal = Math.max(1, ctx.activeAliases);
  const unhealthyRatio =
    (ctx.aliasesWarning + ctx.aliasesCompromised * 2) / aliasTotal;
  const aliasHealthScore = clampScore(unhealthyRatio * 50);

  const breachScore = clampScore(Math.min(100, ctx.darkWebAlerts * 25));

  const callThreatScore = ctx.metricsDemoMode ? 18 : 0;

  const passwordScore =
    ctx.activeAliases === 0
      ? 55
      : ctx.passwordAliasCount === 0
        ? 45
        : clampScore(40 - (ctx.passwordAliasCount / aliasTotal) * 30);

  const darkWebScore = clampScore(Math.min(100, ctx.darkWebAlerts * 20));

  return [
    {
      id: "exposure",
      label: "Data exposure",
      score: clampScore(exposurePct),
      weight: 25,
      summary:
        ctx.brokersFound > 0
          ? `${ctx.brokersFound - ctx.brokersRemoved} broker(s) still listing your data`
          : ctx.hasBrokerScan
            ? "Scan complete — no broker listings found"
            : "No broker scan on record yet",
    },
    {
      id: "alias_health",
      label: "Alias health",
      score: aliasHealthScore,
      weight: 20,
      summary: `${ctx.aliasesHealthy} healthy · ${ctx.aliasesWarning} warning · ${ctx.aliasesCompromised} critical`,
    },
    {
      id: "breaches",
      label: "Breach exposure",
      score: breachScore,
      weight: 20,
      summary:
        ctx.darkWebAlerts > 0
          ? `${ctx.darkWebAlerts} open dark web alert(s)`
          : "No open breach alerts",
    },
    {
      id: "call_threats",
      label: "Call threats",
      score: callThreatScore,
      weight: 15,
      summary: ctx.metricsDemoMode
        ? "Demo telemetry — Call Guard not live"
        : "Call Guard not active — Phase 2",
    },
    {
      id: "password_hygiene",
      label: "Password hygiene",
      score: passwordScore,
      weight: 10,
      summary:
        ctx.passwordAliasCount > 0
          ? `${ctx.passwordAliasCount} vault password alias(es)`
          : "No password aliases in vault yet",
    },
    {
      id: "dark_web",
      label: "Dark web presence",
      score: darkWebScore,
      weight: 10,
      summary:
        ctx.isPaidTier
          ? ctx.darkWebAlerts > 0
            ? "Identifiers found in breach intelligence"
            : "Monitoring active — no open findings"
          : "Upgrade to Pro for dark web monitoring",
    },
  ];
}

export function buildPriorityActions(
  ctx: DashboardIntelligenceContext
): PriorityAction[] {
  const actions: PriorityAction[] = [];

  if (ctx.activeAliases === 0) {
    actions.push({
      id: "create_alias",
      title: "Create your first alias",
      description: "Generate a disposable email or username to shield your real identity.",
      layer: "shield",
      href: "/aliases",
      priority: 1,
    });
  }

  if (ctx.aliasesCompromised > 0) {
    actions.push({
      id: "rotate_compromised",
      title: "Rotate compromised aliases",
      description: `${ctx.aliasesCompromised} alias(es) need immediate rotation.`,
      layer: "shield",
      href: "/aliases",
      priority: 2,
    });
  }

  if (!ctx.hasBrokerScan) {
    actions.push({
      id: "run_broker_scan",
      title: "Run a broker exposure scan",
      description: "Discover which data brokers may be selling your personal information.",
      layer: "shield",
      href: "/brokers",
      priority: 3,
    });
  } else if (ctx.brokersPending > 0) {
    actions.push({
      id: "broker_removals",
      title: "Track broker removals",
      description: `${ctx.brokersPending} removal request(s) still pending confirmation.`,
      layer: "autopilot",
      href: "/brokers",
      priority: 4,
    });
  }

  if (ctx.brokersRelisted > 0) {
    actions.push({
      id: "broker_relisted",
      title: "Re-submit broker opt-outs",
      description: `${ctx.brokersRelisted} broker(s) re-listed your data — re-removal recommended.`,
      layer: "autopilot",
      href: "/brokers",
      priority: 5,
    });
  }

  if (ctx.darkWebAlerts > 0) {
    actions.push({
      id: "review_dark_web",
      title: "Review dark web findings",
      description: `${ctx.darkWebAlerts} open exposure alert(s) need your attention.`,
      layer: "brain",
      href: "/dark-web",
      priority: 6,
    });
  }

  if (ctx.unreadInbox > 5) {
    actions.push({
      id: "review_inbox",
      title: "Review alias inbox",
      description: `${ctx.unreadInbox} unread messages — check for phishing or list-sale patterns.`,
      layer: "brain",
      href: "/inbox",
      priority: 7,
    });
  }

  if (ctx.aliasesWarning > 0 && ctx.aliasesCompromised === 0) {
    actions.push({
      id: "monitor_warnings",
      title: "Monitor warning-state aliases",
      description: `${ctx.aliasesWarning} alias(es) showing early risk signals.`,
      layer: "brain",
      href: "/aliases",
      priority: 8,
    });
  }

  if (ctx.passwordAliasCount === 0 && ctx.activeAliases > 0) {
    actions.push({
      id: "setup_vault",
      title: "Add passwords to vault",
      description: "Store site credentials encrypted — improves password hygiene scoring.",
      layer: "shield",
      href: "/vault",
      priority: 9,
    });
  }

  return actions.sort((a, b) => a.priority - b.priority).slice(0, 5);
}

export function buildDailyBrief(ctx: DashboardIntelligenceContext): string[] {
  const lines: string[] = [];

  if (ctx.activeAliases === 0) {
    lines.push(
      "Your command center is ready, but no aliases are active yet. Create one to start shielding your identity."
    );
    return lines;
  }

  const posture =
    ctx.riskScore <= 24
      ? "strong"
      : ctx.riskScore <= 49
        ? "moderate"
        : ctx.riskScore <= 79
          ? "elevated"
          : "critical";

  lines.push(
    `Overall posture is ${posture} (risk score ${ctx.riskScore}). ${ctx.aliasesHealthy} of ${ctx.activeAliases} aliases are healthy.`
  );

  if (ctx.brokersFound > 0) {
    lines.push(
      `Broker removal: ${ctx.brokersRemoved} confirmed of ${ctx.brokersFound} exposures${ctx.brokersPending > 0 ? `, ${ctx.brokersPending} pending` : ""}.`
    );
  } else if (!ctx.hasBrokerScan) {
    lines.push("No broker scan completed — run one to map your data-broker exposure.");
  }

  if (ctx.darkWebAlerts > 0) {
    lines.push(
      `${ctx.darkWebAlerts} dark web alert(s) require review — check breach impact on linked aliases.`
    );
  } else if (ctx.isPaidTier) {
    lines.push("Dark web monitoring shows no open critical findings.");
  }

  if (ctx.unreadInbox > 0) {
    lines.push(
      `${ctx.unreadInbox} unread inbox message(s) — Phantom will flag suspicious patterns when you review them.`
    );
  }

  return lines.slice(0, 4);
}

export function buildIntelligenceItems(
  ctx: DashboardIntelligenceContext
): IntelligenceItem[] {
  const items: IntelligenceItem[] = [];

  if (ctx.inboxVolumeSpike) {
    const s = ctx.inboxVolumeSpike;
    items.push({
      id: "intel_inbox_spike",
      layer: "brain",
      label: "Inbox volume spike",
      description: `Your ${s.category} alias (${s.serviceLabel}) received ${s.multiplier}× normal email volume this week — possible list sale or spam campaign.`,
      confidence: Math.min(95, 60 + Math.round(s.multiplier * 8)),
      priority: 2,
      href: "/inbox",
      actionLabel: "Review inbox",
    });
  }

  if (ctx.aliasesCompromised > 0) {
    items.push({
      id: "intel_compromised",
      layer: "shield",
      label: "Alias compromise",
      description: `${ctx.aliasesCompromised} alias(es) in critical state — rotation recommended.`,
      confidence: 95,
      priority: 1,
      href: "/aliases",
      actionLabel: "Review aliases",
      quickAction: ctx.rotationCandidateAliasId
        ? {
            toolId: "rotate_alias",
            params: { aliasId: ctx.rotationCandidateAliasId },
          }
        : undefined,
    });
  }

  if (ctx.inboxPhishingCount >= 2) {
    items.push({
      id: "intel_phishing",
      layer: "brain",
      label: "Phishing patterns detected",
      description: `${ctx.inboxPhishingCount} recent inbox message(s) scored as phishing — review before clicking links.`,
      confidence: 84,
      priority: 3,
      href: "/inbox",
      actionLabel: "Open inbox",
    });
  }

  if (ctx.brokersRelisted > 0) {
    const brokerHint = ctx.topRelistedBrokerName
      ? `${ctx.topRelistedBrokerName} and others re-published your profile`
      : `${ctx.brokersRelisted} broker(s) re-published your profile after removal`;
    items.push({
      id: "intel_relisted",
      layer: "autopilot",
      label: "Re-listing detected",
      description: brokerHint,
      confidence: 88,
      priority: 4,
      href: "/brokers",
      actionLabel: "View brokers",
      quickAction:
        ctx.isPaidTier && ctx.brokersFound > ctx.brokersRemoved
          ? { toolId: "request_broker_removals" }
          : undefined,
    });
  }

  if (!ctx.hasBrokerScan && ctx.activeAliases > 0) {
    items.push({
      id: "intel_no_scan",
      layer: "brain",
      label: "Exposure unknown",
      description:
        "Without a broker scan, your data-broker footprint is unmapped. Run a scan to baseline exposure.",
      confidence: 92,
      priority: 5,
      href: "/brokers",
      actionLabel: "Run scan",
      quickAction: { toolId: "start_broker_scan" },
    });
  }

  if (
    ctx.daysSinceBrokerScan !== null &&
    ctx.daysSinceBrokerScan >= 14 &&
    ctx.hasBrokerScan
  ) {
    items.push({
      id: "intel_stale_scan",
      layer: "shield",
      label: "Broker scan overdue",
      description: `Last scan was ${ctx.daysSinceBrokerScan} days ago. Re-scan to catch new listings and re-listings.`,
      confidence: 78,
      priority: 6,
      href: "/brokers",
      actionLabel: "Re-scan",
      quickAction: { toolId: "start_broker_scan" },
    });
  }

  if (ctx.brokersPending > 0) {
    items.push({
      id: "intel_broker_pending",
      layer: "autopilot",
      label: "Removals awaiting confirmation",
      description: `${ctx.brokersPending} broker opt-out(s) still pending — confirm when brokers respond.`,
      confidence: 70,
      priority: 7,
      href: "/brokers",
      actionLabel: "Track removals",
    });
  }

  if (ctx.aliasesWarning > 0 && ctx.aliasesCompromised === 0) {
    items.push({
      id: "intel_alias_warning",
      layer: "brain",
      label: "Early risk signals",
      description: `${ctx.aliasesWarning} alias(es) in warning state — monitor inbox volume and consider rotation.`,
      confidence: 76,
      priority: 8,
      href: "/aliases",
      actionLabel: "Monitor aliases",
    });
  }

  if (ctx.darkWebAlerts > 0) {
    items.push({
      id: "intel_dark_web",
      layer: "brain",
      label: "Breach exposure active",
      description: `${ctx.darkWebAlerts} identifier(s) matched in breach intelligence feeds.`,
      confidence: 90,
      priority: 9,
      href: "/dark-web",
      actionLabel: "Review findings",
    });
  }

  if (ctx.unreadInbox >= 10 && !ctx.inboxVolumeSpike) {
    items.push({
      id: "intel_inbox_volume",
      layer: "brain",
      label: "High unread volume",
      description: `${ctx.unreadInbox} unread messages may indicate list sale or spam campaign.`,
      confidence: 72,
      priority: 10,
      href: "/inbox",
      actionLabel: "Open inbox",
    });
  }

  if (ctx.inboxSpamCount >= 5) {
    items.push({
      id: "intel_spam",
      layer: "shield",
      label: "Spam velocity elevated",
      description: `${ctx.inboxSpamCount} spam-like messages in recent inbox sample — alias health may degrade.`,
      confidence: 68,
      priority: 11,
      href: "/inbox",
      actionLabel: "Review spam",
    });
  }

  if (ctx.passwordAliasCount === 0 && ctx.activeAliases > 0) {
    items.push({
      id: "intel_vault_empty",
      layer: "shield",
      label: "Password hygiene gap",
      description:
        "No vault passwords stored — add credentials to improve hygiene scoring and reuse detection.",
      confidence: 65,
      priority: 12,
      href: "/vault",
      actionLabel: "Open vault",
    });
  }

  if (!ctx.metricsDemoMode && ctx.activeAliases > 0) {
    items.push({
      id: "intel_call_guard",
      layer: "brain",
      label: "Call Guard preview",
      description:
        "Phone scam patterns are rising in your region. Call Guard screens unknown callers with AI (preview).",
      confidence: 55,
      priority: 20,
      href: "/call-guard",
      actionLabel: "Preview Call Guard",
    });
  }

  return items
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 8);
}

export function buildCopilotPrompts(): CopilotPrompt[] {
  return [
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
  ];
}

export function resolveCopilotResponse(
  prompt: string,
  ctx: DashboardIntelligenceContext & {
    riskFactors: readonly RiskFactor[];
    rotationCandidates?: readonly AliasRotationCandidate[];
  }
): string {
  const normalized = prompt.trim().toLowerCase();

  if (
    normalized.includes("risk score") ||
    normalized.includes("why is my risk")
  ) {
    const top = [...ctx.riskFactors].sort((a, b) => b.score - a.score)[0];
    const factors = ctx.riskFactors
      .map((f) => `${f.label}: ${f.score}/100 (${f.summary})`)
      .join("\n• ");
    return `Your risk score is ${ctx.riskScore}/100.\n\nTop driver: ${top?.label ?? "N/A"} (${top?.score ?? 0}/100).\n\nFactor breakdown:\n• ${factors}\n\nPhase 1 uses heuristics — the full ML Brain model ships in Phase 2.`;
  }

  if (normalized.includes("rotate") || normalized.includes("compromised")) {
    const candidates = ctx.rotationCandidates ?? [];
    if (candidates.length > 0) {
      return formatRotationCandidatesReply(candidates);
    }
    if (ctx.aliasesCompromised > 0) {
      return `Rotate ${ctx.aliasesCompromised} compromised alias(es) first — they are in critical state. Then review ${ctx.aliasesWarning} warning alias(es) on the Aliases page.`;
    }
    if (ctx.aliasesWarning > 0) {
      return `${ctx.aliasesWarning} alias(es) are in warning state. Monitor inbox volume and consider rotation if spam increases. No critical compromises right now.`;
    }
    return "All active aliases are healthy. No rotation needed unless you suspect a specific service leak.";
  }

  if (normalized.includes("summarize") || normalized.includes("summary")) {
    return buildDailyBrief(ctx).join("\n\n");
  }

  if (normalized.includes("next") || normalized.includes("should i do")) {
    const actions = buildPriorityActions(ctx);
    if (actions.length === 0) {
      return "You're in good shape. Keep monitoring inbox and dark web alerts, and re-scan brokers every few weeks.";
    }
    return actions
      .slice(0, 3)
      .map((a, i) => `${i + 1}. ${a.title} — ${a.description}`)
      .join("\n\n");
  }

  if (normalized.includes("broker") || normalized.includes("removal")) {
    if (!ctx.hasBrokerScan) {
      return "No broker scan on record. Run your first scan from Broker removal to map exposures.";
    }
    return `Brokers: ${ctx.brokersRemoved} removed, ${ctx.brokersPending} pending, ${ctx.brokersRelisted} re-listed of ${ctx.brokersFound} found.`;
  }

  return "I can explain your risk score, recommend rotations, summarize your posture, or suggest next steps. Try one of the suggested prompts above.";
}
