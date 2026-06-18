import type {
  CopilotConfirmResponse,
  CopilotPendingAction,
  CopilotToolId,
  CopilotToolIntent,
} from "@phantom/shared";
import {
  findBestRotationCandidate,
  rotateAliasForUser,
} from "../aliasRotate.js";
import { startBrokerScanForUser } from "../brokerScanStart.js";
import { isPaidTier } from "../userTierPaid.js";
import { prisma } from "../prisma.js";

export async function buildCopilotPendingAction(
  userId: string,
  intent: CopilotToolIntent
): Promise<CopilotPendingAction | null> {
  switch (intent.toolId) {
    case "start_broker_scan":
      return {
        toolId: "start_broker_scan",
        title: "Run broker exposure scan",
        description:
          "Scan the broker catalog for listings that may expose your personal data.",
        params: {},
      };

    case "rotate_alias": {
      const aliasIdFromParams =
        intent.params &&
        "aliasId" in intent.params &&
        typeof intent.params.aliasId === "string"
          ? intent.params.aliasId
          : null;

      if (aliasIdFromParams) {
        const alias = await prisma.alias.findFirst({
          where: { id: aliasIdFromParams, userId, isActive: true },
          select: { id: true, serviceName: true, healthStatus: true, type: true },
        });
        if (!alias || alias.type === "password") return null;
        return {
          toolId: "rotate_alias",
          title: `Rotate ${alias.serviceName ?? alias.id}`,
          description: `Quarantine the ${alias.healthStatus} ${alias.type} alias and generate a replacement.`,
          params: { aliasId: alias.id },
        };
      }

      const candidate = await findBestRotationCandidate(userId);
      if (!candidate) {
        return null;
      }
      return {
        toolId: "rotate_alias",
        title: `Rotate ${candidate.label}`,
        description: `Quarantine the ${candidate.healthStatus} ${candidate.type} alias and generate a replacement.`,
        params: { aliasId: candidate.id },
      };
    }

    case "request_broker_removals": {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !isPaidTier(user.tier)) {
        return null;
      }
      const latest = await prisma.brokerScanRun.findFirst({
        where: { userId },
        orderBy: { startedAt: "desc" },
      });
      if (!latest) return null;

      const foundCount = await prisma.brokerScanResult.count({
        where: {
          userId,
          brokerScanRunId: latest.id,
          status: "found",
        },
      });
      if (foundCount === 0) return null;

      return {
        toolId: "request_broker_removals",
        title: "Submit broker removal requests",
        description: `Request opt-out for ${foundCount} exposed broker listing(s) from your latest scan.`,
        params: {},
      };
    }

    default:
      return null;
  }
}

export type ExecuteCopilotActionResult =
  | { ok: true; data: CopilotConfirmResponse }
  | { ok: false; code: string; message: string; retryAfterSeconds?: number };

export async function executeCopilotAction(
  userId: string,
  toolId: CopilotToolId,
  params: CopilotToolIntent["params"] = {}
): Promise<ExecuteCopilotActionResult> {
  switch (toolId) {
    case "start_broker_scan": {
      const result = await startBrokerScanForUser(userId);
      if (!result.ok) {
        return {
          ok: false,
          code: result.code,
          message: result.message,
          retryAfterSeconds: result.retryAfterSeconds,
        };
      }
      return {
        ok: true,
        data: {
          message: `Broker scan complete — checked ${result.data.totalBrokers} brokers.`,
          scanId: result.data.scanId,
        },
      };
    }

    case "rotate_alias": {
      const aliasId =
        params && "aliasId" in params && typeof params.aliasId === "string"
          ? params.aliasId
          : null;
      if (!aliasId) {
        return {
          ok: false,
          code: "validation_error",
          message: "aliasId required",
        };
      }
      const result = await rotateAliasForUser(userId, aliasId);
      if (!result.ok) {
        return { ok: false, code: result.code, message: result.message };
      }
      return {
        ok: true,
        data: {
          message: `Alias rotated — new ${result.data.alias.type} alias is active.`,
          aliasId: result.data.alias.id,
        },
      };
    }

    case "request_broker_removals": {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !isPaidTier(user.tier)) {
        return {
          ok: false,
          code: "upgrade_required",
          message: "Data broker removal is available on Phantom Pro",
        };
      }
      const latest = await prisma.brokerScanRun.findFirst({
        where: { userId },
        orderBy: { startedAt: "desc" },
      });
      if (!latest) {
        return {
          ok: false,
          code: "no_scan",
          message: "Run a broker scan first",
        };
      }
      const updated = await prisma.brokerScanResult.updateMany({
        where: {
          userId,
          brokerScanRunId: latest.id,
          status: "found",
        },
        data: {
          status: "removal_submitted",
          removalSubmittedAt: new Date(),
        },
      });
      return {
        ok: true,
        data: {
          message: `Submitted ${updated.count} broker removal request(s).`,
          removalsSubmitted: updated.count,
        },
      };
    }

    default:
      return {
        ok: false,
        code: "unknown_tool",
        message: "Unsupported Copilot action",
      };
  }
}
