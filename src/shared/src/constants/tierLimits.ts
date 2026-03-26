import type { AliasType } from "../types/alias.js";

/** Free-tier caps from Phase 1 product spec (roadmap). Paid = unlimited. */
export const FREE_TIER_ALIAS_MAX: Record<AliasType, number> = {
  email: 3,
  phone: 1,
  username: 5,
  password: 25,
};
