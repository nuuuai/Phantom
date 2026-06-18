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
import { generateValueForType } from "../lib/aliasGenerators.js";
import { rotateAliasForUser } from "../lib/aliasRotate.js";
import { assertCanCreateAlias } from "../lib/aliasTierLimits.js";
import { provisionPhoneAlias } from "../lib/phone/provisionPhone.js";
import { parsePhoneForwardTo } from "../lib/phone/validateForward.js";
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

  const body = req.body as GenerateAliasRequest;
  const type = typeof body.type === "string" ? body.type : "";
  const category = typeof body.category === "string" ? body.category : "";
  if (!TYPE_SET.has(type) || !CATEGORY_SET.has(category)) {
    res.status(400).json({
      ok: false,
      error: {
        code: "validation_error",
        message: "Valid type and category required",
      },
    });
    return;
  }

  const serviceName =
    typeof body.serviceName === "string" && body.serviceName.length > 0
      ? body.serviceName
      : null;
  const serviceUrl =
    typeof body.serviceUrl === "string" && body.serviceUrl.length > 0
      ? body.serviceUrl
      : null;

  const userRow = await prisma.user.findUnique({ where: { id: userId } });
  if (!userRow) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "User not found" },
    });
    return;
  }

  const limitCheck = await assertCanCreateAlias(
    userId,
    userRow.tier,
    type as PrismaAliasType
  );
  if (!limitCheck.ok) {
    res.status(403).json({
      ok: false,
      error: {
        code: "tier_limit",
        message: limitCheck.message,
        tierLimit: {
          aliasType: limitCheck.tierLimit.aliasType,
          used: limitCheck.tierLimit.used,
          max: limitCheck.tierLimit.max,
        },
      },
    });
    return;
  }

  const clientEncrypted =
    typeof body.encryptedValue === "string" && body.encryptedValue.length > 0
      ? body.encryptedValue
      : null;

  let value: string;
  let phoneProvider: string | null = null;
  let phoneProviderSid: string | null = null;
  let phoneForwardTo: string | null = null;

  if (clientEncrypted && type === "password") {
    value = "[encrypted]";
  } else if (type === "phone") {
    const raw =
      typeof body.phoneForwardTo === "string" ? body.phoneForwardTo : undefined;
    const parsed = parsePhoneForwardTo(raw);
    if (!parsed.ok) {
      res.status(400).json({
        ok: false,
        error: { code: "validation_error", message: parsed.message },
      });
      return;
    }
    const p = provisionPhoneAlias(parsed.value);
    if (!p.ok) {
      res.status(503).json({
        ok: false,
        error: { code: p.code, message: p.message },
      });
      return;
    }
    value = p.value;
    phoneProvider = p.provider;
    phoneProviderSid = p.providerSid;
    phoneForwardTo = p.forwardTo;
  } else {
    const existsEmail = async (v: string): Promise<boolean> => {
      const found = await prisma.alias.findFirst({
        where: { type: "email", value: v, isActive: true },
      });
      return found !== null;
    };
    value = await generateValueForType(
      type as AliasType,
      category as AliasCategory,
      existsEmail
    );
  }

  const row = await prisma.alias.create({
    data: {
      userId,
      type: type as AliasType,
      value,
      encryptedValue: clientEncrypted,
      category: category as AliasCategory,
      serviceName,
      serviceUrl,
      healthStatus: "healthy",
      lastActivityAt: new Date(),
      phoneProvider,
      phoneProviderSid,
      phoneForwardTo,
    },
  });

  const response: ApiResponse<{ alias: ReturnType<typeof mapAliasToDto> }> = {
    ok: true,
    data: { alias: mapAliasToDto(row) },
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
