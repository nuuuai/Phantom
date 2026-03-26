export interface User {
  id: string;
  displayName: string;
  createdAt: string;
  tier: "free" | "paid" | "enterprise";
}
