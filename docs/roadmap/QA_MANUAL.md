# QA — automated vs manual (Phase 1)

**CI commands (reviewers / local parity):** from the **repo root**, in order:

`npm ci` → `npm run db:migrate:deploy -w @phantom/api` → `npm run db:seed -w @phantom/api` → `npm run lint` → `npm run test` → `npm run build`

Same order as [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) and [`DEPLOYMENT.md`](./DEPLOYMENT.md) **§ CI** (see also [CHROME_WEB_STORE_CHECKLIST.md](./CHROME_WEB_STORE_CHECKLIST.md)). **Node 20** matches CI.

## Environment & startup (operator)

- [ ] Copy repo-root [`.env.example`](../../.env.example) → `.env`; set **`DATABASE_URL`** and **`JWT_SECRET`** (≥16 chars) **or** **`JWT_PRIVATE_KEY`** + **`JWT_PUBLIC_KEY`** (RS256).
- [ ] Start API (`npm run dev` or production `node` after build): stdout should show **`phantom-api config:`** lines (JWT mode, Redis, Stripe completeness, inbound webhook, `DASHBOARD_PUBLIC_URL`) — **no secret values**.
- [ ] If JWT is missing or too short, process **exits** with a clear message before listen (fail-fast).
- [ ] **`GET /health/live`** → `200` JSON; **`GET /health`** → `200` when DB up, or **`503`** when DB down (see `DEPLOYMENT.md`).

## Automated (CI + local)

| Area | What runs | Where |
|------|-----------|--------|
| Lint / unit tests | Full monorepo `npm run lint` + `npm run test` | `.github/workflows/ci.yml` (Postgres **16** + Redis **7** services; `DATABASE_URL` + `REDIS_URL` set in the workflow) |
| API smoke | `GET /health/live`, `GET /health`, `POST /api/auth/login` validation, webhooks unconfigured paths | `src/api/src/app.test.ts` |
| **Integration (requires Postgres)** | Auth register → login → `GET /api/user/me`; Stripe signed webhooks (`checkout.session.completed`, `customer.subscription.deleted`); **duplicate `event.id`** returns `{ duplicate: true }` without double-applying tier | `src/api/src/launch.integration.test.ts` |
| **Integration (requires Postgres)** | **`POST /api/billing/sync-checkout-session`** with mocked Stripe retrieve → tier **paid** | `src/api/src/billingSyncSession.integration.test.ts` |
| **Integration (requires Postgres)** | Free tier: **`POST /api/broker-scan/start`** second call → **429** `scan_rate_limited` when cap exceeded (needs seeded broker catalog) | `src/api/src/brokerScanQuota.integration.test.ts` |
| **Integration (requires Postgres)** | Register + aliases; vault sync conflict | `src/api/src/auth.integration.test.ts` |
| **Integration (requires Postgres)** | Email webhook → inbox list → mark read (`unread=1`) | `src/api/src/emailInbox.integration.test.ts` |
| **Integration (requires Postgres)** | Notifications: prefs hide disabled category from list/count; **`POST /seed-demo`** **403** in **`NODE_ENV=production`**; invalid **`enabled`** → **400** | `src/api/src/notifications.integration.test.ts` |
| **Integration (requires Postgres + Redis)** | Register → **`POST /api/auth/refresh`** rotates opaque refresh → old token **401** → **`logout`** revokes | `src/api/src/authSession.integration.test.ts` |
| **Integration (requires Postgres)** | Dark web: free tier gated **`GET /api/dark-web/*`**; paid tier finding + **`GET /api/dashboard/metrics`** **`darkWebAlerts`** + dismiss | `src/api/src/darkWeb.integration.test.ts` |

Integration suites are **skipped** when `DATABASE_URL` is unset or equals the vitest placeholder (`phantom_placeholder`). They run in **GitHub Actions** (job-level **`env.DATABASE_URL`** points at the workflow’s **Postgres service** on port **5432**). Locally, use a real `DATABASE_URL` in repo-root `.env` (and migrate + seed) to enable them.

## Manual (pre-launch)

Run before Chrome Web Store submit and first production deploy.

### First-run (dashboard shell)

- [ ] Clear site data or use a fresh profile; open the dashboard (local dev: **`http://localhost:5173`** after `npm run dev -w @phantom/dashboard` or full `npm run dev` from repo root — see **`run.ps1`**).
- [ ] **Onboarding:** 7-step modal appears until completed or **Skip**; steps follow **welcome → install extension → first alias → inbox → vault → brokers → billing (optional Pro)**; **Back** / **Next** / **Done**; **Next** navigates to the matching in-app route where applicable (Chrome Web Store / load-unpacked copy on the install step).
- [ ] **Extension step:** Chrome Web Store link opens (placeholder listing URL unless **`VITE_CWS_LISTING_URL`** is set); copy explains **load unpacked** dev build and that **`chrome-extension://`** cannot be opened from the https dashboard.
- [ ] **Overview** (with zero aliases): **Get started** links go to **`/aliases`**, **`/inbox`**, **`/vault`**, **`/brokers`**, **`/billing`**, **`/settings`**.
- [ ] **Quick actions** on overview: same routes plus **Settings**; keyboard **Tab** shows visible focus rings.
- [ ] **Narrow viewport (`<md`):** horizontal **MobileNavBar** shows core sections; desktop **sidebar** returns at **`md+`**.
- [ ] **Skip to main content** (keyboard): focus moves to **`#main-content`**.
- [ ] **Unknown URL** (e.g. `/does-not-exist`) redirects to **`/`** (Phase 1 policy).

### Aliases (dashboard + extension)

- [ ] **Dashboard:** **`/aliases`** — list loads with category + health filters; **Retry** on load failure; **Generate alias** opens modal; per-type **quota** (free tier) on type tiles; success **invalidates** list and **`GET /api/user/me`** usage.
- [ ] **Dashboard:** Create **email**, **username**, **phone** (valid E.164 forward optional), **password** (vault key when available); confirm new row appears; open **detail** (`/aliases/:id`), copy value, **deactivate** returns to list.
- [ ] **Extension:** Sign in from **popup**; choose **Email** vs **Password** generate type, then **Generate alias** — success shows masked preview; at **tier cap** (**`403`** **`tier_limit`**) message is visible (includes Billing hint).
- [ ] **Extension:** On a page with email/password inputs, **shield** click fills the field; **SPA** frameworks receive **`input`** / **`change`** (and **`InputEvent`** where supported). When generate fails (**503**, offline, etc.), **error text** appears under the shield (not silent).

### Dashboard + API

- [ ] **Auth:** log in with email/password; confirm **access** works on protected routes. Let the **access JWT** expire (~15m) or revoke server-side; confirm dashboard **refresh** path (or dev re-bootstrap) obtains a new session — extension **`fetchAuth`** should **401** → **refresh** → retry once. **Sign out** clears client state and calls **`POST /api/auth/logout`** with **refresh** when present.
- [ ] Register and log in on production (or staging) dashboard URL.
- [ ] Create email alias; confirm it appears in alias list.
- [ ] **Tier matrix (free):** on **`GET /api/user/me`**, confirm **`aliasUsage`** shows **`used`** / **`max`** per type; generate aliases until **`403`** **`tier_limit`** with **`error.tierLimit`**; dashboard **Generate alias** / **Vault generate** show cap state and open **View billing & upgrade** (same path as **Brokers** / scan **429**); extension shows API message + **Billing** hint on **`tier_limit`**.
- [ ] **Free → upgrade → billing → tier refresh (Run 23):** as a **free** user, trigger a limit: **alias** cap (**`tier_limit`**), **vault** password cap, **broker scan** **429** `scan_rate_limited`, or **removal queue** **`403`** `upgrade_required`. Confirm UI explains the limit honestly (simulated removal/scan labels unchanged), primary CTA goes to **`/billing`** (or opens modal whose CTA goes to **`/billing`**). Complete **Subscribe** (Stripe test mode) or use **`POST /api/billing/sync-checkout-session`**; confirm **`GET /api/user/me`** reflects **paid** tier and gated actions unlock without a full reload (React Query invalidation / refetch).
- [ ] **Tier matrix (Pro):** after Checkout (test mode), **`user.tier`** **paid** and **`subscriptionStatus`** populated; **`aliasUsage.max`** null (unlimited); broker **removal queue** available; **`POST /api/aliases/generate`** no longer returns **`tier_limit`** for normal use.
- [ ] **Billing:** start Checkout (Stripe test mode on staging), complete test card; confirm **`/billing?session_id=`** triggers tier sync and UI shows **paid** (webhook may follow slightly later).
- [ ] **Billing:** repeat the same Checkout session webhook delivery (or Stripe CLI resend) and confirm API returns **`200`** with **`duplicate: true`** — handler side effects run **once** (claim on `event.id` happens before processing). **`POST /api/billing/sync-checkout-session`** may be called multiple times for the same `session_id` safely (idempotent user update).
- [ ] **Billing:** open Customer Portal from dashboard; cancel subscription; confirm tier returns to **free** after `customer.subscription.deleted` (or equivalent) webhook.
- [ ] **Vault:** unlock vault with password; add or rotate a password; confirm **Encrypted backup · vN** and **Last synced** update on **Vault** page after sync succeeds.
- [ ] **Vault:** with two browsers/sessions, provoke a sync conflict (edit vault on both); confirm **Retry sync** recovers after merge (LWW in `@phantom/shared`). **`PUT /api/vault/sync`** uses an **atomic** version check (`vaultSyncVersion` must match **`clientVersion`**) so concurrent writes cannot silently overwrite.
- [ ] Broker scan: run scan, open results, confirm free vs Pro removal CTAs match account tier; confirm **429** `scan_rate_limited` when free-tier cap exceeded — response JSON includes **`retryAfterSeconds`** (and **Retry-After** header); dashboard shows **~N min** retry hint.
- [ ] **Broker summary parity:** **`GET /api/broker-scan/summary`** includes **`freeTierBrokerScanMaxPer24h`** (free tier) matching env **`FREE_TIER_BROKER_SCAN_MAX_PER_24H`**; pre-scan footnote on **`/brokers`** reflects the same cap (or “unlimited” when cap is off).
- [ ] **Removal:** expand a **found** broker — **Self-service** link works; free tier shows **Upgrade · Pro queue** (no `403` until Checkout); paid tier can **Queue auto opt-out (sim)** / **Request removal** per **`removalMethod`**.
- [ ] **Notifications:** TopBar **bell** opens dropdown — loading, empty, error, and **Mark all read**; unread badge matches **`GET /api/notifications/count`** (poll **30s**). **`GET/PUT /api/notifications/preferences`** — toggle a category off; confirm **`GET /api/notifications`** + **`/count`** omit that category (rows may still exist in DB); **read-all** only marks unread in **enabled** categories. **Settings → Desktop notifications:** request permission; when **granted**, a **desktop** notification appears only when **unread count increases** (not every poll). **`POST /api/notifications/seed-demo`** is **403** in **`NODE_ENV=production`** (demo seed is dev/staging only).
- [ ] **Settings (`/settings`):** Account shows **email**, **display name**, **tier** / **plan** from **`GET /api/user/me`** (same quota math as elsewhere). **Forward-to email** — valid address or clear; **400** from API shows inline message (matches **`PATCH /api/user/me`** validation). **Alias & vault quotas** — per-type usage with links to **Aliases** / **Vault**; **Billing & subscription** + **Upgrade to Pro** (free tier) go to **`/billing`** or shared upgrade modal. **Notification preferences** — toggles disabled while saving; **Retry** on prefs load error; success flash after save; bell list/count refresh after **PUT**. **Desktop notifications** — copy reflects **default** / **granted** / **denied**. **Session** — **Sign out** clears cache and returns to overview (same as TopBar sign-out).

### Expected UX (HTTP status → copy)

Use **`@phantom/shared`** helpers **`normalizeClientError`** / **`clientErrorFromApiFailure`** + **`getQueryErrorMessage`** so dashboard and extension stay aligned.

| Scenario | Where to spot-check | Expected user-facing behavior |
|----------|---------------------|--------------------------------|
| **401** (expired / invalid session) | **Overview** or **Aliases** with revoked refresh token | Message suggests **sign in again**; not a generic “load failed” only. |
| **429** (rate limit / scan cap) | **Brokers** — second full scan within rolling 24h on free tier | Warning banner with server message + **~N min** retry hint when **`retryAfterSeconds`** present. |
| **503** (maintenance / overload) | Stop API or return **503** from a route | “Temporarily unavailable” style copy; dev console may show **`X-Request-Id`** on failed responses (dashboard). |

### Extension

- [ ] Install unpacked dev build OR store build; set **`PLASMO_PUBLIC_API_URL`** at build time to the API origin (`EXTENSION_STORE_BUILD.md`), or set **Runtime API origin** in extension **Options** (stored as **`phantom_api_base_url`** in `chrome.storage.local`).
- [ ] Log in from extension; generate alias; autofill on a known test page.
- [ ] **Auth:** let access token expire (or revoke server-side); trigger an authenticated action — extension should **refresh** session once; on **503** / **429** on refresh, **exponential backoff** retries (up to a few attempts) before giving up; **offline** / fetch throw → synthetic **`network_error`** JSON (**503**), distinct from **401** re-auth.
- [ ] Optional: vault unlock / sync — confirm best-effort push after login (background `pushVaultSyncFromExtension`).

### Ops

- [ ] `GET /health/live` and `GET /health` return expected JSON behind TLS (`DEPLOYMENT.md`).
- [ ] CORS: dashboard origin allowed; credentials work for API calls.
- [ ] Stripe Dashboard: webhook URL **`POST /api/webhooks/stripe`** receives **`200`**; **`StripeWebhookEvent`** rows accumulate unique **`event.id`** values.

## Run 15 status (email & inbox)

| Status | Notes |
|--------|--------|
| **Shipped** | Webhook tests + **`emailInbox.integration.test.ts`** (CI Postgres); **`EMAIL_INBOUND.md`** / **`DEPLOYMENT.md`** / **`.env.example`**; inbox **Retry**; Settings **forwardToEmail** validation; query invalidation **`emailInboxAll`**. |
| **Blocked (external)** | Live **MX** + MIME worker posting to webhook; **SMTP** outbound to **`forwardToEmail`**. |
| **Next sprint** | Optional: payload-size integration assertion; inbound worker reference implementation. |

## Run 13 status (QA & CI hardening)

| Status | Notes |
|--------|--------|
| **Shipped** | Extra **unit** coverage (`tierQuota`, `brokerRemovalPipeline`, extension **`apiClient`**); CI workflow **concurrency**; **`README` / `QA_MANUAL` / `DEPLOYMENT` / `CHROME_WEB_STORE_CHECKLIST`** aligned with **`npm ci` → migrate → seed → lint → test → build**; billing manual steps use **`session_id`** / **`canceled`** query params. |
| **Blocked** | **Playwright** E2E, **load** / **security** audits — external or later milestone. |
| **Next sprint** | Optional: more **integration** branches; single Playwright **smoke** if timeboxed. |

## Run 23 status (conversion / upsell)

| Status | Notes |
|--------|--------|
| **Shipped** | Shared **`UpgradeModal`** + **`upgradeCopy`**; **`BrokersPage`** / **`GenerateAliasModal`** / **`VaultGenerateModal`** / onboarding billing → **`/billing`**; **`BillingPage`** FAQ + checkout-return success; **`upgradeCopy.test.ts`**; manual steps above (**free → `/billing` → tier refresh**). |
| **Blocked (external)** | **Live** Stripe keys + public webhook URL for production cutover (unchanged). |
| **Next sprint** | Optional: RTL smoke for **`UpgradeModal`**; integration test wiring for **403** removal → upgrade CTA if CI budget allows. |

## Deferred (Phase 1 gap)

- Full **Playwright** E2E (dashboard + extension) — not wired in repo; add in a later milestone if desired.
- **Load testing** and **third-party security audit** — manual engagement, not automated here.
- **Outbound email notifications** (SES/SMTP) — reserved env names in **`DEPLOYMENT.md`**; no sender in repo yet.
