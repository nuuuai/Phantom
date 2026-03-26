import Stripe from "stripe";

let client: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (client === undefined) {
    client = new Stripe(key, { typescript: true });
  }
  return client;
}

export function stripeConfigured(): boolean {
  return (
    Boolean(process.env.STRIPE_SECRET_KEY?.trim()) &&
    Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim()) &&
    Boolean(process.env.STRIPE_PRICE_PAID_MONTHLY?.trim())
  );
}

/** Clears cached Stripe client (for tests after env changes). */
export function resetStripeClientForTests(): void {
  client = undefined;
}
