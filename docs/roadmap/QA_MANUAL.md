# QA — automated vs manual (Phase 1)

**CI commands:** see [`DEPLOYMENT.md`](./DEPLOYMENT.md) **§ CI** (same order as `.github/workflows/ci.yml` and [CHROME_WEB_STORE_CHECKLIST.md](./CHROME_WEB_STORE_CHECKLIST.md)).

## Environment & startup (operator)

- [ ] Copy repo-root [`.env.example`](../../.env.example) → `.env`; set **`DATABASE_URL`** and **`JWT_SECRET`** (≥16 chars) **or** **`JWT_PRIVATE_KEY`** + **`JWT_PUBLIC_KEY`** (RS256).
- [ ] Start API (`npm run dev` or production `node` after build): stdout should show **`phantom-api config:`** lines (JWT mode, Redis, Stripe completeness, inbound webhook, `DASHBOARD_PUBLIC_URL`) — **no secret values**.
- [ ] If JWT is missing or too short, process **exits** with a clear message before listen (fail-fast).
- [ ] **`GET /health/live`** → `200` JSON; **`GET /health`** → `200` when DB up, or **`503`** when DB down (see `DEPLOYMENT.md`).

## Automated (CI + local)

| Area | What runs | Where |
|------|-----------|--------|
| Lint / unit tests | Full monorepo `npm run lint` + `npm run test` | `.github/workflows/ci.yml` |
| API smoke | `GET /health/live`, `GET /health`, `POST /api/auth/login` validation, webhooks unconfigured paths | `src/api/src/app.test.ts` |
| **Integration (requires Postgres)** | Auth register → login → `GET /api/user/me`; Stripe signed webhooks (`checkout.session.completed`, `customer.subscription.deleted`); **duplicate `event.id`** returns `{ duplicate: true }` without double-applying tier | `src/api/src/launch.integration.test.ts` |
| **Integration (requires Postgres)** | **`POST /api/billing/sync-checkout-session`** with mocked Stripe retrieve → tier **paid** | `src/api/src/billingSyncSession.integration.test.ts` |
| **Integration (requires Postgres)** | Free tier: **`POST /api/broker-scan/start`** second call → **429** `scan_rate_limited` when cap exceeded (needs seeded broker catalog) | `src/api/src/brokerScanQuota.integration.test.ts` |
| **Integration (requires Postgres)** | Register + aliases; vault sync conflict | `src/api/src/auth.integration.test.ts` |

Integration suites are **skipped** when `DATABASE_URL` is unset or equals the vitest placeholder (`phantom_placeholder`). They run in **GitHub Actions** (Postgres service + `DATABASE_URL`). Locally, use a real `DATABASE_URL` in repo-root `.env` to enable them.

## Manual (pre-launch)

Run before Chrome Web Store submit and first production deploy.

### Dashboard + API

- [ ] Register and log in on production (or staging) dashboard URL.
- [ ] Create email alias; confirm it appears in alias list.
- [ ] **Tier matrix (free):** on **`GET /api/user/me`**, confirm **`aliasUsage`** shows **`used`** / **`max`** per type; generate aliases until **`403`** **`tier_limit`** with **`error.tierLimit`**; dashboard **Generate alias** disables types at cap with **Upgrade to Pro** link; extension shows API message + **Billing** hint on **`tier_limit`**.
- [ ] **Tier matrix (Pro):** after Checkout (test mode), **`user.tier`** **paid** and **`subscriptionStatus`** populated; **`aliasUsage.max`** null (unlimited); broker **removal queue** available; **`POST /api/aliases/generate`** no longer returns **`tier_limit`** for normal use.
- [ ] **Billing:** start Checkout (Stripe test mode on staging), complete test card; confirm **`/billing?session_id=`** triggers tier sync and UI shows **paid** (webhook may follow slightly later).
- [ ] **Billing:** repeat the same Checkout session webhook delivery (or Stripe CLI resend) and confirm API returns **`200`** with **`duplicate: true`** — handler side effects run **once** (claim on `event.id` happens before processing). **`POST /api/billing/sync-checkout-session`** may be called multiple times for the same `session_id` safely (idempotent user update).
- [ ] **Billing:** open Customer Portal from dashboard; cancel subscription; confirm tier returns to **free** after `customer.subscription.deleted` (or equivalent) webhook.
- [ ] **Vault:** unlock vault with password; add or rotate a password; confirm **Encrypted backup · vN** and **Last synced** update on **Vault** page after sync succeeds.
- [ ] **Vault:** with two browsers/sessions, provoke a sync conflict (edit vault on both); confirm **Retry sync** recovers after merge (LWW in `@phantom/shared`). **`PUT /api/vault/sync`** uses an **atomic** version check (`vaultSyncVersion` must match **`clientVersion`**) so concurrent writes cannot silently overwrite.
- [ ] Broker scan: run scan, open results, confirm free vs Pro removal CTAs match account tier; confirm **429** `scan_rate_limited` when free-tier cap exceeded — response JSON includes **`retryAfterSeconds`** (and **Retry-After** header); dashboard shows **~N min** retry hint.
- [ ] **Broker summary parity:** **`GET /api/broker-scan/summary`** includes **`freeTierBrokerScanMaxPer24h`** (free tier) matching env **`FREE_TIER_BROKER_SCAN_MAX_PER_24H`**; pre-scan footnote on **`/brokers`** reflects the same cap (or “unlimited” when cap is off).
- [ ] **Removal:** expand a **found** broker — **Self-service** link works; free tier shows **Upgrade · Pro queue** (no `403` until Checkout); paid tier can **Queue auto opt-out (sim)** / **Request removal** per **`removalMethod`**.
- [ ] **Notifications:** **`GET/PUT /api/notifications/preferences`** — toggle **Alias health** off; confirm **`GET /api/notifications`** + **`/count`** omit that category; bell unread matches; **read-all** only touches enabled categories.

### Expected UX (HTTP status → copy)

Use **`@phantom/shared`** helpers **`normalizeClientError`** / **`clientErrorFromApiFailure`** + **`getQueryErrorMessage`** so dashboard and extension stay aligned.

| Scenario | Where to spot-check | Expected user-facing behavior |
|----------|---------------------|--------------------------------|
| **401** (expired / invalid session) | **Overview** or **Aliases** with revoked refresh token | Message suggests **sign in again**; not a generic “load failed” only. |
| **429** (rate limit / scan cap) | **Brokers** — second full scan within rolling 24h on free tier | Warning banner with server message + **~N min** retry hint when **`retryAfterSeconds`** present. |
| **503** (maintenance / overload) | Stop API or return **503** from a route | “Temporarily unavailable” style copy; dev console may show **`X-Request-Id`** on failed responses (dashboard). |

### Extension

- [ ] Install unpacked dev build OR store build; set **`PLASMO_PUBLIC_API_URL`** to target environment (`EXTENSION_STORE_BUILD.md`).
- [ ] Log in from extension; generate alias; autofill on a known test page.
- [ ] **Auth:** let access token expire (or revoke server-side); trigger an authenticated action — extension should **refresh** session once; on **503** / **429** on refresh, **exponential backoff** retries (up to a few attempts) before giving up; **offline** / fetch throw → synthetic **`network_error`** JSON (**503**), distinct from **401** re-auth.
- [ ] Optional: vault unlock / sync — confirm best-effort push after login (background `pushVaultSyncFromExtension`).

### Ops

- [ ] `GET /health/live` and `GET /health` return expected JSON behind TLS (`DEPLOYMENT.md`).
- [ ] CORS: dashboard origin allowed; credentials work for API calls.
- [ ] Stripe Dashboard: webhook URL **`POST /api/webhooks/stripe`** receives **`200`**; **`StripeWebhookEvent`** rows accumulate unique **`event.id`** values.

## Deferred (Phase 1 gap)

- Full **Playwright** E2E (dashboard + extension) — not wired in repo; add in a later milestone if desired.
- **Load testing** and **third-party security audit** — manual engagement, not automated here.
- **Outbound email notifications** (SES/SMTP) — reserved env names in **`DEPLOYMENT.md`**; no sender in repo yet.
