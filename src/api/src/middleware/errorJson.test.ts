import "express-async-errors";
import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { errorJsonHandler } from "./errorJson.js";

describe("errorJsonHandler", () => {
  it("responds with JSON when handler throws (JWT config)", async () => {
    const app = express();
    app.get("/boom", () => {
      throw new Error(
        "JWT_SECRET must be set (at least 16 characters) outside of test mode"
      );
    });
    app.use(errorJsonHandler);
    const res = await request(app).get("/boom").expect(503);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body).toMatchObject({
      ok: false,
      error: {
        code: "service_unavailable",
        message: "Server configuration error (JWT secret)",
      },
    });
  });

  it("responds with JSON for generic errors", async () => {
    const app = express();
    app.get("/boom", () => {
      throw new Error("something broke");
    });
    app.use(errorJsonHandler);
    const res = await request(app).get("/boom").expect(500);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe("server_error");
  });
});
