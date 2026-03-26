export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  tier: "free" | "paid" | "enterprise";
  /** Mirrors Stripe `subscription.status` when set; `none` / omitted when no subscription. */
  subscriptionStatus?: string | null;
  /** Optional real inbox for forward notifications (Phase 1: stored only; SMTP TBD). */
  forwardToEmail?: string | null;
}
