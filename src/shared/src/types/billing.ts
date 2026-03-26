/**
 * Wire shape for `GET /api/billing/status`. Field names are stable for Phase 1;
 * do not rename without updating API + dashboard + docs together.
 */
export interface BillingStatus {
  tier: string;
  subscriptionStatus: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  billingProviderReady: boolean;
  hasStripeClient: boolean;
  manageUrl: string | null;
  checkoutUrl: string | null;
}
