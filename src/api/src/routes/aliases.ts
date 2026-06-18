import type {
  AliasCategory,
  AliasType,
  ApiResponse,
  GenerateAliasRequest,
  HealthStatus,
  PatchAliasRequest,
} from "@phantom/shared";
import { Router } from "express";
import type {
  AliasCategory as PrismaAliasCategory,
  AliasType as PrismaAliasType,
} from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { generateAliasForUser } from "../lib/generateAliasForUser.js";
import { rotateAliasForUser } from "../lib/aliasRotate.js";
import { mapAliasToDto } from "../lib/mapAlias.js";

export const aliasesRouter = Router();

const CATEGORY_SET = new Set<string>([
  "shopping",
  "social",
  "finance",
  "work",
  "dating",
  "newsletter",
  "temp",
]);

const TYPE_SET = new Set<string>(["email", "phone", "username", "password"]);

const HEALTH_SET = new Set<string>([
  "healthy",
  "warning",
  "compromised",
  "quarantined",
]);

function parseCategory(v: string | undefined): PrismaAliasCategory | undefined {
  if (!v || !CATEGORY_SET.has(v)) return undefined;
  return v as PrismaAliasCategory;
}

function parseHealth(v: string | undefined): HealthStatus | undefined {
  if (!v || !HEALTH_SET.has(v)) return undefined;
  return v as HealthStatus;
}

aliasesRouter.get("/", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const category = parseCategory(
    typeof req.query.category === "string" ? req.query.category : undefined
  );
  const health = parseHealth(
    typeof req.query.health === "string" ? req.query.health : undefined
  );
  const includeInactive = req.query.includeInactive === "true";

  const rows = await prisma.alias.findMany({
    where: {
      userId,
      ...(includeInactive ? {} : { isActive: true }),
      ...(category ? { category } : {}),
      ...(health ? { healthStatus: health } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const response: ApiResponse<{ userId: string; items: ReturnType<typeof mapAliasToDto>[] }> =
    {
      ok: true,
      data: { userId, items: rows.map(mapAliasToDto) },
    };
  res.json(response);
});

aliasesRouter.post("/generate", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const userRow = await prisma.user.findUnique({ where: { id: userId } });
  if (!userRow) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "User not found" },
    });
    return;
  }

  const result = await generateAliasForUser(
    userId,
    userRow.tier,
    req.body as GenerateAliasRequest
  );

  if (!result.ok) {
    const status =
      result.code === "tier_limit"
        ? 403
        : result.code === "phone_unavailable"
          ? 503
          : 400;
    res.status(status).json({
      ok: false,
      error: {
        code: result.code,
        message: result.message,
        ...(result.tierLimit ? { tierLimit: result.tierLimit } : {}),
      },
    });
    return;
  }

  const response: ApiResponse<{ alias: ReturnType<typeof mapAliasToDto> }> = {
    ok: true,
    data: { alias: result.data.alias },
  };
  res.status(201).json(response);
});

aliasesRouter.get("/:id", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const row = await prisma.alias.findFirst({
    where: { id: req.params.id, userId },
  });
  if (!row) {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "Alias not found" },
    });
    return;
  }

  const response: ApiResponse<{ alias: ReturnType<typeof mapAliasToDto> }> = {
    ok: true,
    data: { alias: mapAliasToDto(row) },
  };
  res.json(response);
});

aliasesRouter.patch("/:id", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const body = req.body as PatchAliasRequest;
  const existingPatch = await prisma.alias.findFirst({
    where: { id: req.params.id, userId },
  });
  if (!existingPatch) {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "Alias not found" },
    });
    return;
  }

  const data: {
    category?: PrismaAliasCategory;
    serviceName?: string | null;
    isActive?: boolean;
    phoneForwardTo?: string | null;
  } = {};

  if (body.category !== undefined) {
    if (!CATEGORY_SET.has(body.category)) {
      res.status(400).json({
        ok: false,
        error: { code: "validation_error", message: "Invalid category" },
      });
      return;
    }
    data.category = body.category as PrismaAliasCategory;
  }
  if (body.serviceName !== undefined) {
    data.serviceName = body.serviceName;
  }
  if (body.isActive !== undefined) {
    data.isActive = body.isActive;
  }
  if (body.phoneForwardTo !== undefined) {
    if (existingPatch.type !== "phone") {
      res.status(400).json({
        ok: false,
        error: {
          code: "validation_error",
          message: "phoneForwardTo only applies to phone aliases",
        },
      });
      return;
    }
    const raw =
      typeof body.phoneForwardTo === "string" ? body.phoneForwardTo : "";
    const parsed = parsePhoneForwardTo(raw);
    if (!parsed.ok) {
      res.status(400).json({
        ok: false,
        error: { code: "validation_error", message: parsed.message },
      });
      return;
    }
    data.phoneForwardTo = parsed.value;
  }

  const row = await prisma.alias.update({
    where: { id: existingPatch.id },
    data,
  });
  const response: ApiResponse<{ alias: ReturnType<typeof mapAliasToDto> }> = {
    ok: true,
    data: { alias: mapAliasToDto(row) },
  };
  res.json(response);
});

aliasesRouter.delete("/:id", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const existingDel = await prisma.alias.findFirst({
    where: { id: req.params.id, userId },
  });
  if (!existingDel) {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "Alias not found" },
    });
    return;
  }

  const row = await prisma.alias.update({
    where: { id: existingDel.id },
    data: { isActive: false },
  });
  const response: ApiResponse<{ alias: ReturnType<typeof mapAliasToDto> }> = {
    ok: true,
    data: { alias: mapAliasToDto(row) },
  };
  res.json(response);
});

aliasesRouter.post("/:id/rotate", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const rotateBody = req.body as { encryptedValue?: string } | undefined;
  const clientEncrypted =
    typeof rotateBody?.encryptedValue === "string" &&
    rotateBody.encryptedValue.length > 0
      ? rotateBody.encryptedValue
      : null;

  const result = await rotateAliasForUser(userId, req.params.id, {
    encryptedValue: clientEncrypted,
  });

  if (!result.ok) {
    const status =
      result.code === "not_found"
        ? 404
        : result.code === "phone_unavailable"
          ? 503
          : 400;
    res.status(status).json({
      ok: false,
      error: { code: result.code, message: result.message },
    });
    return;
  }

  const response: ApiResponse<{
    previousId: string;
    alias: ReturnType<typeof mapAliasToDto>;
  }> = {
    ok: true,
    data: result.data,
  };
  res.status(201).json(response);
});
