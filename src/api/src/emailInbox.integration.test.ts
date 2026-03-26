/**
 * Requires real Postgres (`DATABASE_URL` not vitest placeholder). Runs in CI.
 */
import { createHmac, randomUUID } from "node:crypto";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { prisma } from "./lib/prisma.js";

loadEnv({ path: path.resolve(process.cwd(), "../../.env") });

const hasDb =
  Boolean(process.env.DATABASE_URL?.trim()) &&
  !process.env.DATABASE_URL.includes("phantom_placeholder");

function signBody(secret: string, payload: string): string {
  const hex = createHmac("sha256", secret)
    .update(Buffer.from(payload, "utf8"))
    .digest("hex");
  return `sha256=${hex}`;
}

describe.skipIf(!hasDb)("email inbox (integration)", () => {
  const app = createApp();
  const secret = "sixteen_characters_long_inbound_secret";
  const email = `inbox_it_${randomUUID()}@phantom.test`;
  const password = "testpassword123";

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
  });

  it("webhook → list → patch read", async () => {
    process.env.INBOUND_WEBHOOK_SECRET = secret;

    const reg = await request(app)
      .post("/api/auth/register")
      .send({ email, password })
      .expect(201);
    const token = reg.body.data.accessToken as string;

    const gen = await request(app)
      .post("/api/aliases/generate")
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "application/json")
      .send({ type: "email", category: "shopping" })
      .expect(201);
    expect(gen.body.ok).toBe(true);
    const aliasAddress = gen.body.data.alias.value as string;

    const payload = JSON.stringify({
      aliasAddress,
      subject: "Integration hello",
      fromAddress: "sender@example.com",
      snippet: "Body preview",
    });
    const wh = await request(app)
      .post("/api/webhooks/email-inbound")
      .set("Content-Type", "application/json")
      .set("X-Phantom-Signature", signBody(secret, payload))
      .send(payload);
    expect(wh.status).toBe(201);
    expect(wh.body.ok).toBe(true);
    expect(typeof wh.body.data?.id).toBe("string");

    const list = await request(app)
      .get("/api/email-inbox")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(list.body.ok).toBe(true);
    expect(list.body.data.items).toHaveLength(1);
    const msg = list.body.data.items[0];
    expect(msg.isRead).toBe(false);
    expect(msg.subject).toBe("Integration hello");

    const patch = await request(app)
      .patch(`/api/email-inbox/${msg.id}/read`)
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "application/json")
      .send({ isRead: true })
      .expect(200);
    expect(patch.body.data.item.isRead).toBe(true);

    const unread = await request(app)
      .get("/api/email-inbox?unread=1")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(unread.body.data.items).toHaveLength(0);
  });
});
