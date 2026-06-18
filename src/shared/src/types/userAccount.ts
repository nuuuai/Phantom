import type { AliasCategory, AliasType, HealthStatus } from "./alias.js";
import type { User } from "./user.js";
import type { UserAiPreferences } from "./userPreferences.js";

export interface AliasTypeUsage {
  type: AliasType;
  used: number;
  /** `null` = unlimited (paid / enterprise) */
  max: number | null;
}

export interface UserAccountSnapshot {
  user: User;
  aliasUsage: AliasTypeUsage[];
  preferences: UserAiPreferences;
}

/** Metadata export — no plaintext vault passwords; encrypted blobs only. */
export interface AccountExportAliasRow {
  id: string;
  type: AliasType;
  category: AliasCategory;
  healthStatus: HealthStatus;
  serviceName: string | null;
  serviceUrl: string | null;
  value: string;
  createdAt: string;
  hasEncryptedValue: boolean;
}

export interface AccountExportPayload {
  exportedAt: string;
  version: 1;
  user: User;
  preferences: UserAiPreferences;
  aliases: readonly AccountExportAliasRow[];
  darkWebOpenCount: number;
  brokerExposureCount: number | null;
  vaultSyncVersion: number | null;
  /** Opaque E2E ciphertext for vault portability — client holds keys. */
  vaultSyncCiphertext: string | null;
}

export interface AccountDeleteRequest {
  password: string;
  confirmPhrase: "DELETE";
}

export interface AccountDeleteResult {
  deleted: true;
}
