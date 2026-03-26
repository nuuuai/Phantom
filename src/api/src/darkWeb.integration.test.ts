import path from "node:path";
import { config as loadEnv } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { prisma } from "./lib/prisma.js";

loadEnv({ path: path.resolve(process.cwd(), "../../.env") });

const hasDb =
  Boolean(process.env.DATABASE_URL?.trim()) &&
  !process.env.DATABASE_URL.includes("phantom_placeholder");

describe.skipIf(!hasDb)("dark web API (integration)", () => {
  const app = createApp();
  const email = `dw-it-${Date.now()}@phantom.test`;
  const password = "testpassword123";

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      await prisma.darkWebFinding.deleteMany({ where: { userId: u.id } });
      await prisma.notification.deleteMany({ where: { userId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }
    await prisma.$disconnect();
  });

  it("free tier: summary + findings are tier-gated; overview darkWebAlerts is 0", async () => {
    const reg = await request(app)
      .post("/api/auth/register")
      .send({ email, password })
      .expect(201);
    const token = reg.body.data.accessToken as string;

    const sum = await request(app)
      .get("/api/dark-web/summary")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(sum.body.ok).toBe(true);
    expect(sum.body.data.tierGated).toBe(true);
    expect(sum.body.data.openCount).toBe(0);

    const list = await request(app)
      .get("/api/dark-web/findings")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(list.body.data.tierGated).toBe(true);
    expect(list.body.data.items).toEqual([]);

    const ov = await request(app)
      .get("/api/dashboard/metrics")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(ov.body.data.darkWebAlerts).toBe(0);

    const refresh = await request(app)
      .post("/api/dark-web/refresh")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
    expect(refresh.body.error.code).toBe("upgrade_required");
  });

  it("paid tier: stores finding, overview count, dismiss, PATCH", async () => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("missing user");
    await prisma.user.update({
      where: { id: user.id },
      data: { tier: "paid" },
    });

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password })
      .expect(200);
    const token = login.body.data.accessToken as string;

    const sumBefore = await request(app)
      .get("/api/dark-web/summary")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(sumBefore.body.data.tierGated).toBe(false);

    const row = await prisma.darkWebFinding.create({
      data: {
        userId: user.id,
        severity: "high",
        status: "open",
        title: "Integration exposure",
        summary: "Test summary only.",
        sourceLabel: "Test",
        breachName: "TestBreach",
        identifierType: "email_address",
        identifierDisplay: "t***@phantom.test",
        recommendedAction: "Rotate password.",
        detectedAt: new Date(),
        dedupeKey: `it:${String(Date.now())}`,
      },
    });

    const ov = await request(app)
      .get("/api/dashboard/metrics")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(ov.body.data.darkWebAlerts).toBeGreaterThanOrEqual(1);

    const list = await request(app)
      .get("/api/dark-web/findings")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(list.body.data.items.some((x: { id: string }) => x.id === row.id)).toBe(
      true
    );

    const patch = await request(app)
      .patch(`/api/dark-web/findings/${row.id}`)
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "application/json")
      .send({ status: "dismissed" })
      .expect(200);
    expect(patch.body.data.finding.status).toBe("dismissed");

    const ov2 = await request(app)
      .get("/api/dashboard/metrics")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(ov2.body.data.darkWebAlerts).toBe(0);
  });
});
