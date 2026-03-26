export type AliasType = "email" | "phone" | "username" | "password";

export type AliasCategory =
  | "shopping"
  | "social"
  | "finance"
  | "work"
  | "dating"
  | "newsletter"
  | "temp";

export type HealthStatus = "healthy" | "warning" | "compromised" | "quarantined";

export interface Alias {
  id: string;
  userId: string;
  type: AliasType;
  value: string;
  encryptedValue: string | null;
  category: AliasCategory;
  serviceName: string | null;
  serviceUrl: string | null;
  healthStatus: HealthStatus;
  createdAt: string;
  lastActivityAt: string | null;
  spamCount: number;
  isActive: boolean;
  /** Phone adapter metadata (null for non-phone aliases). */
  phoneProvider?: string | null;
  phoneProviderSid?: string | null;
  phoneForwardTo?: string | null;
}

export interface GenerateAliasRequest {
  type: AliasType;
  category: AliasCategory;
  serviceName?: string;
  serviceUrl?: string;
  encryptedValue?: string;
  /** E.164 real number for call/SMS forward (phone aliases; optional). */
  phoneForwardTo?: string;
}

export interface PatchAliasRequest {
  category?: AliasCategory;
  serviceName?: string | null;
  isActive?: boolean;
  phoneForwardTo?: string | null;
}
