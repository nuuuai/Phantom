# Deployment checklist (Phase 1)

Minimal path to run Phantom **API** + **dashboard** + **extension** in production-like config. **Secrets only via environment variables** (never commit real keys).

## Health checks (API)

| Endpoint | Use | Success |
|----------|-----|---------|
| `GET /health/live` | **Liveness** — process is up (no DB). Orchestrators can restart if this fails. | `200` JSON `{ "status": "ok", "service": "phantom-api" }` |
| `GET /health` | **Readiness** — DB reachable; `redis` is `ok`, `down`, or `disabled` when `REDIS_URL` is unset. Route traffic only when this returns `200`. | `200` with `db: "connected"` or `503` with `db: "disconnected"` |

Point load balancers / Kubernetes probes at these paths over HTTPS.

## API (`src/api`)

1. **Database:** `npx prisma migrate deploy` (from `src/api` or CI) after pulling migrations.
2. **Seed (optional):** `npm run db:seed -w @phantom/api` for dev catalog + demo user — **not** required in production unless you want the broker catalog populated from seed (otherwise ensure `DataBroker` rows exist).

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` (≥16 chars) **or** `JWT_PRIVATE_KEY` + `JWT_PUBLIC_KEY` | Yes | Access JWT signing (HS256 vs RS256) |
| `REDIS_URL` | Recommended | Refresh-token sessions + optional global rate limit |
| `CORS_ORIGIN` | Recommended prod | Comma-separated dashboard origins (credentials enabled) |
| `DASHBOARD_PUBLIC_URL` | For billing | Stripe Checkout success/cancel + Billing Portal return URLs |
| `STRIPE_SECRET_KEY` | For paid tier | Stripe API (`sk_live_…` / `sk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | For paid tier | Verify `POST /api/webhooks/stripe` (`whsec_…`) |
| `STRIPE_PRICE_PAID_MONTHLY` | For Checkout | Price ID for Pro subscription |
| `INBOUND_WEBHOOK_SECRET` | If email inbound used | HMAC for `POST /api/webhooks/email-inbound` |

**Stripe (production):** In the Stripe Dashboard, add webhook endpoint `https://<api-host>/api/webhooks/stripe` and subscribe at least to:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

The handler updates `User.tier`, `stripeCustomerId`, `stripeSubscriptionId`, and `subscriptionStatus` from verified events only.

## Dashboard (`src/dashboard`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Full API origin in production (e.g. `https://api.example.com`), or leave empty if the same host reverse-proxies `/api` |

Build: `npm run build -w @phantom/dashboard` — serve static assets over HTTPS.

## Extension

See [EXTENSION_STORE_BUILD.md](./EXTENSION_STORE_BUILD.md) and [CHROME_WEB_STORE_CHECKLIST.md](./CHROME_WEB_STORE_CHECKLIST.md).

| Variable | Purpose |
|----------|---------|
| `PLASMO_PUBLIC_API_URL` | **HTTPS** API origin baked into the MV3 bundle at build time |

## CI

`.github/workflows/ci.yml` runs migrate, lint, test, and full monorepo build against Postgres — keep green before release.

**Integration tests** (`src/api/src/launch.integration.test.ts`, `auth.integration.test.ts`) run when `DATABASE_URL` is set to a **real** database (not the vitest `phantom_placeholder` URL). They are skipped in the default local test run without Postgres. **GitHub Actions** sets `DATABASE_URL` to the service container so these tests execute in CI.

## External blockers (not in repo)

| Item | Notes |
|------|--------|
| **DNS / TLS** | Certificates and API + dashboard hostnames |
| **Chrome Web Store** | Developer account, listing, review time |
| **Legal** | Privacy policy URL, ToS — see [CHROME_WEB_STORE_CHECKLIST.md](./CHROME_WEB_STORE_CHECKLIST.md) |
| **Stripe live mode** | Live keys + live webhook endpoint URL after API is on a public HTTPS host |
