import express, { Router } from "express";
import type Stripe from "stripe";
import rateLimit from "express-rate-limit";
import { applyProSubscriptionFromCheckoutSession } from "../lib/stripeCheckoutSessionApply.js";
import { prisma } from "../lib/prisma.js";
import { isPrismaUniqueViolation } from "../lib/prismaUnique.js";
import { getStripe } from "../lib/stripeClient.js";

export const stripeWebhookRouter = Router();

const limiter = rateLimit({
  windowMs: 60_000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
});

stripeWebhookRouter.post(
  "/stripe",
  limiter,
  express.raw({ type: "application/json", limit: "1mb" }),
  async (req, res) => {
    const stripe = getStripe();
    const whSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!stripe || !whSecret) {
      res.status(503).json({
        ok: false,
        error: {
          code: "stripe_unconfigured",
          message: "Stripe webhook is not configured",
        },
      });
      return;
    }

    const sig = req.headers["stripe-signature"];
    if (typeof sig !== "string" || sig.length === 0) {
      res.status(400).json({
        ok: false,
        error: { code: "missing_signature", message: "Missing Stripe-Signature" },
      });
      return;
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body as Buffer,
        sig,
        whSecret
      );
    } catch {
      res.status(400).json({
        ok: false,
        error: { code: "invalid_signature", message: "Invalid signature" },
      });
      return;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          await applyProSubscriptionFromCheckoutSession(session);
          break;
        }
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          const paidStatuses = new Set(["active", "trialing", "past_due"]);
          const tier =
            event.type === "customer.subscription.deleted"
              ? "free"
              : paidStatuses.has(sub.status)
                ? "paid"
                : "free";
          const subStatus =
            event.type === "customer.subscription.deleted"
              ? "canceled"
              : sub.status;

          await prisma.user.updateMany({
            where: { stripeSubscriptionId: sub.id },
            data: {
              tier,
              subscriptionStatus: subStatus,
              ...(event.type === "customer.subscription.deleted"
                ? { stripeSubscriptionId: null }
                : {}),
            },
          });
          break;
        }
        default:
          break;
      }
    } catch (err) {
      process.stderr.write(
        `stripe webhook handler: ${err instanceof Error ? err.message : String(err)}\n`
      );
      res.status(500).json({
        ok: false,
        error: { code: "webhook_handler_error", message: "Handler failed" },
      });
      return;
    }

    try {
      await prisma.stripeWebhookEvent.create({
        data: { stripeEventId: event.id },
      });
    } catch (e) {
      if (isPrismaUniqueViolation(e)) {
        res.json({ received: true, duplicate: true });
        return;
      }
      throw e;
    }

    res.json({ received: true });
  }
);
