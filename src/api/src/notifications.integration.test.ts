import path from "node:path";
import { config as loadEnv } from "dotenv";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { prisma } from "./lib/prisma.js";

loadEnv({ path: path.resolve(process.cwd(), "../../.env") });

const hasDb =
  Boolean(process.env.DATABASE_URL?.trim()) &&
  !process.env.DATABASE_URL.includes("phantom_placeholder");

describe.skipIf(!hasDb)("notifications API (integration)", () => {
  const app = createApp();
  const email = `notif-it-${Date.now()}@phantom.test`;
  const password = "testpassword123";
  const origNodeEnv = process.env.NODE_ENV;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    process.env.NODE_ENV = origNodeEnv;
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  afterEach(() => {
    process.env.NODE_ENV = origNodeEnv;
  });

  it("GET list and count respect disabled category prefs", async () => {
    const reg = await request(app)
      .post("/api/auth/register")
      .send({ email, password })
      .expect(201);
    const token = reg.body.data.accessToken as string;
    const userId = reg.body.data.user.id as string;

    await prisma.notification.create({
      data: {
        userId,
        layer: "shield",
        priority: "low",
        category: "system",
        title: "Test system",
        body: "integration",
        isRead: false,
      },
    });

    const before = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(before.body.ok).toBe(true);
    expect(
      (before.body.data.items as { category: string }[]).some(
        (n) => n.category === "system"
      )
    ).toBe(true);

    const countBefore = await request(app)
      .get("/api/notifications/count")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(countBefore.body.data.unreadCount).toBeGreaterThanOrEqual(1);

    await request(app)
      .put("/api/notifications/preferences")
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "application/json")
      .send({
        items: [
          { category: "alias_health", enabled: true },
          { category: "broker_removal", enabled: true },
          { category: "security_alert", enabled: true },
          { category: "system", enabled: false },
        ],
      })
      .expect(200);

    const after = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(
      (after.body.data.items as { category: string }[]).some(
        (n) => n.category === "system"
      )
    ).toBe(false);

    const countAfter = await request(app)
      .get("/api/notifications/count")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(countAfter.body.data.unreadCount).toBe(0);
  });

  it("POST /api/notifications/seed-demo returns 403 in production", async () => {
    const seedEmail = `notif-seed-${Date.now()}@phantom.test`;
    const reg = await request(app)
      .post("/api/auth/register")
      .send({ email: seedEmail, password })
      .expect(201);
    const token = reg.body.data.accessToken as string;

    process.env.NODE_ENV = "production";
    const res = await request(app)
      .post("/api/notifications/seed-demo")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.ok).toBe(false);
    expect(res.body.error?.code).toBe("forbidden");

    await prisma.user.deleteMany({ where: { email: seedEmail } });
  });

  it("PUT /api/notifications/preferences rejects non-boolean enabled", async () => {
    const badEmail = `notif-bad-${Date.now()}@phantom.test`;
    const reg = await request(app)
      .post("/api/auth/register")
      .send({ email: badEmail, password })
      .expect(201);
    const token = reg.body.data.accessToken as string;

    const res = await request(app)
      .put("/api/notifications/preferences")
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "application/json")
      .send({
        items: [{ category: "system", enabled: "yes" }],
      });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);

    await prisma.user.deleteMany({ where: { email: badEmail } });
  });
});
