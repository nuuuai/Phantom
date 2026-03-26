import type { RequestHandler } from "express";

export interface AuthedRequestUser {
  id: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthedRequestUser;
  }
}

/** Stub: accepts `Authorization: Bearer <token>` or assigns a demo user. */
export const authStub: RequestHandler = (req, _res, next) => {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  req.user = {
    id: token && token.length > 0 ? `user_${token.slice(0, 8)}` : "user_demo",
  };
  next();
};
