# Deployment checklist (Phase 1)

Minimal path to run Phantom **API** + **dashboard** + **extension** in production-like config. **Secrets only via environment variables** (never commit real keys).

**AWS / Terraform:** A minimal Terraform **root** lives at [`infra/terraform/`](../../infra/terraform/) (validate with `terraform validate` when the CLI is installed). No AWS resources are defined yet. See [`INFRA_AWS_PHASE1.md`](./INFRA_AWS_PHASE1.md) for the recommended layout, health probes, and prod parity with CI.

## Production parity (quick)

- **API process:** `NODE_ENV=production` (standard Express/Node behavior; not strictly required for health routes). On startup the API logs a **non-secret** config summary (JWT mode, Redis, Stripe completeness, inbound webhook, `DASHBOARD_PUBLIC_URL`) and **fails fast** if JWT is not configured (`JWT_PRIVATE_KEY`+`JWT_PUBLIC_KEY` **or** `JWT_SECRET` ≥16 chars).
- **Same env names** as [`.env.example`](../../.env.example) at repo root; production values from your secret store.
- **Database:** run **`prisma migrate deploy`** before serving traffic (same as CI migrate step).

## Local stack (`docker-compose.yml`)

The repo includes **Postgres**, **Redis**, and **Elasticsearch** (optional for Phase 1 threat-intel placeholders). Run from the repo root:

```bash
docker compose up -d postgres redis
```

| Service | Default port | Env for API |
|---------|--------------|-------------|
| Postgres | `5432` | `DATABASE_URL=postgresql://${POSTGRES_USER:-phantom}:${POSTGRES_PASSWORD:-phantom_dev_password}@localhost:5432/${POSTGRES_DB:-phantom}` |
| Redis | `6379` | `REDIS_URL=redis://localhost:6379` |

### Redis keys (Phase 1)

| Key pattern | TTL | Purpose |
|-------------|-----|---------|
| `phantom:refresh:<sha256(opaque refresh token)>` | **7 days** (`604800` s) | Maps refresh token → `userId`; **no** plaintext token in Redis (`refreshTokens.ts`). New refresh is stored before old is deleted on rotation. |
| (internal) | per-window | When `REDIS_URL` is set, the global HTTP limiter uses **`rate-limit-redis`**; key names are defined by `express-rate-limit` — not application-prefixed. |

The **API and dashboard are not containerized** in this compose file: run `npm run dev` (or production `node` after `npm run build`) on the host against these services. Elasticsearch is only needed if you enable ES-backed features later; omit it for standard Phase 1 API + dashboard + extension.

## Health checks (API)

| Endpoint | Use | Success |
|----------|-----|---------|
| `GET /health/live` | **Liveness** — process is up (no DB). Orchestrators can restart if this fails. | `200` JSON `{ "status": "ok", "service": "phantom-api" }` |
| `GET /health` | **Readiness** — DB reachable; `redis` is `ok`, `down`, or `disabled` when `REDIS_URL` is unset. Route traffic only when this returns `200`. | `200` with `db: "connected"` or `503` with `db: "disconnected"` |

Point load balancers / Kubernetes probes at these paths over HTTPS.

## Request tracing and errors

- Every response includes **`X-Request-Id`** (echoed from the incoming `X-Request-Id` header when present, otherwise generated).
- Unhandled API errors log one **JSON line** to stderr (`level`, `service`, `ts`, `method`, `path`, `requestId`, `httpStatus`, `errorCode`, `message`) plus a stack trace for operators; clients still receive a generic JSON body in production (see `errorJson` middleware).

## API (`src/api`)

1. **Database:** `npx prisma migrate deploy` (from `src/api` or CI) after pulling migrations.
2. **Seed (optional):** `npm run db:seed -w @phantom/api` for dev catalog + demo user — **not** required in production unless you want the broker catalog populated from seed (otherwise ensure `DataBroker` rows exist).

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NODE_ENV` | Optional | `development` (default) vs `production` — affects error detail in JSON and startup warnings (Redis in prod, partial Stripe). |
| `API_PORT` | Optional | API listen port (default **8787**). |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` (≥16 chars) **or** `JWT_PRIVATE_KEY` + `JWT_PUBLIC_KEY` | Yes | Access JWT signing (**HS256** vs **RS256**). **RS256:** PEM in env (`\n` as `\\n`); invalid PEM → **`assertJwtEnvConfigured`** fails at startup. **HS256:** dev default; do not set RS256 keys unless you intend RS256. Claims: **`sub`**, **`email`**, **`iss`** `phantom-api`, **`iat`/`exp`**; verify uses **`clockTolerance` 60s** for client/server skew (`jwt.ts`). |
| `REDIS_URL` | Recommended | **Required for production auth UX:** opaque refresh-token store + rotation (`POST /api/auth/refresh`, logout). If unset, **login/register still return an access JWT** but **omit `refreshToken`** when Redis cannot store it; **`POST /api/auth/refresh`** returns **503** `service_unavailable`. **`GET /health`** reports `redis: "ok"` \| `"down"` \| `"disabled"`. Also enables **optional** Redis-backed global HTTP rate limiting when `REDIS_URL` is set (`src/api/src/lib/redisRateLimiter.ts`); otherwise the limiter uses an in-memory store (fine for single-node dev). **Behavior when Redis is misbehaving:** refresh-token **reads/writes fail closed** (no new session / invalid refresh) so tokens are not silently accepted without storage; the **global HTTP rate limiter fails open** (`passOnStoreError`) so a Redis outage does not block all traffic — protect abuse with auth and per-route limits. |
| `CORS_ORIGIN` | Recommended prod | Comma-separated dashboard origins (credentials enabled) |
| `DASHBOARD_PUBLIC_URL` | For billing | Stripe Checkout success/cancel + Billing Portal return URLs |
| `STRIPE_SECRET_KEY` | For paid tier | Stripe API (`sk_live_…` / `sk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | For paid tier | Verify `POST /api/webhooks/stripe` (`whsec_…`) |
| `STRIPE_PRICE_PAID_MONTHLY` | For Checkout | Price ID for Pro subscription |
| `INBOUND_WEBHOOK_SECRET` | If email inbound used | **≥16 chars.** HMAC-SHA256 over **raw** JSON body; header `X-Phantom-Signature: sha256=<hex>`. Wrong `Content-Type` → **415**; bad signature → **401**. Inbound worker POST URL: `https://<api-host>/api/webhooks/email-inbound` (see **`EMAIL_INBOUND.md`**). |
| `BROKER_SCAN_CONCURRENCY` | Optional | If set, must be integer **1–32** (not e.g. `99`). Invalid values cause **`POST /api/broker-scan/start`** to return **503** `broker_scan_config_invalid`. Default **8** when unset. |
| `BROKER_SCAN_WORKER_DELAY_MS` | Optional | Per-broker delay range: **`min-max`** ms with exactly one hyphen (e.g. **`5-25`**). Invalid or out-of-range values → **503** `broker_scan_config_invalid`. Default **5–25** when unset. See `validateBrokerScanRuntimeConfig` in `brokerScanPipeline.ts`. |
| `FREE_TIER_BROKER_SCAN_MAX_PER_24H` | Optional | **Free tier only:** max full broker scans per rolling 24h (default **3**). Set `unlimited` or `0` to disable the cap (dev/staging). Paid tiers ignore this. When exceeded, **`POST /api/broker-scan/start`** returns **429** `scan_rate_limited`, **`Retry-After`** header, and JSON **`error.retryAfterSeconds`** (prior scan runs are **not** deleted). |
| `PHONE_PROVIDER` | Optional | **`mock`** (default) or **`twilio`**. Unknown values fall back to **mock** with a warning in **`GET /api/phone/provider`** (still **200**). |
| `TWILIO_ACCOUNT_SID` | If `PHONE_PROVIDER=twilio` | Non-empty **AC…** SID required for Twilio stub + dashboard “ready” state. If missing: **`GET /api/phone/provider`** → **503** `phone_provider_unavailable`; **`POST /api/aliases/generate`** / **`…/rotate`** (phone) → **503** same code. PSTN/SMS remain unwired in Phase 1. |
| `TWILIO_AUTH_TOKEN` | Future | Reserved for real Twilio Number API / webhooks (not used in Phase 1 stub). |
| `TWILIO_FROM_NUMBER` | Future | Reserved for outbound caller ID / SMS. |
| `NOTIFICATIONS_EMAIL_ENABLED` | Optional (future) | **`0`** / unset = no outbound email (Phase 1 default). **Not read by `src/api` application code today** — reserved for a future outbound worker; `.env.example` documents the placeholder so ops can plan. In-app **`/api/notifications`** + dashboard bell require **no** env. When a worker is added, set to **`1`** and supply provider keys — see **`EMAIL_INBOUND.md`** / **`QA_MANUAL.md`**. |
| `DARK_WEB_HIBP_API_KEY` | Optional | **Have I Been Pwned** API key for **`POST /api/dark-web/refresh`** (paid/enterprise only). When **unset**, refresh returns **`skippedNoApiKey: true`** and **no** external call — dashboard shows an honest empty state. This is **public breach corpus lookup** for the account email, **not** 24/7 dark-web marketplace monitoring. Respect HIBP rate limits; the API never logs raw email addresses in responses. |

**Vault (E2E):** `User.vaultSyncCiphertext` and `vaultSyncVersion` hold an **opaque** encrypted blob produced by the client (**PBKDF2** + **AES-GCM** per `AUTH_AND_VAULT_PHASE1.md`). The API never receives the vault passphrase or plaintext passwords; do not log ciphertext bodies. **`409`** on **`PUT /api/vault/sync`** means another client wrote first — clients must **GET**, merge, and retry.

**Tier limits (API):** Free tier alias caps are enforced on **`POST /api/aliases/generate`** — **`403`** with **`error.code: "tier_limit"`**, human **`message`**, and optional **`error.tierLimit: { aliasType, used, max }`** (machine-readable). Paid/enterprise skips counting. Broker scan frequency uses **`429`** **`scan_rate_limited`**; removal queue uses **`403`** **`upgrade_required`**. Per-type caps (**email 3**, **phone 1**, **username 5**, **password 25** on free tier) are defined in code as **`FREE_TIER_ALIAS_MAX`** in `@phantom/shared` (`src/shared/src/constants/tierLimits.ts`) — **not** overridden by environment variables. **`GET /api/user/me`** returns **`aliasUsage`** aligned with the same limits.

**Stripe (production):** Stripe delivers webhooks **at-least-once** (retries on non-`2xx` or timeouts). The API **claims** each `event.id` in **`StripeWebhookEvent`** *before* running handlers so duplicate deliveries return **`200`** with **`duplicate: true`** without re-applying side effects. Handler failures return **`500`** and **delete** the claim row so Stripe can retry safely.

In the Stripe Dashboard, add webhook endpoint `https://<api-host>/api/webhooks/stripe` and subscribe at least to:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

The handler updates `User.tier`, `stripeCustomerId`, `stripeSubscriptionId`, and `subscriptionStatus` from verified events only. After a successful handler run, the API records Stripe’s **`event.id`** in **`StripeWebhookEvent`**; duplicate deliveries return **`200`** with **`{ "received": true, "duplicate": true }`** (handlers remain safe to run twice — e.g. Checkout session apply is idempotent).

**Return from Checkout:** Stripe redirects to `DASHBOARD_PUBLIC_URL/billing?session_id=…`. The dashboard calls **`POST /api/billing/sync-checkout-session`** (authenticated, body `{ "sessionId": "cs_…" }`) to apply the same Pro upgrade if the webhook is delayed — safe and idempotent for the owning user.

## Dashboard (`src/dashboard`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Full API origin in production (e.g. `https://api.example.com`), or leave empty if the same host reverse-proxies `/api` |

**Settings / account:** **`PATCH /api/user/me`** (`forwardToEmail`) requires no extra dashboard env — validation is server-side. Notification prefs use the same authenticated API as the bell (**`GET`/`PUT /api/notifications/preferences`**); no separate dashboard flag. Outbound email for alerts remains gated by **`NOTIFICATIONS_EMAIL_ENABLED`** on the API (see table above).

Build: `npm run build -w @phantom/dashboard` — serve static assets over HTTPS.

## Extension

See [EXTENSION_STORE_BUILD.md](./EXTENSION_STORE_BUILD.md) and [CHROME_WEB_STORE_CHECKLIST.md](./CHROME_WEB_STORE_CHECKLIST.md).

| Variable | Purpose |
|----------|---------|
| `PLASMO_PUBLIC_API_URL` | **HTTPS** API origin baked into the MV3 bundle at build time (default `http://localhost:8787` for dev) |

**Calling the API from the extension:** The MV3 service worker uses `fetch` to the origin declared in **`host_permissions`** (see extension `package.json` → Plasmo `manifest`). Chrome grants the extension access to those hosts without relying on the same **CORS** rules as a normal web page; you still need **`host_permissions`** to cover your production API hostname (and `http://localhost:8787/*` for local dev). The **dashboard** uses browser `fetch` with `VITE_API_URL` as the API base; the **dashboard’s own origin** (where static assets are served) must be listed in **`CORS_ORIGIN`** on the API when using credentials. Users can override the effective API origin at runtime via the extension **options** page (`chrome.storage.local` key `phantom_api_base_url`); invalid overrides are cleared on extension **update**.

**Connectivity check:** Use **`GET /health/live`** or **`GET /health`** against the configured API base (no auth). Authenticated flows use **`GET /api/user/me`** after sign-in.

## CI

**Same commands as [CHROME_WEB_STORE_CHECKLIST.md](./CHROME_WEB_STORE_CHECKLIST.md) pre-submit** (repo root, Node 20, Postgres service in Actions):

| Step | Command |
|------|---------|
| Install | `npm ci` |
| Migrate | `npm run db:migrate:deploy -w @phantom/api` |
| Seed | `npm run db:seed -w @phantom/api` |
| Lint | `npm run lint` |
| Test | `npm run test` |
| Build | `npm run build` |
| Terraform (optional) | `cd infra/terraform && terraform init -backend=false && terraform validate` — validates the placeholder root module; **no AWS resources** (see `INFRA_AWS_PHASE1.md`) |

Workflow: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) runs the first six steps, then **Terraform validate** on `infra/terraform/`. **Concurrency:** new pushes to the same branch cancel an in-flight run (`cancel-in-progress`) so the latest commit is what CI finishes on. Keep green before release.

**Integration tests** (`launch.integration.test.ts`, `auth.integration.test.ts`, `authSession.integration.test.ts`, `billingSyncSession.integration.test.ts`, `brokerScanQuota.integration.test.ts`, …) run when `DATABASE_URL` is set to a **real** database (not the vitest `phantom_placeholder` URL). They are skipped in the default local test run without Postgres. **GitHub Actions** defines **Postgres 16** and **Redis 7** services and sets **`DATABASE_URL`**, **`REDIS_URL=redis://localhost:6379`** (see the workflow) so refresh-token rotation tests can run. **Seed** supplies **`DataBroker`** rows so broker-quota integration tests run. For local parity, use a real Postgres URL in `.env`, **`docker compose up -d redis`** (or cloud Redis), **`REDIS_URL`**, and `npm run db:seed -w @phantom/api` after migrate.

## External blockers (not in repo)

| Item | Notes |
|------|--------|
| **DNS / TLS** | Certificates and API + dashboard hostnames |
| **Chrome Web Store** | Developer account, listing, review time |
| **Legal** | Privacy policy URL, ToS — see [CHROME_WEB_STORE_CHECKLIST.md](./CHROME_WEB_STORE_CHECKLIST.md) |
| **Stripe live mode** | Live keys + live webhook endpoint URL after API is on a public HTTPS host |
