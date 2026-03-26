import type {
  ApiResponse,
  DarkWebFindingPublic,
  DarkWebFindingsListResponse,
  DarkWebFindingsSummary,
  DarkWebRefreshResult,
} from "@phantom/shared";
import { Router } from "express";
import { runHibpDarkWebRefresh } from "../lib/darkWebHibpRefresh.js";
import { insertDarkWebFindingWithNotification } from "../lib/darkWebIngest.js";
import { mapDarkWebFinding } from "../lib/mapDarkWebFinding.js";
import { prisma } from "../lib/prisma.js";
import { isPaidTier } from "../lib/userTierPaid.js";

export const darkWebRouter = Router();

async function requirePaidTier(
  userId: string
): Promise<
  | { ok: true }
  | { ok: false; status: number; body: ApiResponse<never> }
> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return {
      ok: false,
      status: 404,
      body: {
        ok: false,
        error: { code: "not_found", message: "User not found" },
      },
    };
  }
  if (!isPaidTier(user.tier)) {
    return {
      ok: false,
      status: 403,
      body: {
        ok: false,
        error: {
          code: "upgrade_required",
          message:
            "Dark web monitoring is included with Phantom Pro. Upgrade to run breach checks and track exposures.",
        },
      },
    };
  }
  return { ok: true };
}

function emptySummary(tierGated: boolean): DarkWebFindingsSummary {
  return {
    openCount: 0,
    bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
    tierGated,
  };
}

darkWebRouter.get("/summary", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "User not found" },
    });
    return;
  }

  if (!isPaidTier(user.tier)) {
    const response: ApiResponse<DarkWebFindingsSummary> = {
      ok: true,
      data: emptySummary(true),
    };
    res.json(response);
    return;
  }

  const open = await prisma.darkWebFinding.findMany({
    where: { userId, status: "open" },
    select: { severity: true },
  });
  const bySeverity = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
  for (const r of open) {
    bySeverity[r.severity] += 1;
  }

  const response: ApiResponse<DarkWebFindingsSummary> = {
    ok: true,
    data: {
      openCount: open.length,
      bySeverity,
      tierGated: false,
    },
  };
  res.json(response);
});

darkWebRouter.get("/findings", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const limit = Math.min(Math.max(1, Number(req.query.limit) || 50), 200);
  const offset = Math.max(0, Number(req.query.offset) || 0);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "User not found" },
    });
    return;
  }

  if (!isPaidTier(user.tier)) {
    const response: ApiResponse<DarkWebFindingsListResponse> = {
      ok: true,
      data: {
        items: [],
        tierGated: true,
        total: 0,
        limit,
        offset,
      },
    };
    res.json(response);
    return;
  }

  const total = await prisma.darkWebFinding.count({ where: { userId } });
  const rows = await prisma.darkWebFinding.findMany({
    where: { userId },
    orderBy: { detectedAt: "desc" },
    skip: offset,
    take: limit,
  });

  const payload: DarkWebFindingsListResponse = {
    items: rows.map(mapDarkWebFinding),
    tierGated: false,
    total,
    limit,
    offset,
  };

  const response: ApiResponse<DarkWebFindingsListResponse> = {
    ok: true,
    data: payload,
  };
  res.json(response);
});

darkWebRouter.patch("/findings/:id", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const gate = await requirePaidTier(userId);
  if (!gate.ok) {
    res.status(gate.status).json(gate.body);
    return;
  }

  const body = req.body as { status?: unknown };
  const st = body.status;
  const dismiss =
    st === "dismissed" || st === "acknowledged";
  if (!dismiss) {
    res.status(400).json({
      ok: false,
      error: {
        code: "validation_error",
        message:
          'Body must be JSON { "status": "dismissed" } or { "status": "acknowledged" }',
      },
    });
    return;
  }

  const id = req.params.id;
  const row = await prisma.darkWebFinding.findFirst({
    where: { id, userId },
  });
  if (!row) {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "Finding not found" },
    });
    return;
  }

  const updated = await prisma.darkWebFinding.update({
    where: { id: row.id },
    data: {
      status: "dismissed",
      dismissedAt: new Date(),
    },
  });

  const response: ApiResponse<{ finding: DarkWebFindingPublic }> = {
    ok: true,
    data: { finding: mapDarkWebFinding(updated) },
  };
  res.json(response);
});

darkWebRouter.post("/refresh", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const gate = await requirePaidTier(userId);
  if (!gate.ok) {
    res.status(gate.status).json(gate.body);
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "User not found" },
    });
    return;
  }

  const result = await runHibpDarkWebRefresh({
    userId,
    accountEmail: user.email,
  });

  const payload: DarkWebRefreshResult = {
    inserted: result.inserted,
    skippedNoApiKey: result.skippedNoApiKey,
    message: result.message,
  };

  const response: ApiResponse<DarkWebRefreshResult> = { ok: true, data: payload };
  res.json(response);
});

/** Dev/staging: seed demo findings for paid users (disabled in production). */
darkWebRouter.post("/seed-demo", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  if (process.env.NODE_ENV === "production") {
    res.status(403).json({
      ok: false,
      error: {
        code: "forbidden",
        message: "Dark web demo seed is disabled in production",
      },
    });
    return;
  }

  const gate = await requirePaidTier(userId);
  if (!gate.ok) {
    res.status(gate.status).json(gate.body);
    return;
  }

  const existing = await prisma.darkWebFinding.count({ where: { userId } });
  if (existing > 0) {
    const response: ApiResponse<{ seeded: number }> = {
      ok: true,
      data: { seeded: 0 },
    };
    res.json(response);
    return;
  }

  await insertDarkWebFindingWithNotification({
    userId,
    severity: "medium",
    title: "Demo: sample breach exposure (seed)",
    summary:
      "This is a seeded demo row for local development. It does not reflect a live API check. Source label is synthetic.",
    sourceLabel: "Demo seed",
    breachName: "DemoBreach",
    identifierType: "email_address",
    identifierDisplay: "d***@phantom.local",
    recommendedAction:
      "Dismiss this row after testing. Run “Check exposures” when HIBP is configured for real data.",
    detectedAt: new Date(),
    dedupeKey: "demo:seed-1",
  });

  const response: ApiResponse<{ seeded: number }> = {
    ok: true,
    data: { seeded: 1 },
  };
  res.status(201).json(response);
});
