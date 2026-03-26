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
  category: AliasCategory;
  serviceName: string | null;
  serviceUrl: string | null;
  healthStatus: HealthStatus;
  createdAt: string;
  lastActivityAt: string | null;
  spamCount: number;
  isActive: boolean;
}

export interface GenerateAliasRequest {
  type: AliasType;
  category: AliasCategory;
  serviceName?: string;
  serviceUrl?: string;
}

export interface PatchAliasRequest {
  category?: AliasCategory;
  serviceName?: string | null;
  isActive?: boolean;
}
