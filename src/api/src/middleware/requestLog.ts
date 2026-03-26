import type { RequestHandler } from "express";

/** Logs each request so the terminal shows traffic immediately. */
export const requestLog: RequestHandler = (req, _res, next) => {
  const path = req.originalUrl ?? req.url ?? "";
  process.stdout.write(`[${req.method}] ${path}\n`);
  next();
};
