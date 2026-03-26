import { createPrivateKey, createPublicKey } from "node:crypto";
import jwt from "jsonwebtoken";

function pemFromEnv(name: string): string {
  const raw = process.env[name];
  if (!raw || raw.length === 0) return "";
  return raw.replace(/\\n/g, "\n").trim();
}

function hasRs256Keys(): boolean {
  const priv = pemFromEnv("JWT_PRIVATE_KEY");
  const pub = pemFromEnv("JWT_PUBLIC_KEY");
  if (!priv || !pub) return false;
  try {
    createPrivateKey(priv);
    createPublicKey(pub);
    return true;
  } catch {
    return false;
  }
}

function getJwtSecret(): string {
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv && fromEnv.length >= 16) {
    return fromEnv;
  }
  if (process.env.NODE_ENV === "test") {
    return "test_jwt_secret_for_tests_only!!";
  }
  throw new Error(
    "JWT_SECRET must be set (at least 16 characters) outside of test mode when RS256 keys are not configured"
  );
}

export interface JwtPayload {
  sub: string;
  email: string;
}

export function signAccessToken(userId: string, email: string): string {
  const payload = { sub: userId, email };
  const opts = { expiresIn: "15m" as const, issuer: "phantom-api" };

  if (hasRs256Keys()) {
    const privateKey = pemFromEnv("JWT_PRIVATE_KEY");
    return jwt.sign(payload, privateKey, { ...opts, algorithm: "RS256" });
  }

  return jwt.sign(payload, getJwtSecret(), opts);
}

export function verifyAccessToken(token: string): JwtPayload {
  const opts = { issuer: "phantom-api" };

  if (hasRs256Keys()) {
    const publicKey = pemFromEnv("JWT_PUBLIC_KEY");
    const decoded = jwt.verify(token, publicKey, {
      ...opts,
      algorithms: ["RS256"],
    });
    return assertPayload(decoded);
  }

  const decoded = jwt.verify(token, getJwtSecret(), opts);
  return assertPayload(decoded);
}

function assertPayload(decoded: jwt.JwtPayload | string): JwtPayload {
  if (
    typeof decoded !== "object" ||
    decoded === null ||
    !("sub" in decoded) ||
    !("email" in decoded)
  ) {
    throw new Error("invalid_token");
  }
  const sub = decoded.sub;
  const email = decoded.email;
  if (typeof sub !== "string" || typeof email !== "string") {
    throw new Error("invalid_token");
  }
  return { sub, email };
}
