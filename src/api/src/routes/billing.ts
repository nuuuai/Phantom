import type { ApiResponse } from "@phantom/shared";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { getStripe, stripeConfigured } from "../lib/stripeClient.js";

export const billingRouter = Router();

function dashboardPublicUrl(): string {
  return (
    process.env.DASHBOARD_PUBLIC_URL?.trim() || "http://localhost:5173"
  ).replace(/\/$/, "");
}

billingRouter.get("/status", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      tier: true,
      email: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      subscriptionStatus: true,
    },
  });
  if (!user) {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "User not found" },
    });
    return;
  }

  const stripe = getStripe();
  const priceId = process.env.STRIPE_PRICE_PAID_MONTHLY?.trim();

  const data = {
    tier: user.tier,
    subscriptionStatus: user.subscriptionStatus ?? "none",
    stripeCustomerId: user.stripeCustomerId,
    stripeSubscriptionId: user.stripeSubscriptionId,
    billingProviderReady: stripeConfigured(),
    hasStripeClient: Boolean(stripe && priceId),
    manageUrl: null as string | null,
    checkoutUrl: null as string | null,
  };

  const response: ApiResponse<typeof data> = { ok: true, data };
  res.json(response);
});

billingRouter.post("/checkout-session", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const stripe = getStripe();
  const priceId = process.env.STRIPE_PRICE_PAID_MONTHLY?.trim();
  if (!stripe || !priceId) {
    res.status(503).json({
      ok: false,
      error: {
        code: "billing_unconfigured",
        message:
          "Stripe is not configured (STRIPE_SECRET_KEY, STRIPE_PRICE_PAID_MONTHLY)",
      },
    });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "User not found" },
    });
    return;
  }

  const base = dashboardPublicUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/billing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/billing?canceled=1`,
    client_reference_id: userId,
    metadata: { userId },
    customer_email: user.email,
    ...(user.stripeCustomerId
      ? { customer: user.stripeCustomerId }
      : {}),
  });

  const response: ApiResponse<{ url: string | null }> = {
    ok: true,
    data: { url: session.url },
  };
  res.status(201).json(response);
});

billingRouter.post("/portal-session", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    return;
  }

  const stripe = getStripe();
  if (!stripe) {
    res.status(503).json({
      ok: false,
      error: { code: "billing_unconfigured", message: "Stripe not configured" },
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });
  if (!user?.stripeCustomerId) {
    res.status(400).json({
      ok: false,
      error: {
        code: "no_stripe_customer",
        message: "Subscribe via Checkout first to manage billing",
      },
    });
    return;
  }

  const base = dashboardPublicUrl();
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${base}/billing`,
  });

  const response: ApiResponse<{ url: string | null }> = {
    ok: true,
    data: { url: session.url },
  };
  res.status(201).json(response);
});
