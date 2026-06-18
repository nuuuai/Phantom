export type FamilyMemberRole = "owner" | "adult" | "child";

export interface FamilyMember {
  id: string;
  displayLabel: string;
  role: FamilyMemberRole;
  threatAlerts: number;
  aliasesProtected: number;
  callGuardEnabled: boolean;
}

export interface FamilySnapshot {
  seatCount: number;
  seatsUsed: number;
  members: readonly FamilyMember[];
  sharedThreatPatterns: number;
  tierGated: boolean;
}
