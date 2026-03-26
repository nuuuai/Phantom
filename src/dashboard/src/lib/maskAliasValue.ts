import type { AliasType } from "@phantom/shared";

export function maskAliasValue(
  type: AliasType,
  value: string,
  revealed: boolean
): string {
  if (revealed) return value;
  if (type === "password") {
    return "•".repeat(Math.min(Math.max(value.length, 8), 20));
  }
  if (type === "email") {
    const at = value.indexOf("@");
    if (at <= 0) return "•••";
    const local = value.slice(0, at);
    const domain = value.slice(at + 1);
    const prefix = local.slice(0, 2);
    return `${prefix}•••@${domain}`;
  }
  if (type === "phone") {
    if (value.length <= 8) return "••••••••";
    return `${value.slice(0, 8)}••••`;
  }
  return `${value.slice(0, 3)}•••`;
}
