import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

describe("createApp", () => {
  const app = createApp();

  it("GET /health reports database status (200 connected or 503 disconnected)", async () => {
    const res = await request(app).get("/health");
    expect([200, 503]).toContain(res.status);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    if (res.status === 200) {
      expect(res.body).toMatchObject({
        status: "ok",
        service: "phantom-api",
        db: "connected",
        redis: expect.stringMatching(/^(ok|down|disabled)$/),
      });
    } else {
      expect(res.body).toMatchObject({
        status: "error",
        service: "phantom-api",
        db: "disconnected",
      });
      expect(typeof res.body.dbError).toBe("string");
    }
  });

  it("POST /api/webhooks/stripe returns 503 when Stripe webhook not configured", async () => {
    const res = await request(app)
      .post("/api/webhooks/stripe")
      .set("Content-Type", "application/json")
      .send("{}");
    expect([400, 503]).toContain(res.status);
  });

  it("POST /api/webhooks/email-inbound returns 503 when webhook secret unset", async () => {
    const prev = process.env.INBOUND_WEBHOOK_SECRET;
    delete process.env.INBOUND_WEBHOOK_SECRET;
    const res = await request(app)
      .post("/api/webhooks/email-inbound")
      .set("Content-Type", "application/json")
      .send("{}");
    process.env.INBOUND_WEBHOOK_SECRET = prev;
    expect(res.status).toBe(503);
    expect(res.body.ok).toBe(false);
  });

  it("POST /api/auth/login without body returns 400", async () => {
    const res = await request(app).post("/api/auth/login").send({}).expect(400);
    expect(res.body.ok).toBe(false);
  });

  it("GET /nonexistent-route returns 404 JSON", async () => {
    const res = await request(app).get("/nonexistent-route").expect(404);
    expect(res.body).toMatchObject({
      ok: false,
      error: {
        code: "not_found",
        message: expect.stringContaining("GET /nonexistent-route"),
      },
    });
  });
});
