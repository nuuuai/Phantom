import { stripeConfigured } from "./stripeClient.js";

/**
 * One-line startup summary for operators (no secret values).
 */
export function logOperatorConfigSummary(): void {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const port = process.env.API_PORT ?? "8787";
  const jwtRs256 = Boolean(
    process.env.JWT_PRIVATE_KEY?.trim() && process.env.JWT_PUBLIC_KEY?.trim()
  );
  const jwtMode = jwtRs256 ? "RS256" : "HS256";
  const redisUrl = process.env.REDIS_URL?.trim();
  const redis = !redisUrl
    ? "disabled"
    : redisUrl.length > 0
      ? "configured"
      : "disabled";

  const sk = Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  const wh = Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim());
  const price = Boolean(process.env.STRIPE_PRICE_PAID_MONTHLY?.trim());
  const dash = Boolean(process.env.DASHBOARD_PUBLIC_URL?.trim());

  let stripe: string;
  if (stripeConfigured()) {
    stripe = "checkout+webhook+price";
  } else if (sk || wh || price) {
    stripe = "incomplete (need STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET + STRIPE_PRICE_PAID_MONTHLY for billing)";
  } else {
    stripe = "not configured (billing routes return 503)";
  }

  const inbound = process.env.INBOUND_WEBHOOK_SECRET?.trim();
  const inboundState =
    inbound && inbound.length >= 16
      ? "secret set (email-inbound webhook enabled)"
      : "secret unset (POST /api/webhooks/email-inbound returns 503)";

  const hibp = Boolean(process.env.DARK_WEB_HIBP_API_KEY?.trim());
  const darkWeb = hibp
    ? "DARK_WEB_HIBP_API_KEY set (paid tier can call HIBP on refresh)"
    : "DARK_WEB_HIBP_API_KEY unset (dark web refresh skips external lookup)";

  const lines = [
    `phantom-api config: NODE_ENV=${nodeEnv} API_PORT=${port}`,
    `  jwt: ${jwtMode}  redis: ${redis}  stripe: ${stripe}`,
    `  DASHBOARD_PUBLIC_URL: ${dash ? "set" : "unset (billing uses localhost default)"}`,
    `  email inbound: ${inboundState}`,
    `  dark web: ${darkWeb}`,
  ];

  if (nodeEnv === "production" && redis === "disabled") {
    lines.push(
      "  warn: REDIS_URL unset in production — refresh tokens are in-memory (single instance only); see DEPLOYMENT.md"
    );
  }

  if (nodeEnv === "production" && sk && !stripeConfigured()) {
    lines.push(
      "  warn: STRIPE_SECRET_KEY set but Stripe billing is incomplete — webhook verification or price id missing"
    );
  }

  process.stdout.write(`${lines.join("\n")}\n`);
}
