import { randomBytes, randomInt } from "node:crypto";
import type { AliasCategory, AliasType } from "@phantom/shared";

const EMAIL_DOMAIN = "phantom.id";
const PASSWORD_CHARS =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

function randomAlphaNum(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) {
    const b = bytes[i] ?? 0;
    out += chars[b % chars.length]!;
  }
  return out;
}

function categoryPrefix(category: AliasCategory): string {
  const map: Record<AliasCategory, string> = {
    shopping: "shop",
    social: "social",
    finance: "fin",
    work: "work",
    dating: "date",
    newsletter: "news",
    temp: "tmp",
  };
  return map[category];
}

export async function generateUniqueEmailValue(
  exists: (local: string) => Promise<boolean>
): Promise<string> {
  for (let attempt = 0; attempt < 24; attempt++) {
    const local = `${randomAlphaNum(3)}${randomAlphaNum(5)}`;
    const candidate = `${local}@${EMAIL_DOMAIN}`;
    if (!(await exists(candidate))) {
      return candidate;
    }
  }
  throw new Error("could_not_allocate_email");
}

export function generatePhoneValue(): string {
  const mid = String(randomInt(100, 999)).padStart(3, "0");
  const last = String(randomInt(1000, 9999)).padStart(4, "0");
  return `+1-555-${mid}-${last}`;
}

export function generateUsernameValue(category: AliasCategory): string {
  const prefix = categoryPrefix(category);
  const suffix = randomAlphaNum(4);
  return `${prefix}_${suffix}`;
}

export function generatePasswordValue(): string {
  let out = "";
  const bytes = randomBytes(20);
  for (let i = 0; i < 20; i++) {
    out += PASSWORD_CHARS[bytes[i]! % PASSWORD_CHARS.length]!;
  }
  return out;
}

export function generateValueForType(
  type: AliasType,
  category: AliasCategory,
  existsEmail: (v: string) => Promise<boolean>
): Promise<string> {
  switch (type) {
    case "email":
      return generateUniqueEmailValue(existsEmail);
    case "phone":
      return Promise.resolve(generatePhoneValue());
    case "username":
      return Promise.resolve(generateUsernameValue(category));
    case "password":
      return Promise.resolve(generatePasswordValue());
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}
