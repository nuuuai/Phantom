import type { Alias } from "@phantom/shared";
import { generateValueForType } from "./aliasGenerators.js";
import { mapAliasToDto } from "./mapAlias.js";
import { provisionPhoneAlias } from "./phone/provisionPhone.js";
import { parsePhoneForwardTo } from "./phone/validateForward.js";
import { prisma } from "./prisma.js";

export type RotateAliasResult =
  | { ok: true; data: { previousId: string; alias: Alias } }
  | {
      ok: false;
      code:
        | "not_found"
        | "validation_error"
        | "phone_unavailable"
        | "password_requires_client";
      message: string;
    };

export async function rotateAliasForUser(
  userId: string,
  aliasId: string,
  options?: { encryptedValue?: string | null }
): Promise<RotateAliasResult> {
  const existing = await prisma.alias.findFirst({
    where: { id: aliasId, userId, isActive: true },
  });
  if (!existing) {
    return { ok: false, code: "not_found", message: "Alias not found" };
  }

  const clientEncrypted =
    typeof options?.encryptedValue === "string" &&
    options.encryptedValue.length > 0
      ? options.encryptedValue
      : null;

  if (existing.type === "password" && !clientEncrypted) {
    return {
      ok: false,
      code: "password_requires_client",
      message:
        "Password aliases must be rotated from the Vault with client-side encryption.",
    };
  }

  await prisma.alias.update({
    where: { id: existing.id },
    data: { healthStatus: "quarantined", isActive: false },
  });

  let value: string;
  let phoneProvider: string | null = null;
  let phoneProviderSid: string | null = null;
  let phoneForwardTo: string | null = null;

  if (clientEncrypted && existing.type === "password") {
    value = "[encrypted]";
  } else if (existing.type === "phone") {
    const parsed = parsePhoneForwardTo(existing.phoneForwardTo);
    if (!parsed.ok) {
      return { ok: false, code: "validation_error", message: parsed.message };
    }
    const p = provisionPhoneAlias(parsed.value);
    if (!p.ok) {
      return {
        ok: false,
        code: "phone_unavailable",
        message: p.message,
      };
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
      existing.type,
      existing.category,
      existsEmail
    );
  }

  const row = await prisma.alias.create({
    data: {
      userId,
      type: existing.type,
      value,
      encryptedValue: clientEncrypted,
      category: existing.category,
      serviceName: existing.serviceName,
      serviceUrl: existing.serviceUrl,
      healthStatus: "healthy",
      lastActivityAt: new Date(),
      phoneProvider,
      phoneProviderSid,
      phoneForwardTo,
    },
  });

  return {
    ok: true,
    data: { previousId: existing.id, alias: mapAliasToDto(row) },
  };
}

const HEALTH_RANK: Record<string, number> = {
  compromised: 0,
  quarantined: 1,
  warning: 2,
  healthy: 3,
};

export async function findBestRotationCandidate(userId: string): Promise<{
  id: string;
  label: string;
  healthStatus: string;
  type: string;
} | null> {
  const rows = await prisma.alias.findMany({
    where: {
      userId,
      isActive: true,
      type: { not: "password" },
      healthStatus: { in: ["compromised", "warning", "quarantined"] },
    },
    select: {
      id: true,
      serviceName: true,
      healthStatus: true,
      type: true,
    },
  });

  if (rows.length === 0) return null;

  rows.sort(
    (a, b) =>
      (HEALTH_RANK[a.healthStatus] ?? 99) - (HEALTH_RANK[b.healthStatus] ?? 99)
  );

  const top = rows[0];
  return {
    id: top.id,
    label: top.serviceName ?? top.id,
    healthStatus: top.healthStatus,
    type: top.type,
  };
}
