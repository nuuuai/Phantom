/**
 * POST /api/billing/sync-checkout-session with mocked Stripe retrieve (needs Postgres for user row).
 */
import path from "node:path";
import { randomUUID } from "node:crypto";
import { config as loadEnv } from "dotenv";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";
import { prisma } from "./lib/prisma.js";
import * as stripeClient from "./lib/stripeClient.js";

loadEnv({ path: path.resolve(process.cwd(), "../../.env") });

const hasDb =
  Boolean(process.env.DATABASE_URL?.trim()) &&
  !process.env.DATABASE_URL.includes("phantom_placeholder");

const SK = "sk_test_123456789012345678901234567890abcdef";

describe.skipIf(!hasDb)("billing sync-checkout-session (integration)", () => {
  const app = createApp();

  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = SK;
    stripeClient.resetStripeClientForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    stripeClient.resetStripeClientForTests();
    delete process.env.STRIPE_SECRET_KEY;
  });

  it("applies Pro tier when Stripe session is complete and owned by user", async () => {
    const email = `sync_cs_${randomUUID()}@example.com`;
    const password = "password12345";
    const reg = await request(app)
      .post("/api/auth/register")
      .send({ email, password })
      .expect(201);
    const token = reg.body.data.accessToken as string;
    const userId = reg.body.data.user.id as string;

    const sessionId = `cs_test_${randomUUID().slice(0, 8)}`;
    vi.spyOn(stripeClient, "getStripe").mockReturnValue({
      checkout: {
        sessions: {
          retrieve: vi.fn().mockResolvedValue({
            id: sessionId,
            object: "checkout.session",
            mode: "subscription",
            status: "complete",
            client_reference_id: userId,
            metadata: { userId },
            subscription: "sub_test_from_sync",
            customer: "cus_test_from_sync",
          }),
        },
      },
    } as ReturnType<typeof stripeClient.getStripe>);

    const res = await request(app)
      .post("/api/billing/sync-checkout-session")
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ sessionId }));

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toMatchObject({ synced: true });

    const u = await prisma.user.findUnique({ where: { id: userId } });
    expect(u?.tier).toBe("paid");
    expect(u?.stripeSubscriptionId).toBe("sub_test_from_sync");
    expect(u?.stripeCustomerId).toBe("cus_test_from_sync");

    const resAgain = await request(app)
      .post("/api/billing/sync-checkout-session")
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ sessionId }));

    expect(resAgain.status).toBe(200);
    expect(resAgain.body.ok).toBe(true);
    expect(resAgain.body.data).toMatchObject({ synced: true });

    await prisma.user.delete({ where: { id: userId } });
  });
});
