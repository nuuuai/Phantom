import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

describe("createApp", () => {
  const app = createApp();

  it("GET /health returns ok and redis state", async () => {
    const res = await request(app).get("/health").expect(200);
    expect(res.body).toMatchObject({
      status: "ok",
      service: "phantom-api",
      redis: expect.stringMatching(/^(ok|down|disabled)$/),
    });
  });

  it("POST /api/auth/login without body returns 400", async () => {
    const res = await request(app).post("/api/auth/login").send({}).expect(400);
    expect(res.body.ok).toBe(false);
  });
});
