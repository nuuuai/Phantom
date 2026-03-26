import "express-async-errors";
import cors from "cors";
import express from "express";
import { resolveCorsOrigins } from "./lib/corsOrigins.js";
import { prisma } from "./lib/prisma.js";
import { pingRedis } from "./lib/redis.js";
import { createGlobalRateLimiter } from "./lib/redisRateLimiter.js";
import { authenticateJwt } from "./middleware/authJwt.js";
import { errorJsonHandler } from "./middleware/errorJson.js";
import { jsonBody } from "./middleware/jsonBody.js";
import { notFoundJson } from "./middleware/notFoundJson.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { requestLog } from "./middleware/requestLog.js";
import { authRouter } from "./routes/auth.js";
import { billingRouter } from "./routes/billing.js";
import { aliasesRouter } from "./routes/aliases.js";
import { brokerScanRouter } from "./routes/brokerScan.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { notificationsRouter } from "./routes/notifications.js";
import { emailInboxRouter } from "./routes/emailInbox.js";
import { userRouter } from "./routes/user.js";
import { vaultRouter } from "./routes/vault.js";
import { stripeWebhookRouter } from "./routes/stripeWebhook.js";
import { webhookEmailInboundRouter } from "./routes/webhookEmailInbound.js";
import { phoneRouter } from "./routes/phone.js";
import { darkWebRouter } from "./routes/darkWeb.js";

const globalRateLimiter = createGlobalRateLimiter();

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  // Middleware order: cors → requestLog → raw webhooks → jsonBody → rateLimit → routes → notFoundJson → errorJsonHandler
  app.use(
    cors({
      origin: resolveCorsOrigins(),
      credentials: true,
    })
  );
  app.use(requestIdMiddleware);
  app.use(requestLog);
  app.use("/api/webhooks", webhookEmailInboundRouter);
  app.use("/api/webhooks", stripeWebhookRouter);
  app.use(jsonBody);
  app.use(globalRateLimiter);

  /** Liveness: process up (no DB). Use for orchestrator restarts. */
  app.get("/health/live", (_req, res) => {
    res.status(200).json({ status: "ok", service: "phantom-api" });
  });

  /** Readiness: DB (+ Redis status when configured). Use for traffic routing. */
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
  app.use("/api/email-inbox", authenticateJwt, emailInboxRouter);
  app.use("/api/aliases", authenticateJwt, aliasesRouter);
  app.use("/api/phone", authenticateJwt, phoneRouter);
  app.use("/api/broker-scan", authenticateJwt, brokerScanRouter);
  app.use("/api/notifications", authenticateJwt, notificationsRouter);
  app.use("/api/dashboard", authenticateJwt, dashboardRouter);
  app.use("/api/dark-web", authenticateJwt, darkWebRouter);
  app.use("/api/vault", authenticateJwt, vaultRouter);
  app.use("/api/billing", authenticateJwt, billingRouter);

  app.use(notFoundJson);
  app.use(errorJsonHandler);

  return app;
}
