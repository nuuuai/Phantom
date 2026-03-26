import "dotenv/config";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { authenticateJwt } from "./middleware/authJwt.js";
import { jsonBody } from "./middleware/jsonBody.js";
import { authRouter } from "./routes/auth.js";
import { aliasesRouter } from "./routes/aliases.js";
import { brokerScanRouter } from "./routes/brokerScan.js";
import { dashboardRouter } from "./routes/dashboard.js";

const app = express();
const port = Number(process.env.API_PORT ?? "8787");

const rateLimitStub = rateLimit({
  windowMs: 60_000,
  max: 10_000,
  standardHeaders: true,
  legacyHeaders: false,
});

app.disable("x-powered-by");
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? true }));
app.use(jsonBody);
app.use(rateLimitStub);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "phantom-api" });
});

app.use("/api/auth", authRouter);
app.use("/api/aliases", authenticateJwt, aliasesRouter);
app.use("/api/broker-scan", authenticateJwt, brokerScanRouter);
app.use("/api/dashboard", authenticateJwt, dashboardRouter);

app.listen(port, () => {
  process.stdout.write(`phantom-api listening on ${port}\n`);
});
