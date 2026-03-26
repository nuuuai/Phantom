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

const hasRedis = Boolean(process.env.REDIS_URL?.trim());

describe.skipIf(!hasDb || !hasRedis)("auth session: refresh + logout (integration)", () => {
  const app = createApp();

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("register → refresh rotates token → old refresh invalid → logout revokes", async () => {
    const email = `auth-sess-${Date.now()}@phantom.test`;
    const password = "testpassword123";

    const reg = await request(app)
      .post("/api/auth/register")
      .send({ email, password })
      .expect(201);
    expect(reg.body.data.refreshToken).toBeTruthy();
    const rt1 = reg.body.data.refreshToken as string;
    const at1 = reg.body.data.accessToken as string;

    await request(app)
      .get("/api/user/me")
      .set("Authorization", `Bearer ${at1}`)
      .expect(200);

    const refr = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: rt1 })
      .expect(200);
    expect(refr.body.ok).toBe(true);
    const rt2 = refr.body.data.refreshToken as string;
    const at2 = refr.body.data.accessToken as string;
    expect(rt2).not.toBe(rt1);

    await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: rt1 })
      .expect(401);

    const me = await request(app)
      .get("/api/user/me")
      .set("Authorization", `Bearer ${at2}`)
      .expect(200);
    expect(me.body.data.email).toBe(email);

    await request(app)
      .post("/api/auth/logout")
      .send({ refreshToken: rt2 })
      .expect(200);

    await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: rt2 })
      .expect(401);

    await prisma.user.deleteMany({ where: { email } });
  });

  it("POST /api/auth/refresh without Redis body returns 400", async () => {
    await request(app)
      .post("/api/auth/refresh")
      .send({})
      .expect(400);
  });

  it("GET protected route without Authorization returns 401", async () => {
    await request(app).get("/api/user/me").expect(401);
  });

  it("Bearer with garbage token returns 401 invalid_token", async () => {
    const res = await request(app)
      .get("/api/user/me")
      .set("Authorization", "Bearer not-a-real-jwt");
    expect(res.status).toBe(401);
    expect(res.body.error?.code).toBe("invalid_token");
  });
});
