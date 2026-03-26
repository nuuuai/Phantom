# Phase 1 — Foundation (Months 1–6)

> **Progress:** Each deliverable line shows **% complete** for that workstream (rough engineering estimate; update as you ship).

| Section | Avg (of deliverables in section) |
|---------|-------------------------------------|
| Month 1–2 infrastructure | **~68%** |
| Month 2–3 extension + dashboard | **~85%** |
| Month 3–4 phone + brokers | **~71%** |
| Month 4–5 removal + notifications | **~62%** |
| Month 5–6 launch + QA | **~69%** |
| **Phase 1 (all deliverables)** | **~87%** |

## Objective

Ship the desktop platform MVP: web dashboard + Chrome browser extension. Establish core alias generation, data broker scanning, and password management. Launch free tier to build user base and collect data.

## Platform Scope

| Platform | Status | Progress |
|----------|--------|----------|
| Chrome Extension | **BUILD** — primary user interface | **~84%** |
| Web Dashboard | **BUILD** — command center | **~85%** |
| Firefox/Safari Extension | Not started | **0%** |
| Mobile Apps | Not started | **0%** |

## Deliverables

### Month 1–2: Core Infrastructure

- [ ] **Project scaffolding** — **80%**
  - React + TypeScript + Vite dashboard app — **90%**
  - Plasmo Chrome extension (Manifest V3) — **78%** (store build: `EXTENSION_STORE_BUILD.md`)
  - Node.js + Express API server — **92%** (structured JSON error logs + **`X-Request-Id`** middleware; **`assertJwtEnvConfigured`** at startup; **`logOperatorConfigSummary`** — non-secret JWT mode / Redis / Stripe / inbound / dashboard URL)
  - PostgreSQL database with **logical** per-user isolation (`userId` on all tenant rows; not separate DBs per user — see `docs/architecture/USER_DATA_SCOPE.md`) — **68%**
  - Redis for sessions and cache — **58%** (compose + `REDIS_URL`; refresh-token hash keys; optional **Redis-backed global rate limit** via `rate-limit-redis` + **`passOnStoreError`** fail-open; `/health` reports redis; **`DEPLOYMENT.md`** table + Redis down policy; **CI** runs **Redis 7** + **`REDIS_URL`** for **`authSession.integration.test.ts`**)
  - Docker Compose for local development — **88%** (`docker-compose.yml`: Postgres + Redis + optional ES; **`DEPLOYMENT.md`** maps ports → `DATABASE_URL` / `REDIS_URL`)
  - CI/CD pipeline (GitHub Actions) — **86%** (documented step order in **`DEPLOYMENT.md` § CI** matches `.github/workflows/ci.yml`: `npm ci` → migrate → **seed** → lint → test → build; **Postgres + Redis** services; seed enables broker integration tests)
  - Terraform for AWS infrastructure — **24%** (minimal root in `infra/terraform/` + `variables.tf` / `outputs.tf` + **`.gitignore`**; no AWS resources yet — see `INFRA_AWS_PHASE1.md`)

- [ ] **Authentication system** — **72%**
  - SRP (Secure Remote Password) protocol implementation — **0%** (Phase 1 policy: **out of scope**; see `docs/roadmap/AUTH_AND_VAULT_PHASE1.md`)
  - Master passphrase → Argon2id key derivation — **0%** (vault uses **PBKDF2-SHA256** via Web Crypto today; Argon2id documented as post–Phase 1 hardening)
  - JWT access (15m) + opaque refresh (7d TTL) — **72%** (**HS256** / **RS256**; **`iss`** `phantom-api`; verify **`algorithms`** enforced; **60s `clockTolerance`**; **`assertJwtEnvConfigured`** fail-fast; unit tests: expiry, tamper, alg mismatch)
  - Session management in Redis — **62%** (hashed refresh keys; rotation on **`POST /api/auth/refresh`**; logout revoke; **`authSession.integration.test.ts`** with CI **Redis**; if no **Redis**, responses omit **`refreshToken`** / refresh → **503**)

- [ ] **Encrypted vault (client-side)** — **78%**
  - Web Crypto API integration (AES-256-GCM) — **92%** (`@phantom/shared` **`vaultCrypto`**: PBKDF2 + encrypt/decrypt; deterministic key for fixed password+salt tested)
  - Encrypted IndexedDB in extension — **62%** (DEK in `chrome.storage.session`; ciphertext in IndexedDB; legacy **`phantom_vault_key_hex`** migration path in `vaultStorage.ts`)
  - Per-user isolated database schemas — **0%** (logical `userId` isolation only in Phase 1 — `USER_DATA_SCOPE.md`)
  - Vault sync between extension and dashboard — **88%** (opaque E2E blob: `GET`/`PUT /api/vault/sync`; **atomic** `updateMany` on matching **`vaultSyncVersion`**/`clientVersion`; **LWW merge** + deterministic tie-break + prune to active password aliases; **`VaultSyncGetResponse`** / **`VaultSyncPutRequest`**; **409 → refetch + merge + retry**; **`executeVaultSyncPush`** tests: wrong key, tamper, **409** retry, no-op skip **PUT**, conflict exhaustion, non-conflict **PUT** error; dashboard **Encrypted backup · vN** + **Last synced** + conflict hint + Retry + **React Query retry: 2**; extension **`pushVaultSyncFromExtension`** after unlock + **dev-only** truncated error log; **`AUTH_AND_VAULT_PHASE1.md`** + **`DEPLOYMENT.md`** E2E note)

- [ ] **Email alias engine** — **74%**
  - Custom domain setup (phantom.id, shade.email) — **0%** (DNS still external)
  - Email alias generation API — **58%** (generated `@phantom.id` aliases; **`POST /generate`** + **`assertCanCreateAlias`** + **`403`** **`tier_limit`**; no live MX in repo)
  - Email forwarding infrastructure (inbound → user's real email) — **48%** (signed **`POST /api/webhooks/email-inbound`**: **415** / **401** / **503**; **`X-Phantom-Request-Id`**; **256kb** body; **120/min** IP limit; alias length cap; **`providerMessageId`** + **phantom `v1` hash** dedupe; **unique** race → **`deduped: true`**; webhook tests + **`emailInbox.integration.test.ts`** in CI; optional **`User.forwardToEmail`**; worker/MX still external)
  - Alias inbox (view forwarded emails in dashboard) — **62%** (`AliasInboxMessage` **`isRead`** + **`GET /api/email-inbox`** **`q`** **`unread=1`**; **`PATCH /api/email-inbox/:id/read`**; dashboard **`/inbox`** retry on load error + mark read/unread + filter; **Settings** forward field client validation + API parity)
  - SPF, DKIM, DMARC configuration for deliverability — **15%** (checklist: `docs/roadmap/EMAIL_INBOUND.md` aligned with code)

### Month 2–3: Extension + Dashboard MVP

- [ ] **Browser extension v1** — **70%**
  - Form detection (heuristic: input types, labels, structure) — **60%** (email/password/username heuristics + label parsing)
  - Alias generation popup (email + password) — **58%** (popup shows **API error strings** on sign-in / generate failure; **`clientErrorFromApiFailure`** + **`normalizeClientError`** for network path)
  - Autofill for generated aliases — **52%** (shield-click fills field value + dispatches events; password-type decrypt via vault key when present)
  - Shadow DOM injected UI (shield icon on form fields) — **55%** (closed Shadow DOM, positioned icon on each detected field)
  - Service worker for API communication — **80%** (login + alias generate + **`pushVaultSyncFromExtension`** after unlock; **`fetchAuth` / `refreshSession`**: offline → synthetic **`network_error`** (**503**); API **503** passthrough; **401** when refresh fails; **refresh** exponential backoff on **503/429** + **documented caps** in `apiClient.ts` + tests; **`onInstalled`**: clear invalid API URL override; **options** page: **`validateApiBaseUrlInput`** + loading/saved states; shared **`clientError`** mapping for responses)
  - Encrypted credential cache in IndexedDB — **58%** (DEK + session-wrapped vault key material; see extension **`vaultStorage`**)

- [ ] **Web dashboard v1** — **85%**
  - Login / account management — **54%** (dev login path; **`PATCH /api/user/me`** for `forwardToEmail` with validation; bootstrap errors use **`clientErrorFromApiFailure`**)
  - Alias list view (all generated aliases with metadata) — **68%** (loading / empty / **Retry** on **normalized** error; category + health filters)
  - Alias detail view (service, creation date, health status, forwarding rules) — **48%** (**phone:** adapter banner + edit forward)
  - Create alias manually (not just from extension) — **62%** (**`GenerateAliasModal`**: per-type **quota** copy on type tiles from **`GET /api/user/me`**)
  - Delete / disable alias — **54%** (**DELETE** soft-deactivate; list/detail invalidate)
  - Basic settings (forwarding preferences, notification preferences) — **68%** (account + quotas + **forward-to email**; notification prefs + **PUT** validation + **prefs load / save** errors visible; desktop notification permission UX)
  - Notification center (bell icon, unread count, mark read) — **72%** (TopBar placement; UI + API + demo seeding; list **loading** + **mark-all** / row errors; **`linkTo`** routes are in-app paths)

### Month 3–4: Phone Aliases + Data Broker Scanning

- [ ] **Phone alias engine** — **76%**
  - VoIP number provisioning (temporary bridge until carrier partnership Phase 2) — **62%** (`phoneAdapter` + `phoneConfig`; mock vs **Twilio stub**; unknown **`PHONE_PROVIDER`** → mock + warning; **503** `phone_provider_unavailable` on **`GET /api/phone/provider`** + generate/rotate when Twilio selected without **`TWILIO_ACCOUNT_SID`**; structured **`error.lastError`** on **503**)
  - Phone alias generation API — **72%** (E.164 validation on `phoneForwardTo`; generate / rotate / PATCH; persists `phoneProvider`, `phoneProviderSid`, `phoneForwardTo`; tier caps aligned with **`GET /api/user/me`**)
  - Call forwarding to user's real number — **22%** (forward target stored + **dashboard Save**; PSTN not dialed)
  - SMS forwarding to dashboard inbox — **0%**
  - Basic call log in dashboard — **0%**
  - Integration boundaries / env — **95%** (`PHONE_INTEGRATION.md`, **`DEPLOYMENT.md`** phone table, `.env.example`; dashboard **Phone routing** + generate modal **503** / **`lastError`** copy; **`auth.integration.test`** **503** path)

- [ ] **Data broker scanner** — **65%**
  - Broker registry database (initial 150+ brokers) — **76%** (50 real + 100 synthetic `.example` rows = 150 seeded; **opt-out URLs + DIY notes** on `DataBroker`)
  - Scanner workers (parallel, rate-limited) — **52%** (bounded concurrency + per-broker delay; **`BROKER_SCAN_WORKER_DELAY_MS`** + **`BROKER_SCAN_CONCURRENCY`** in `/broker-scan/start` + `brokerScanPipeline.ts`)
  - Search: name, phone, email, address variations — **40%** (simulated)
  - Results aggregation and storage — **60%**
  - Dashboard: exposure scan results view — **62%** (expanded row: **self-service removal** link + notes; free + Pro; **status legend** on pre-scan + results)
  - Free tier: scan only (show what's exposed) — **62%** (**429** JSON includes **`retryAfterSeconds`** + header; **`GET /broker-scan/summary`** exposes **`freeTierBrokerScanMaxPer24h`** aligned with **`FREE_TIER_BROKER_SCAN_MAX_PER_24H`**; dashboard footnote uses same; prior **`BrokerScanRun`** rows retained)
  - Paid tier: removal submission — **40%** (simulated queue + DIY links for all tiers)

- [ ] **Password manager v1** — **72%**
  - Password generation (configurable length, complexity) — **65%** (alias-type passwords; shared **`generatePassword`**)
  - Password storage in encrypted vault — **62%** (`encryptedValue` on password aliases + **E2E** **`vaultSyncCiphertext`** blob from dashboard + extension **`executeVaultSyncPush`**)
  - Vault dashboard page (card grid, search, filter, strength meter) — **78%** (**VaultPage** + **`useVaultSync`** + tier quota via **`userMe`**)
  - Vault generate modal (service name, category, one-click generate) — **72%** (**`VaultGenerateModal`**; free tier **25** password aliases per **`FREE_TIER_ALIAS_MAX`**)
  - Import from 1Password, LastPass, Bitwarden (CSV import) — **0%**
  - Autofill passwords via extension — **28%** (shield icon + decrypt path when vault unlocked)
  - TOTP seed storage and auto-fill — **0%**

### Month 4–5: Data Broker Removal + Notifications

- [ ] **Data broker removal engine** — **68%**
  - Automated opt-out submission (API brokers) — **46%** (same simulated pipeline for all `removalMethod` values; **`brokerRemovalMethodLabel`** + **“Queue auto opt-out (sim)”** row actions; **`BROKER_REMOVAL_QUEUE.md`** + env validation note)
  - Browser automation for manual-submission brokers (Playwright workers) — **0%** (worker/queue contract stub: `docs/roadmap/BROKER_REMOVAL_QUEUE.md`)
  - Submission tracking: { submitted, pending, confirmed, failed } — **58%** (simulated states; **`advanceRemovalSimulation`** on read paths uses broker `removalMethod` + `avgRemovalDays`)
  - Verification re-scan 7–30 days after submission — **35%** (read-path simulation ticks)
  - Dashboard: removal status per broker — **66%** (**DIY** opt-out links + notes; free **Upgrade · Pro queue** vs paid queue labels; **`canRequestRemoval`** + **`GET /summary`**; **status legend** on pre-scan + results)

- [ ] **Notification system** — **78%**
  - Desktop notifications (browser notification API) — **72%** (Settings → **Enable** permission; **NotificationCenter** fires **`Notification`** only when **unread count increases** vs prior poll and permission is **granted** — not on every **30s** poll)
  - Email notifications (breach alerts, removal confirmations) — **12%** (no API sender; **`NOTIFICATIONS_EMAIL_ENABLED`** stub in **`DEPLOYMENT.md`** / **`EMAIL_INBOUND.md`**; no delivery claims without SMTP)
  - Dashboard notification center (bell icon, unread count) — **82%** (API + TopBar bell + dropdown + loading/empty/error + mark read/all; **`POST /seed-demo`** **403** in **`NODE_ENV=production`**)
  - Notification preferences (per-category) — **82%** (**GET/PUT `/api/notifications/preferences`**; **`enabled` boolean validation**; Settings toggles + errors; **`notificationCategoryFilter`**: disabled categories **hidden** from list/count/read-all — rows remain in DB; writers documented in **`notifications.ts`**)
  - Notification model (Prisma schema, migration, priority/layer/category) — **85%**
  - Tests — **75%** (**`notificationCategoryFilter`** unit; **`notifications.integration.test.ts`**: prefs filter + seed **403** + validation **400** when Postgres in CI)

### Month 5–6: Polish + Free Tier Launch

- [ ] **Free tier** — **58%**
  - Exposure scan — **65%** (**`FREE_TIER_BROKER_SCAN_MAX_PER_24H`** default **3** full scans / rolling 24h, cap max **500**; **429** `scan_rate_limited`; Pro unlimited; scans **retain history** — no `deleteMany` of prior runs)
  - 3 email aliases — **76%** (**`assertCanCreateAlias`** + **`403`** **`tier_limit`** + **`error.tierLimit`**; **`GET /api/user/me`** **`aliasUsage`**; dashboard **Generate** per-type quota + disables at-cap types + **Billing** link; extension **popup** + **shield** surface **`tier_limit`** + messages; **`FREE_TIER_ALIAS_MAX`** in **`@phantom/shared`** — **`DEPLOYMENT.md`**)
  - 1 phone alias — **72%** (same pipeline per **`AliasType`**)
  - Password manager (up to 25 passwords) — **72%** (password-type alias cap; **Vault** generate modal respects quota)
  - Community threat feed (read-only) — **0%**
  - No data broker removal (upsell to paid) — **50%** (tier gate for **queue** + **`canRequestRemoval`** on summary; DIY links available)

- [ ] **Paid tier ($9.99/mo)** — **60%**
  - Unlimited aliases (email + phone) — **45%** (`assertCanCreateAlias` bypass for paid/enterprise; dashboard shows no cap)
  - Data broker removal (150+ brokers) — **32%** (simulated queue + catalog DIY URLs)
  - Unlimited password storage — **5%** (paid path: no per-type cap in `assertCanCreateAlias`; vault UX gated on free quota)
  - Billing / subscription surface — **78%** (Stripe **`/api/billing/checkout-session`**, **`/portal-session`**, **`GET /status`**; **`POST /api/webhooks/stripe`** **claims** **`event.id`** in **`StripeWebhookEvent`** *before* handler work → duplicate deliveries **`duplicate: true`** without re-running side effects; handler failure **deletes** claim for Stripe retry; **`POST /api/billing/sync-checkout-session`** idempotent for same `session_id`; dashboard **`/billing`** strips `session_id`; **integration tests:** signed webhooks + duplicate **`event.id`** + **sync-checkout-session** ×2 with mocked Stripe in CI)
  - Dark web monitoring (basic) — **0%**
  - Priority support — **0%**

- [ ] **Onboarding flow** — **74%**
  - Extension install → account creation → first alias generation — **28%**
  - Guided exposure scan ("see who's selling your data") — **50%** (brokers **first scan** CTA + pre-scan legend + **429** UI with **retryAfterSeconds**)
  - Multi-step modal — **80%** (**7 steps**: welcome → aliases → **inbox** → vault → brokers → **billing** → extension; **billing** step CTA matches app-wide **upgrade** path (**`/billing`**); **`DASHBOARD_PATHS`** + **`QUICK_ACTIONS`**; **Back** / **Next** / **Done**; scrollable modal; Chrome Web Store + **load unpacked** honesty; **no `chrome-extension://` from https** documented in UI)
  - Import existing passwords — **0%**
  - Generate aliases for top services (Gmail, Amazon, Facebook, etc.) — **0%**

- [ ] **Testing and QA** — **75%**
  - Unit tests for: vault encryption, alias generation, API auth — **73%** (+ **`upgradeCopy`** **`apiErrorCodeToUpgradeReason`** + copy helpers; **`aliasTierLimits`**, **`tierQuota`** edge cases **max null** / missing row / **enterprise**, **extension** `fetchAuth` **429** retry + **401** refresh success path + **no token** synthetic **401**, **`validateApiBaseUrlInput`** + invalid storage override fallback, **`refreshSession`** exponential backoff, **`inboundWebhookDedupe`**, **`brokerScanQuota`**, **`brokerScanSummaryAugment`**, **`notificationCategoryFilter`**, **`assertJwtEnvConfigured`**, **`operatorConfigLog`**, **vault sync** `executeVaultSyncPush` wrong passphrase + **409 retry**, **tampered blob**, **phone** `phoneConfig` / `validateForward` / `provisionPhone`, **paid tier** helper, webhook smoke tests, **broker** `computeBrokerScanSummary`, **`brokerRemovalPipeline`** (**email** vs **manual**, clamp), scan **delay env** parsing, **`prismaUnique`** Stripe dedupe helper)
  - Integration tests for: API auth + vault **409** + **Stripe webhooks (signed)** + **billing sync-checkout-session** idempotency + **broker scan free-tier 429** — **58%** (`auth.integration.test.ts`, `launch.integration.test.ts`, **`billingSyncSession.integration.test.ts`**, **`brokerScanQuota.integration.test.ts`** when Postgres + seeded catalog; **CI** `DATABASE_URL` + **duplicate `event.id`**); **`webhookEmailInbound.test.ts`** (503 / 415 / 401 / invalid JSON); **`app.test.ts`** health + route smoke + **`X-Request-Id`**
  - E2E tests with Playwright (extension + dashboard flows) — **0%** (deferred; manual list in **`docs/roadmap/QA_MANUAL.md`**; **CHROME_WEB_STORE_CHECKLIST** / **`README.md`** / **`DEPLOYMENT.md`** document **`npm ci` → migrate → seed → lint → test → build**)
  - Security audit of encryption implementation — **0%**
  - Load testing for alias generation and broker scanning — **0%**

## Phase 1 — remaining gaps (launch blockers vs nice-to-have)

| Area | Still TODO / external |
|------|------------------------|
| **Auth** | SRP; Argon2id vault KDF — policy in **`AUTH_AND_VAULT_PHASE1.md`** (PBKDF2 + JWT today). |
| **Vault** | Physical per-user DB isolation; optional **two-way** alias↔blob reconciliation (today: merge blob with API alias list + LWW). Logical isolation: **`USER_DATA_SCOPE.md`**. |
| **Email** | Live MX + worker calling webhook; outbound forward to `forwardToEmail`; domain purchase/DNS automation. |
| **Phone** | Twilio Number API + inbound webhooks; SMS inbox; real PSTN forward (see `PHONE_INTEGRATION.md`). |
| **Billing** | **Live** Stripe keys + **live** webhook URL on public HTTPS API; Dashboard Stripe settings. |
| **Brokers** | Real removal automation / Playwright workers; verify catalog opt-out URLs periodically. |
| **QA** | Playwright E2E not wired; **manual** pre-launch list in `QA_MANUAL.md`; load / security audit external. |
| **Store / legal** | CWS account + submission (`CHROME_WEB_STORE_CHECKLIST.md`); hosted privacy policy; ToS legal review. |

## Success Metrics (End of Phase 1)

| Metric | Target | Progress to target |
|--------|--------|----------------------|
| Registered users (free) | 10,000 | **~0%** (pre-launch) |
| Paid subscribers | 500 | **0%** |
| Aliases generated | 50,000 | **~0%** |
| Broker scans completed | 5,000 | **~0%** |
| Extension installs | 15,000 | **0%** |
| Alias generation latency | < 500ms p95 | **TBD** (measure in prod) |
| Dashboard load time | < 2s | **TBD** |
| Extension popup load | < 200ms | **TBD** |
| Uptime | 99.5% | **TBD** |

## Key Risks

| Risk | Mitigation | Status |
|------|-----------|--------|
| Email deliverability issues | Warm up domains gradually. SPF/DKIM/DMARC from day 1. Monitor reputation. | **Open** |
| VoIP numbers rejected by services | Known limitation. Carrier-grade numbers come in Phase 2. Document which services reject VoIP. | **Open** |
| Broker scan accuracy | Start with well-known brokers. Manual QA of scan results. User feedback loop. | **Open** |
| Extension review rejection | Follow Chrome Web Store policies strictly. Minimal permissions. Clear privacy policy. | **Open** |
| Low free-to-paid conversion | Optimize the "aha moment" (seeing your data exposed). Strong upsell at broker removal step. | **Open** |

## Dependencies

| Dependency | Progress |
|------------|----------|
| Custom email domains registered and configured | **0%** (DNS/MX checklist + webhook contract in `docs/roadmap/EMAIL_INBOUND.md`) |
| Chrome Web Store listing + review | **52%** (checklists + permissions justification + listing copy draft + **`QA_MANUAL.md`** + prod **`chrome-mv3-prod`** zip path; **external:** CWS account + hosted privacy policy URL) |
| VoIP provider partnership signed | **0%** |
| AWS infrastructure provisioned | **0%** |
| Chrome Web Store developer account | **0%** |
| Legal review of terms of service and privacy policy | **0%** |

## Remaining before Phase 1 complete

Engineering “done” vs a **first public beta** differ: the items below include external work and nice-to-haves.

- **External / ops:** Live **MX + worker** posting to the inbound webhook; **HTTPS** API + dashboard; **live Stripe** keys + webhook URL; **Chrome Web Store** listing; hosted **privacy policy**; **ToS** legal review.
- **Product gaps:** Community **threat feed**; polished **onboarding**; **CSV** password import; **Playwright** E2E; **load** and **security** audits (typically external).
- **Telephony:** Real **Twilio Number API** + PSTN/SMS (see `PHONE_INTEGRATION.md`).
- **Brokers:** Real **opt-out automation** (not simulated); periodic **URL** verification.
