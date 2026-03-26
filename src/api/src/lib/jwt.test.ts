import { generateKeyPairSync } from "node:crypto";
import jwt from "jsonwebtoken";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertJwtEnvConfigured,
  signAccessToken,
  verifyAccessToken,
} from "./jwt.js";

describe("jwt", () => {
  const savedPriv = process.env.JWT_PRIVATE_KEY;
  const savedPub = process.env.JWT_PUBLIC_KEY;
  const savedSecret = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.JWT_PRIVATE_KEY = savedPriv;
    process.env.JWT_PUBLIC_KEY = savedPub;
    process.env.JWT_SECRET = savedSecret;
  });

  describe("HS256 (JWT_SECRET)", () => {
    beforeEach(() => {
      delete process.env.JWT_PRIVATE_KEY;
      delete process.env.JWT_PUBLIC_KEY;
      process.env.JWT_SECRET = "test_jwt_secret_for_tests_only!!";
    });

    it("round-trips access token", () => {
      const t = signAccessToken("user-1", "a@b.com");
      const p = verifyAccessToken(t);
      expect(p).toEqual({ sub: "user-1", email: "a@b.com" });
    });

    it("rejects expired token (exp far in the past; not within clockTolerance)", () => {
      const t = jwt.sign(
        {
          sub: "u",
          email: "e@e.com",
          iss: "phantom-api",
          exp: Math.floor(Date.now() / 1000) - 86_400,
        },
        process.env.JWT_SECRET!,
        { algorithm: "HS256" }
      );
      expect(() => verifyAccessToken(t)).toThrow();
    });

    it("rejects tampered token", () => {
      const t = signAccessToken("user-1", "a@b.com");
      const tampered = t.slice(0, -4) + "xxxx";
      expect(() => verifyAccessToken(tampered)).toThrow();
    });
  });

  describe("RS256 (JWT_PRIVATE_KEY / JWT_PUBLIC_KEY)", () => {
    beforeEach(() => {
      const { privateKey, publicKey } = generateKeyPairSync("rsa", {
        modulusLength: 2048,
      });
      process.env.JWT_PRIVATE_KEY = privateKey.export({
        type: "pkcs1",
        format: "pem",
      }) as string;
      process.env.JWT_PUBLIC_KEY = publicKey.export({
        type: "spki",
        format: "pem",
      }) as string;
      process.env.JWT_SECRET = savedSecret ?? "test_jwt_secret_for_tests_only!!";
    });

    it("round-trips access token", () => {
      const t = signAccessToken("user-2", "c@d.com");
      const p = verifyAccessToken(t);
      expect(p).toEqual({ sub: "user-2", email: "c@d.com" });
    });

    it("rejects HS256 token when RS256 keys are configured", () => {
      const t = jwt.sign(
        { sub: "bad", email: "a@b.com", iss: "phantom-api" },
        process.env.JWT_SECRET!,
        { expiresIn: "15m", algorithm: "HS256" }
      );
      expect(() => verifyAccessToken(t)).toThrow();
    });
  });

  describe("assertJwtEnvConfigured", () => {
    it("no-ops in test mode (vitest)", () => {
      expect(() => assertJwtEnvConfigured()).not.toThrow();
    });

    it("throws in development when neither RS256 nor HS256 secret is set", () => {
      vi.stubEnv("NODE_ENV", "development");
      delete process.env.JWT_PRIVATE_KEY;
      delete process.env.JWT_PUBLIC_KEY;
      delete process.env.JWT_SECRET;
      expect(() => assertJwtEnvConfigured()).toThrow(/JWT:/);
      vi.unstubAllEnvs();
    });
  });
});
