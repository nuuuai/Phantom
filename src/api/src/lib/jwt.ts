import jwt from "jsonwebtoken";

function getJwtSecret(): string {
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv && fromEnv.length >= 16) {
    return fromEnv;
  }
  if (process.env.NODE_ENV === "test") {
    return "test_jwt_secret_for_tests_only!!";
  }
  throw new Error(
    "JWT_SECRET must be set (at least 16 characters) outside of test mode"
  );
}

export interface JwtPayload {
  sub: string;
  email: string;
}

export function signAccessToken(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email }, getJwtSecret(), {
    expiresIn: "15m",
    issuer: "phantom-api",
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, getJwtSecret(), {
    issuer: "phantom-api",
  });
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
