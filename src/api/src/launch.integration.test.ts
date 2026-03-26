/**
 * DB-backed flows (requires real `DATABASE_URL`, not the vitest placeholder).
 * Stripe webhook uses signed payloads (Stripe SDK test helpers); secrets are test-only.
 */
import path from "node:path";
import { randomUUID } from "node:crypto";
import { config as loadEnv } from "dotenv";
import request from "supertest";
import Stripe from "stripe";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { prisma } from "./lib/prisma.js";
import { resetStripeClientForTests } from "./lib/stripeClient.js";

loadEnv({ path: path.resolve(process.cwd(), "../../.env") });

const hasDb =
  Boolean(process.env.DATABASE_URL?.trim()) &&
  !process.env.DATABASE_URL.includes("phantom_placeholder");

const SK = "sk_test_123456789012345678901234567890abcdef";
const WH_SECRET =
  "whsec_test_secret_123456789012345678901234567890abcdef123456789012";

describe.skipIf(!hasDb)("launch integration (auth + Stripe webhook)", () => {
  const app = createApp();

  afterEach(async () => {
    resetStripeClientForTests();
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it("register → login → GET /api/user/me", async () => {
    const email = `launch_${randomUUID()}@example.com`;
    const password = "password12345";

    const reg = await request(app)
      .post("/api/auth/register")
      .send({ email, password })
      .expect(201);
    expect(reg.body.ok).toBe(true);
    expect(reg.body.data.user.email).toBe(email);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password })
      .expect(200);
    expect(login.body.ok).toBe(true);
    const token = login.body.data.accessToken as string;
    expect(typeof token).toBe("string");

    const me = await request(app)
      .get("/api/user/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(me.body.ok).toBe(true);
    expect(me.body.data.email).toBe(email);

    await prisma.user.delete({ where: { email } });
  });

  it("checkout.session.completed updates user to paid", async () => {
    process.env.STRIPE_SECRET_KEY = SK;
    process.env.STRIPE_WEBHOOK_SECRET = WH_SECRET;
    resetStripeClientForTests();

    const email = `stripe_${randomUUID()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email,
        hashedPassword: "$2b$04$placeholder.hash.placeholder.placeholder",
        tier: "free",
      },
    });

    const stripe = new Stripe(SK, { typescript: true });
    const subId = `sub_test_${randomUUID().slice(0, 8)}`;
    const event = {
      id: `evt_${randomUUID()}`,
      object: "event",
      api_version: "2024-11-20.acacia",
      created: Math.floor(Date.now() / 1000),
      type: "checkout.session.completed",
      livemode: false,
      pending_webhooks: 0,
      request: null,
      data: {
        object: {
          id: "cs_test_checkout",
          object: "checkout.session",
          mode: "subscription",
          client_reference_id: user.id,
          subscription: subId,
          customer: "cus_test_customer",
        },
      },
    };
    const payload = JSON.stringify(event);
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: WH_SECRET,
    });

    const res = await request(app)
      .post("/api/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("Stripe-Signature", signature)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated?.tier).toBe("paid");
    expect(updated?.stripeSubscriptionId).toBe(subId);
    expect(updated?.subscriptionStatus).toBe("active");

    await prisma.user.delete({ where: { id: user.id } });
  });

  it("customer.subscription.deleted downgrades tier when subscription id matches", async () => {
    process.env.STRIPE_SECRET_KEY = SK;
    process.env.STRIPE_WEBHOOK_SECRET = WH_SECRET;
    resetStripeClientForTests();

    const subId = `sub_test_${randomUUID().slice(0, 12)}`;
    const email = `stripe_del_${randomUUID()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email,
        hashedPassword: "$2b$04$placeholder.hash.placeholder.placeholder",
        tier: "paid",
        stripeCustomerId: "cus_test_x",
        stripeSubscriptionId: subId,
        subscriptionStatus: "active",
      },
    });

    const stripe = new Stripe(SK, { typescript: true });
    const event = {
      id: `evt_${randomUUID()}`,
      object: "event",
      api_version: "2024-11-20.acacia",
      created: Math.floor(Date.now() / 1000),
      type: "customer.subscription.deleted",
      livemode: false,
      pending_webhooks: 0,
      request: null,
      data: {
        object: {
          id: subId,
          object: "subscription",
          status: "canceled",
        },
      },
    };
    const payload = JSON.stringify(event);
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: WH_SECRET,
    });

    const res = await request(app)
      .post("/api/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("Stripe-Signature", signature)
      .send(payload);

    expect(res.status).toBe(200);

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated?.tier).toBe("free");
    expect(updated?.stripeSubscriptionId).toBeNull();
    expect(updated?.subscriptionStatus).toBe("canceled");

    await prisma.user.delete({ where: { id: user.id } });
  });
});
