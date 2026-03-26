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

describe.skipIf(!hasDb)("auth + aliases (integration)", () => {
  const app = createApp();
  const email = `it-${Date.now()}@phantom.test`;
  const password = "testpassword123";

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("register, then list aliases with Bearer token", async () => {
    const reg = await request(app)
      .post("/api/auth/register")
      .send({ email, password })
      .expect(201);
    expect(reg.body.ok).toBe(true);
    const token = reg.body.data.accessToken as string;
    expect(typeof token).toBe("string");

    const list = await request(app)
      .get("/api/aliases")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(list.body.ok).toBe(true);
    expect(list.body.data).toMatchObject({ userId: expect.any(String), items: [] });
  });

  it("PUT /api/vault/sync returns 409 when clientVersion is behind server", async () => {
    const vaultEmail = `it-vault-${Date.now()}@phantom.test`;
    const reg = await request(app)
      .post("/api/auth/register")
      .send({ email: vaultEmail, password })
      .expect(201);
    const token = reg.body.data.accessToken as string;

    await request(app)
      .put("/api/vault/sync")
      .set("Authorization", `Bearer ${token}`)
      .send({ ciphertext: '{"ct":"a","iv":"b"}', clientVersion: 0 })
      .expect(200);

    const conflict = await request(app)
      .put("/api/vault/sync")
      .set("Authorization", `Bearer ${token}`)
      .send({ ciphertext: '{"ct":"c","iv":"d"}', clientVersion: 0 })
      .expect(409);
    expect(conflict.body.ok).toBe(false);
    expect(conflict.body.error?.code).toBe("sync_conflict");

    await prisma.user.deleteMany({ where: { email: vaultEmail } });
  });
});
