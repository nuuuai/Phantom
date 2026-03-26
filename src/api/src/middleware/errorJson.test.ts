import "express-async-errors";
import express from "express";
import type { RequestHandler } from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { errorJsonHandler } from "./errorJson.js";
import "./requestId.js";

const setTestRequestId: RequestHandler = (req, _res, next) => {
  req.requestId = "err-test-req-id";
  next();
};

describe("errorJsonHandler", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

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

  it("includes error.requestId when NODE_ENV is not production and req.requestId is set", async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const app = express();
    app.use(setTestRequestId);
    app.get("/boom", () => {
      throw new Error("something broke");
    });
    app.use(errorJsonHandler);
    const res = await request(app).get("/boom").expect(500);
    expect(res.body.error.requestId).toBe("err-test-req-id");
    process.env.NODE_ENV = prev;
  });
});
