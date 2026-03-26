import { createHmac } from "node:crypto";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";

describe("POST /api/webhooks/email-inbound", () => {
  const app = createApp();

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 503 when INBOUND_WEBHOOK_SECRET is unset", async () => {
    vi.stubEnv("INBOUND_WEBHOOK_SECRET", "");
    const res = await request(app)
      .post("/api/webhooks/email-inbound")
      .set("Content-Type", "application/json")
      .send("{}");
    expect(res.status).toBe(503);
    expect(res.headers["x-phantom-request-id"]).toBeDefined();
  });

  it("returns 415 when Content-Type is not application/json", async () => {
    vi.stubEnv("INBOUND_WEBHOOK_SECRET", "sixteen_characters_long_secret");
    const res = await request(app)
      .post("/api/webhooks/email-inbound")
      .set("Content-Type", "text/plain")
      .send("not-json");
    expect(res.status).toBe(415);
  });

  it("returns 401 when signature is invalid", async () => {
    vi.stubEnv("INBOUND_WEBHOOK_SECRET", "sixteen_characters_long_secret");
    const payload = JSON.stringify({ aliasAddress: "a@phantom.id" });
    const res = await request(app)
      .post("/api/webhooks/email-inbound")
      .set("Content-Type", "application/json")
      .set("X-Phantom-Signature", "sha256=ab".repeat(32))
      .send(payload);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid JSON after valid signature", async () => {
    const secret = "sixteen_characters_long_secret";
    vi.stubEnv("INBOUND_WEBHOOK_SECRET", secret);
    const payload = "not-json{{{";
    const hex = createHmac("sha256", secret)
      .update(Buffer.from(payload, "utf8"))
      .digest("hex");
    const res = await request(app)
      .post("/api/webhooks/email-inbound")
      .set("Content-Type", "application/json")
      .set("X-Phantom-Signature", `sha256=${hex}`)
      .send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe("invalid_json");
  });
});
