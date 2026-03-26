import "express-async-errors";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { resolveCorsOrigins } from "./lib/corsOrigins.js";
import { prisma } from "./lib/prisma.js";
import { pingRedis } from "./lib/redis.js";
import { authenticateJwt } from "./middleware/authJwt.js";
import { errorJsonHandler } from "./middleware/errorJson.js";
import { jsonBody } from "./middleware/jsonBody.js";
import { notFoundJson } from "./middleware/notFoundJson.js";
import { requestLog } from "./middleware/requestLog.js";
import { authRouter } from "./routes/auth.js";
import { aliasesRouter } from "./routes/aliases.js";
import { brokerScanRouter } from "./routes/brokerScan.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { notificationsRouter } from "./routes/notifications.js";
import { userRouter } from "./routes/user.js";
import { vaultRouter } from "./routes/vault.js";

const rateLimitStub = rateLimit({
  windowMs: 60_000,
  max: 10_000,
  standardHeaders: true,
  legacyHeaders: false,
});

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  // Middleware order: cors → requestLog → jsonBody → rateLimit → routes → notFoundJson → errorJsonHandler
  app.use(
    cors({
      origin: resolveCorsOrigins(),
      credentials: true,
    })
  );
  app.use(requestLog);
  app.use(jsonBody);
  app.use(rateLimitStub);

  app.get("/health", async (_req, res) => {
    const redisConfigured = Boolean(
      process.env.REDIS_URL && process.env.REDIS_URL.length > 0
    );
    let redis: "ok" | "down" | "disabled" = "disabled";
    if (redisConfigured) {
      redis = (await pingRedis()) ? "ok" : "down";
    }

    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({
        status: "ok",
        service: "phantom-api",
        db: "connected",
        redis,
      });
    } catch (err) {
      const dbError = err instanceof Error ? err.message : String(err);
      res.status(503).json({
        status: "error",
        service: "phantom-api",
        db: "disconnected",
        dbError,
        redis,
      });
    }
  });

  app.use("/api/auth", authRouter);
  app.use("/api/user", authenticateJwt, userRouter);
  app.use("/api/aliases", authenticateJwt, aliasesRouter);
  app.use("/api/broker-scan", authenticateJwt, brokerScanRouter);
  app.use("/api/notifications", authenticateJwt, notificationsRouter);
  app.use("/api/dashboard", authenticateJwt, dashboardRouter);
  app.use("/api/vault", authenticateJwt, vaultRouter);

  app.use(notFoundJson);
  app.use(errorJsonHandler);

  return app;
}
