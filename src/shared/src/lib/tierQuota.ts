import type { AliasType } from "../types/alias.js";
import type { AliasTypeUsage } from "../types/userAccount.js";
import type { User } from "../types/user.js";

/** True when free-tier user has reached the server-enforced cap for this alias type. */
export function isFreeTierAliasTypeAtCap(
  tier: User["tier"],
  type: AliasType,
  aliasUsage: AliasTypeUsage[]
): boolean {
  if (tier !== "free") return false;
  const row = aliasUsage.find((u) => u.type === type);
  if (!row || row.max === null) return false;
  return row.used >= row.max;
}
