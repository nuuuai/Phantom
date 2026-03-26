import type { AliasType } from "./alias.js";
import type { User } from "./user.js";

export interface AliasTypeUsage {
  type: AliasType;
  used: number;
  /** `null` = unlimited (paid / enterprise) */
  max: number | null;
}

export interface UserAccountSnapshot {
  user: User;
  aliasUsage: AliasTypeUsage[];
}
