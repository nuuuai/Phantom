import type {
  Alias,
  AliasCategory,
  AliasType,
  GenerateAliasRequest,
} from "@phantom/shared";
import type {
  AliasType as PrismaAliasType,
  UserTier,
} from "@prisma/client";
import { assertCanCreateAlias } from "./aliasTierLimits.js";
import { generateValueForType } from "./aliasGenerators.js";
import { mapAliasToDto } from "./mapAlias.js";
import { provisionPhoneAlias } from "./phone/provisionPhone.js";
import { parsePhoneForwardTo } from "./phone/validateForward.js";
import { prisma } from "./prisma.js";

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

export type GenerateAliasForUserResult =
  | { ok: true; data: { alias: Alias } }
  | {
      ok: false;
      code:
        | "validation_error"
        | "tier_limit"
        | "phone_unavailable"
        | "password_requires_client"
        | "not_found";
      message: string;
      tierLimit?: { aliasType: string; used: number; max: number | null };
    };

export async function generateAliasForUser(
  userId: string,
  tier: UserTier,
  body: GenerateAliasRequest
): Promise<GenerateAliasForUserResult> {
  const type = typeof body.type === "string" ? body.type : "";
  const category = typeof body.category === "string" ? body.category : "";
  if (!TYPE_SET.has(type) || !CATEGORY_SET.has(category)) {
    return {
      ok: false,
      code: "validation_error",
      message: "Valid type and category required",
    };
  }

  const serviceName =
    typeof body.serviceName === "string" && body.serviceName.length > 0
      ? body.serviceName
      : null;
  const serviceUrl =
    typeof body.serviceUrl === "string" && body.serviceUrl.length > 0
      ? body.serviceUrl
      : null;

  const limitCheck = await assertCanCreateAlias(
    userId,
    tier,
    type as PrismaAliasType
  );
  if (!limitCheck.ok) {
    return {
      ok: false,
      code: "tier_limit",
      message: limitCheck.message,
      tierLimit: {
        aliasType: limitCheck.tierLimit.aliasType,
        used: limitCheck.tierLimit.used,
        max: limitCheck.tierLimit.max,
      },
    };
  }

  const clientEncrypted =
    typeof body.encryptedValue === "string" && body.encryptedValue.length > 0
      ? body.encryptedValue
      : null;

  if (type === "password" && !clientEncrypted) {
    return {
      ok: false,
      code: "password_requires_client",
      message:
        "Password aliases must be created from the Vault with client-side encryption.",
    };
  }

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
      return { ok: false, code: "validation_error", message: parsed.message };
    }
    const p = provisionPhoneAlias(parsed.value);
    if (!p.ok) {
      return { ok: false, code: "phone_unavailable", message: p.message };
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

  return { ok: true, data: { alias: mapAliasToDto(row) } };
}
