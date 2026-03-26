/**
 * Free-tier broker scan cap (requires Postgres + seeded `DataBroker` catalog).
 */
import path from "node:path";
import { randomUUID } from "node:crypto";
import { config as loadEnv } from "dotenv";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { prisma } from "./lib/prisma.js";

loadEnv({ path: path.resolve(process.cwd(), "../../.env") });

const hasDb =
  Boolean(process.env.DATABASE_URL?.trim()) &&
  !process.env.DATABASE_URL.includes("phantom_placeholder");

describe.skipIf(!hasDb)("broker scan quota (integration)", () => {
  const app = createApp();
  let prevCap: string | undefined;

  beforeEach(() => {
    prevCap = process.env.FREE_TIER_BROKER_SCAN_MAX_PER_24H;
  });

  afterEach(() => {
    if (prevCap === undefined) delete process.env.FREE_TIER_BROKER_SCAN_MAX_PER_24H;
    else process.env.FREE_TIER_BROKER_SCAN_MAX_PER_24H = prevCap;
  });

  it("returns 429 scan_rate_limited when free tier exceeds cap within 24h", async () => {
    process.env.FREE_TIER_BROKER_SCAN_MAX_PER_24H = "1";

    const email = `scan_cap_${randomUUID()}@example.com`;
    const password = "password12345";

    const reg = await request(app)
      .post("/api/auth/register")
      .send({ email, password })
      .expect(201);
    const token = reg.body.data.accessToken as string;

    const first = await request(app)
      .post("/api/broker-scan/start")
      .set("Authorization", `Bearer ${token}`);

    if (first.status === 503) {
      await prisma.user.deleteMany({ where: { email } });
      throw new Error(
        "Broker catalog empty — run prisma seed in this database for this test."
      );
    }

    expect(first.status).toBe(201);
    expect(first.body.ok).toBe(true);

    const second = await request(app)
      .post("/api/broker-scan/start")
      .set("Authorization", `Bearer ${token}`)
      .expect(429);

    expect(second.body.ok).toBe(false);
    expect(second.body.error?.code).toBe("scan_rate_limited");
    expect(typeof second.body.error?.retryAfterSeconds).toBe("number");
    expect(second.body.error.retryAfterSeconds).toBeGreaterThan(0);
    expect(second.headers["retry-after"]).toBeDefined();

    await prisma.user.deleteMany({ where: { email } });
  });
});
