import { classifyInboxMessage, generateScamEngageDemo } from "@phantom/shared";
import {
  adjustPhishingScoreForSensitivity,
  resolvePhishingQuarantineThreshold,
} from "@phantom/shared";
import { findBestRotationCandidate, rotateAliasForUser } from "./aliasRotate.js";
import { submitBrokerRemovalsForUser } from "./submitBrokerRemovals.js";
import { isOverviewDemoMetricsEnabled } from "./envOverviewDemo.js";
import { prisma } from "./prisma.js";
import { isPaidTier } from "./userTierPaid.js";

type AutopilotLogKind =
  | "alias_rotated"
  | "alias_warning"
  | "broker_removal_submitted"
  | "ftc_complaint_queued"
  | "breach_playbook_triggered";

export interface AutopilotTickResult {
  rotatedAliasId: string | null;
  quarantinedAliasIds: readonly string[];
  brokerRemovalsSubmitted: number;
  breachPlaybooksTriggered: number;
  ftcComplaintsQueued: number;
}

async function logAutopilotAction(
  userId: string,
  kind: AutopilotLogKind,
  title: string,
  description: string,
  refId: string | null
): Promise<void> {
  await prisma.autopilotActionLog.create({
    data: { userId, kind, title, description, refId },
  });
}

async function hasRecentAutopilotLog(
  userId: string,
  kind: AutopilotLogKind,
  refId: string,
  withinHours = 24
): Promise<boolean> {
  const since = new Date(Date.now() - withinHours * 3_600_000);
  const row = await prisma.autopilotActionLog.findFirst({
    where: { userId, kind, refId, createdAt: { gte: since } },
    select: { id: true },
  });
  return row !== null;
}

/** Runs autonomous Shield/Autopilot actions when user prefs allow (Phase 1). */
export async function runAutopilotTick(userId: string): Promise<AutopilotTickResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      tier: true,
      autopilotAutoRotate: true,
      autopilotAutoQuarantine: true,
      autopilotAutoRemoval: true,
      autopilotAutoComplaint: true,
      aiSensitivity: true,
    },
  });

  if (!user) {
    return {
      rotatedAliasId: null,
      quarantinedAliasIds: [],
      brokerRemovalsSubmitted: 0,
      breachPlaybooksTriggered: 0,
      ftcComplaintsQueued: 0,
    };
  }

  let rotatedAliasId: string | null = null;
  const quarantinedAliasIds: string[] = [];
  let brokerRemovalsSubmitted = 0;
  let breachPlaybooksTriggered = 0;
  let ftcComplaintsQueued = 0;

  const quarantineThreshold = resolvePhishingQuarantineThreshold(user.aiSensitivity);

  if (user.autopilotAutoRotate) {
    const candidate = await findBestRotationCandidate(userId);
    if (
      candidate &&
      (candidate.healthStatus === "compromised" ||
        candidate.healthStatus === "quarantined")
    ) {
      const result = await rotateAliasForUser(userId, candidate.id);
      if (result.ok) {
        rotatedAliasId = result.data.alias.id;
        await logAutopilotAction(
          userId,
          "alias_rotated",
          "Alias auto-rotated",
          `Autopilot quarantined ${candidate.label} (${candidate.type}) and issued a replacement.`,
          result.data.previousId
        );
      }
    }
  }

  if (user.autopilotAutoQuarantine) {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 7);

    const messages = await prisma.aliasInboxMessage.findMany({
      where: { userId, receivedAt: { gte: since } },
      orderBy: { receivedAt: "desc" },
      take: 100,
      select: {
        id: true,
        aliasId: true,
        subject: true,
        fromAddress: true,
        snippet: true,
      },
    });

    const aliasHits = new Map<string, number>();

    for (const msg of messages) {
      const c = classifyInboxMessage({
        messageId: msg.id,
        subject: msg.subject,
        fromAddress: msg.fromAddress,
        snippet: msg.snippet,
      });
      const adjustedScore = adjustPhishingScoreForSensitivity(
        c.phishingScore,
        user.aiSensitivity
      );
      if (c.category === "phishing" && adjustedScore >= quarantineThreshold) {
        aliasHits.set(msg.aliasId, (aliasHits.get(msg.aliasId) ?? 0) + 1);
      }
    }

    for (const [aliasId, hitCount] of aliasHits) {
      const alias = await prisma.alias.findFirst({
        where: { id: aliasId, userId, isActive: true },
        select: {
          id: true,
          healthStatus: true,
          spamCount: true,
          serviceName: true,
          category: true,
        },
      });
      if (!alias || alias.healthStatus === "compromised") continue;

      await prisma.alias.update({
        where: { id: alias.id },
        data: {
          healthStatus: "warning",
          spamCount: alias.spamCount + hitCount,
          lastActivityAt: new Date(),
        },
      });
      quarantinedAliasIds.push(alias.id);

      const label = alias.serviceName ?? alias.category;
      await logAutopilotAction(
        userId,
        "alias_warning",
        "Inbox threat flagged",
        `Autopilot marked ${label} as warning after ${hitCount} high-confidence phishing signal(s).`,
        alias.id
      );
    }
  }

  if (user.autopilotAutoRemoval && isPaidTier(user.tier)) {
    const removal = await submitBrokerRemovalsForUser(userId);
    if (removal.ok) {
      brokerRemovalsSubmitted = removal.count;
      await logAutopilotAction(
        userId,
        "broker_removal_submitted",
        "Broker removals auto-submitted",
        `Autopilot queued opt-out for ${removal.count} exposed broker listing(s) from your latest scan.`,
        removal.scanId
      );
    }
  }

  if (user.autopilotAutoRotate && isPaidTier(user.tier)) {
    const criticalFindings = await prisma.darkWebFinding.findMany({
      where: {
        userId,
        status: "open",
        severity: { in: ["critical", "high"] },
      },
      orderBy: { detectedAt: "desc" },
      take: 3,
      select: { id: true, title: true, severity: true },
    });

    for (const finding of criticalFindings) {
      const already = await hasRecentAutopilotLog(
        userId,
        "breach_playbook_triggered",
        finding.id
      );
      if (already) continue;

      await logAutopilotAction(
        userId,
        "breach_playbook_triggered",
        "Breach response playbook",
        `Autopilot queued remediation steps for ${finding.severity} finding — review vault and aliases.`,
        finding.id
      );
      breachPlaybooksTriggered += 1;
    }
  }

  if (user.autopilotAutoComplaint && isOverviewDemoMetricsEnabled()) {
    const demo = generateScamEngageDemo(userId, true);
    for (const session of demo.sessions) {
      if (session.complaintFiled || session.engagementScore < 75) continue;
      const already = await hasRecentAutopilotLog(
        userId,
        "ftc_complaint_queued",
        session.id,
        168
      );
      if (already) continue;

      await logAutopilotAction(
        userId,
        "ftc_complaint_queued",
        "FTC complaint queued",
        `Autopilot prepared an FTC report stub for ${session.scamType} session (${session.personaLabel}).`,
        session.id
      );
      ftcComplaintsQueued += 1;
    }
  }

  return {
    rotatedAliasId,
    quarantinedAliasIds,
    brokerRemovalsSubmitted,
    breachPlaybooksTriggered,
    ftcComplaintsQueued,
  };
}
