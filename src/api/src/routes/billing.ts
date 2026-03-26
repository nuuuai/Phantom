import type { ApiResponse } from "@phantom/shared";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const billingRouter = Router();

/**
 * Subscription / billing surface — Stripe (or similar) integration is TODO.
 * Dashboard and extension can call this to show upgrade CTAs and gate paid features.
 */
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
    select: { tier: true, email: true },
  });
  if (!user) {
    res.status(404).json({
      ok: false,
      error: { code: "not_found", message: "User not found" },
    });
    return;
  }

  const hasStripe =
    Boolean(process.env.STRIPE_SECRET_KEY?.trim()) &&
    Boolean(process.env.STRIPE_PRICE_PAID_MONTHLY?.trim());

  const data = {
    tier: user.tier,
    subscriptionStatus: "none" as const,
    /** When Stripe is wired: checkout URL from Checkout Session or Billing Portal. */
    manageUrl: null as string | null,
    /** TODO: Stripe Customer Portal or embedded checkout. */
    checkoutUrl: null as string | null,
    billingProviderReady: hasStripe,
  };

  const response: ApiResponse<typeof data> = { ok: true, data };
  res.json(response);
});
