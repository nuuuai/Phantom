import type { HealthState } from "../constants/healthStates.js";

export interface Alias {
  id: string;
  label: string;
  address: string;
  categoryId: string;
  healthScore: number;
  healthState: HealthState;
  createdAt: string;
  parentIdentityId: string;
}
