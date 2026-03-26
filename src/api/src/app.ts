import "express-async-errors";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { authenticateJwt } from "./middleware/authJwt.js";
import { errorJsonHandler } from "./middleware/errorJson.js";
import { jsonBody } from "./middleware/jsonBody.js";
import { authRouter } from "./routes/auth.js";
import { aliasesRouter } from "./routes/aliases.js";
import { brokerScanRouter } from "./routes/brokerScan.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { notificationsRouter } from "./routes/notifications.js";
import { userRouter } from "./routes/user.js";
import { vaultRouter } from "./routes/vault.js";
import { pingRedis } from "./lib/redis.js";

const rateLimitStub = rateLimit({
  windowMs: 60_000,
  max: 10_000,
  standardHeaders: true,
  legacyHeaders: false,
});

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  // Production: set CORS_ORIGIN to comma-separated dashboard/extension origins (see .env.example).
  app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? true }));
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
    res.json({
      status: "ok",
      service: "phantom-api",
      redis,
    });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/user", authenticateJwt, userRouter);
  app.use("/api/aliases", authenticateJwt, aliasesRouter);
  app.use("/api/broker-scan", authenticateJwt, brokerScanRouter);
  app.use("/api/notifications", authenticateJwt, notificationsRouter);
  app.use("/api/dashboard", authenticateJwt, dashboardRouter);
  app.use("/api/vault", authenticateJwt, vaultRouter);

  app.use(errorJsonHandler);

  return app;
}
