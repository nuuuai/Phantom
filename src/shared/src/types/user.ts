export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  tier: "free" | "paid" | "enterprise";
}
