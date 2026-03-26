import type Stripe from "stripe";
import { prisma } from "./prisma.js";

/**
 * Applies Pro subscription fields from a completed Checkout Session (subscription mode).
 * Idempotent for the same session. Used by Stripe webhooks and POST /billing/sync-checkout-session.
 */
export async function applyProSubscriptionFromCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<boolean> {
  if (session.mode !== "subscription") return false;
  const userId =
    session.client_reference_id ??
    (typeof session.metadata?.userId === "string"
      ? session.metadata.userId
      : undefined);
  if (!userId) return false;
  const subRaw = session.subscription;
  const subId =
    typeof subRaw === "string"
      ? subRaw
      : subRaw && typeof subRaw === "object" && "id" in subRaw
        ? String(subRaw.id)
        : null;
  const custRaw = session.customer;
  const customerId =
    typeof custRaw === "string"
      ? custRaw
      : custRaw && typeof custRaw === "object" && "id" in custRaw
        ? String(custRaw.id)
        : null;
  await prisma.user.update({
    where: { id: userId },
    data: {
      tier: "paid",
      stripeCustomerId: customerId ?? undefined,
      stripeSubscriptionId: subId ?? undefined,
      subscriptionStatus: "active",
    },
  });
  return true;
}
