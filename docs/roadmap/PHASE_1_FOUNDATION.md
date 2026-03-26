# Phase 1 — Foundation (Months 1–6)

> **Progress:** Each deliverable line shows **% complete** for that workstream (rough engineering estimate; update as you ship).

| Section | Avg (of deliverables in section) |
|---------|-------------------------------------|
| Month 1–2 infrastructure | **~60%** |
| Month 2–3 extension + dashboard | **~69%** |
| Month 3–4 phone + brokers | **~60%** |
| Month 4–5 removal + notifications | **~51%** |
| Month 5–6 launch + QA | **~60%** |
| **Phase 1 (all deliverables)** | **~64%** |

## Objective

Ship the desktop platform MVP: web dashboard + Chrome browser extension. Establish core alias generation, data broker scanning, and password management. Launch free tier to build user base and collect data.

## Platform Scope

| Platform | Status | Progress |
|----------|--------|----------|
| Chrome Extension | **BUILD** — primary user interface | **~72%** |
| Web Dashboard | **BUILD** — command center | **~69%** |
| Firefox/Safari Extension | Not started | **0%** |
| Mobile Apps | Not started | **0%** |

## Deliverables

### Month 1–2: Core Infrastructure

- [ ] **Project scaffolding** — **76%**
  - React + TypeScript + Vite dashboard app — **90%**
  - Plasmo Chrome extension (Manifest V3) — **78%** (store build: `EXTENSION_STORE_BUILD.md`)
  - Node.js + Express API server — **90%** (structured JSON error logs + **`X-Request-Id`** middleware)
  - PostgreSQL database with **logical** per-user isolation (`userId` on all tenant rows; not separate DBs per user — see `docs/architecture/USER_DATA_SCOPE.md`) — **68%**
  - Redis for sessions and cache — **52%** (compose + `REDIS_URL`; refresh-token sessions; optional **Redis-backed global rate limit** via `rate-limit-redis` + **`passOnStoreError`** fail-open; `/health` reports redis; **`DEPLOYMENT.md`** table + Redis down policy)
  - Docker Compose for local development — **88%** (`docker-compose.yml`: Postgres + Redis + optional ES; **`DEPLOYMENT.md`** maps ports → `DATABASE_URL` / `REDIS_URL`)
  - CI/CD pipeline (GitHub Actions) — **80%** (lint + test + build on push/PR)
  - Terraform for AWS infrastructure — **0%**

- [ ] **Authentication system** — **54%**
  - SRP (Secure Remote Password) protocol implementation — **0%** (Phase 1 policy: **out of scope**; see `docs/roadmap/AUTH_AND_VAULT_PHASE1.md`)
  - Master passphrase → Argon2id key derivation — **0%** (vault uses **PBKDF2-SHA256** via Web Crypto today; Argon2id documented as post–Phase 1 hardening)
  - JWT with RS256 (15-min access, 7-day refresh) — **52%** (HS256 dev default; **RS256 when `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY` set**; **60s `clockTolerance`** on verify; opaque refresh in Redis; `jwt.ts` file comment)
  - Session management in Redis — **42%** (refresh token store; access JWT stateless)

- [ ] **Encrypted vault (client-side)** — **48%**
  - Web Crypto API integration (AES-256-GCM) — **85%** (`@phantom/shared` vault crypto)
  - Encrypted IndexedDB in extension — **45%** (DEK in `chrome.storage.session`; ciphertext in IndexedDB; legacy hex migration)
  - Per-user isolated database schemas — **0%** (logical `userId` isolation only in Phase 1 — `USER_DATA_SCOPE.md`)
  - Vault sync between extension and dashboard — **58%** (opaque E2E blob: `GET`/`PUT /api/vault/sync`; **LWW merge** + prune to active password aliases in `@phantom/shared`; **409 → refetch + merge + retry**; dashboard **Encrypted backup · vN** + **Last synced** + conflict hint + Retry; extension **best-effort** push after login; **tests:** tampered blob decrypt)

- [ ] **Email alias engine** — **60%**
  - Custom domain setup (phantom.id, shade.email) — **0%** (DNS still external)
  - Email alias generation API — **50%** (generated `@phantom.id` aliases; no live MX in repo)
  - Email forwarding infrastructure (inbound → user's real email) — **35%** (signed **`POST /api/webhooks/email-inbound`**: **415** wrong `Content-Type`, **`X-Phantom-Request-Id`**, alias length cap, rate limit + tests; **`providerMessageId`** dedupe + **phantom `v1` hash** dedupe when ID omitted; optional `User.forwardToEmail` for future SMTP; worker/MX still external)
  - Alias inbox (view forwarded emails in dashboard) — **55%** (`AliasInboxMessage` + **`GET /api/email-inbox`** + **`q`** + **`unread=1`** + **`isRead`**; **`PATCH /api/email-inbox/:id/read`**; dashboard **`/inbox`** mark read/unread + unread filter)
  - SPF, DKIM, DMARC configuration for deliverability — **15%** (checklist: `docs/roadmap/EMAIL_INBOUND.md`)

### Month 2–3: Extension + Dashboard MVP

- [ ] **Browser extension v1** — **59%**
  - Form detection (heuristic: input types, labels, structure) — **60%** (email/password/username heuristics + label parsing)
  - Alias generation popup (email + password) — **55%**
  - Autofill for generated aliases — **50%** (shield-click fills field value + dispatches events)
  - Shadow DOM injected UI (shield icon on form fields) — **55%** (closed Shadow DOM, positioned icon on each detected field)
  - Service worker for API communication — **65%** (login + alias generate + **vault sync push** after unlock; **`fetchAuth` / `refreshSession`** catch offline → **503** `network_error` JSON + tests)
  - Encrypted credential cache in IndexedDB — **42%** (vault key material encrypted at rest; see extension `vaultStorage`)

- [ ] **Web dashboard v1** — **63%**
  - Login / account management — **50%** (dev login path; **`PATCH /api/user/me`** for `forwardToEmail`)
  - Alias list view (all generated aliases with metadata) — **60%**
  - Alias detail view (service, creation date, health status, forwarding rules) — **45%** (**phone:** adapter banner + edit forward)
  - Create alias manually (not just from extension) — **55%**
  - Delete / disable alias — **50%**
  - Basic settings (forwarding preferences, notification preferences) — **62%** (account + quotas + **forward-to email**; notification prefs)
  - Notification center (bell icon, unread count, mark read) — **65%** (UI + API + demo seeding)

### Month 3–4: Phone Aliases + Data Broker Scanning

- [ ] **Phone alias engine** — **64%**
  - VoIP number provisioning (temporary bridge until carrier partnership Phase 2) — **52%** (`phoneAdapter` + `phoneConfig`; mock vs **Twilio stub**; **503** if `PHONE_PROVIDER=twilio` without `TWILIO_ACCOUNT_SID`; **`lastError`** on **`GET /api/phone/provider`**)
  - Phone alias generation API — **62%** (E.164 validation on `phoneForwardTo`; generate / rotate / PATCH; persists `phoneProvider`, `phoneProviderSid`, `phoneForwardTo`)
  - Call forwarding to user's real number — **22%** (forward target stored + **dashboard Save**; PSTN not dialed)
  - SMS forwarding to dashboard inbox — **0%**
  - Basic call log in dashboard — **0%**
  - Integration boundaries / env — **88%** (`GET /api/phone/provider`, `PHONE_INTEGRATION.md`, `.env.example`; generate modal + alias detail **status / forward** UX)

- [ ] **Data broker scanner** — **64%**
  - Broker registry database (initial 150+ brokers) — **76%** (50 real + 100 synthetic `.example` rows = 150 seeded; **opt-out URLs + DIY notes** on `DataBroker`)
  - Scanner workers (parallel, rate-limited) — **48%** (bounded concurrency + per-broker delay; optional **`BROKER_SCAN_WORKER_DELAY_MS`** + **`BROKER_SCAN_CONCURRENCY`** in `/broker-scan/start`)
  - Search: name, phone, email, address variations — **40%** (simulated)
  - Results aggregation and storage — **60%**
  - Dashboard: exposure scan results view — **58%** (expanded row: **self-service removal** link + notes; free + Pro)
  - Free tier: scan only (show what's exposed) — **55%**
  - Paid tier: removal submission — **40%** (simulated queue + DIY links for all tiers)

- [ ] **Password manager v1** — **40%**
  - Password generation (configurable length, complexity) — **40%** (alias-type passwords)
  - Password storage in encrypted vault — **30%** (encrypted `encryptedValue` + extension vault path; **merged E2E sync blob** pushed from dashboard + extension)
  - Vault dashboard page (card grid, search, filter, strength meter) — **60%**
  - Vault generate modal (service name, category, one-click generate) — **65%**
  - Import from 1Password, LastPass, Bitwarden (CSV import) — **0%**
  - Autofill passwords via extension — **25%** (shield icon triggers fill)
  - TOTP seed storage and auto-fill — **0%**

### Month 4–5: Data Broker Removal + Notifications

- [ ] **Data broker removal engine** — **60%**
  - Automated opt-out submission (API brokers) — **35%** (same simulated pipeline for all `removalMethod` values; **API** brokers labeled **“Queue auto opt-out (sim)”** in dashboard; real partner APIs not live — `BROKER_REMOVAL_QUEUE.md`)
  - Browser automation for manual-submission brokers (Playwright workers) — **0%** (worker/queue contract stub: `docs/roadmap/BROKER_REMOVAL_QUEUE.md`)
  - Submission tracking: { submitted, pending, confirmed, failed } — **55%** (simulated states; **`advanceRemovalSimulation`** uses broker `removalMethod` + `avgRemovalDays`)
  - Verification re-scan 7–30 days after submission — **35%** (read-path simulation ticks)
  - Dashboard: removal status per broker — **60%** (**DIY** opt-out links + notes; Pro queue gated via API summary; API-method copy in UI; **status legend** on results)

- [ ] **Notification system** — **60%**
  - Desktop notifications (browser notification API) — **45%** (Settings → enable permission; **NotificationCenter** fires **system Notification** when unread count increases and permission is **granted**)
  - Email notifications (breach alerts, removal confirmations) — **8%** (SMTP/outbound still external; **`NOTIFICATIONS_EMAIL_ENABLED`** + **`DEPLOYMENT.md`** / **`.env.example`** reserved for future SES/SMTP worker)
  - Dashboard notification center (bell icon, unread count) — **68%** (API + TopBar bell + dropdown + mark read/all + demo seed)
  - Notification preferences (per-category: alias health, broker removal, security alerts) — **62%** (**GET/PUT `/api/notifications/preferences`** + Settings toggles; list/count respect disabled categories)
  - Notification model (Prisma schema, migration, priority/layer/category) — **80%**

### Month 5–6: Polish + Free Tier Launch

- [ ] **Free tier** — **48%**
  - Exposure scan — **62%** (**`FREE_TIER_BROKER_SCAN_MAX_PER_24H`** default **3** full scans / rolling 24h; **429** `scan_rate_limited`; Pro unlimited; scans **retain history** — no `deleteMany` of prior runs)
  - 3 email aliases — **70%** (API-enforced caps on generate + `/api/user/me` usage)
  - 1 phone alias — **70%**
  - Password manager (up to 25 passwords) — **70%** (password-type alias cap)
  - Community threat feed (read-only) — **0%**
  - No data broker removal (upsell to paid) — **48%** (tier gate for **queue** + **`canRequestRemoval`** on summary; DIY links available)

- [ ] **Paid tier ($9.99/mo)** — **58%**
  - Unlimited aliases (email + phone) — **40%** (tier enforced in API; upgrade path)
  - Data broker removal (150+ brokers) — **30%** (simulated queue + catalog DIY URLs)
  - Unlimited password storage — **0%** (paid path: no per-type cap in `assertCanCreateAlias`; vault UX unchanged)
  - Billing / subscription surface — **72%** (Stripe **`/api/billing/checkout-session`**, **`/portal-session`**, **`GET /status`**; **`POST /api/webhooks/stripe`** records **`event.id`** in **`StripeWebhookEvent`** for idempotent retries + **`duplicate: true`** response; **`POST /api/billing/sync-checkout-session`** after Checkout return → **`User.tier`** + Stripe IDs + `subscriptionStatus`; dashboard **`/billing`** strips `session_id` and refreshes tier; **integration tests** for signed webhooks + duplicate event in CI)
  - Dark web monitoring (basic) — **0%**
  - Priority support — **0%**

- [ ] **Onboarding flow** — **22%**
  - Extension install → account creation → first alias generation — **18%**
  - Guided exposure scan ("see who's selling your data") — **30%** (brokers page CTA)
  - Multi-step modal — **35%** (**7 steps** including **Phantom Pro / billing**; links to aliases, vault, brokers, billing)
  - Import existing passwords — **0%**
  - Generate aliases for top services (Gmail, Amazon, Facebook, etc.) — **0%**

- [ ] **Testing and QA** — **64%**
  - Unit tests for: vault encryption, alias generation, API auth — **60%** (+ **extension** `fetchAuth` / `refreshSession` **network** paths + **503** refresh retry, **`inboundWebhookDedupe`**, **`brokerScanQuota`**, **vault sync merge** + **tampered blob**, **phone** `phoneConfig` / `validateForward` / `provisionPhone`, **paid tier** helper, webhook smoke tests, **broker** `computeBrokerScanSummary`, **`brokerRemovalPipeline`**, scan **delay env** parsing, **`prismaUnique`** Stripe dedupe helper)
  - Integration tests for: API auth + vault + **Stripe webhooks (signed)** — **40%** (`auth.integration.test.ts`, `launch.integration.test.ts` when Postgres available; **CI** runs against service DB; **duplicate `event.id`**); **`webhookEmailInbound.test.ts`** (503 / 415 / 401 / invalid JSON); **`app.test.ts`** health + route smoke + **`X-Request-Id`**
  - E2E tests with Playwright (extension + dashboard flows) — **0%** (deferred; manual list in **`docs/roadmap/QA_MANUAL.md`**; **CHROME_WEB_STORE_CHECKLIST** references `npm run lint` / `npm test` / `npm run build`)
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
| Chrome Web Store listing + review | **45%** (checklists + **`QA_MANUAL.md`** + prod **`chrome-mv3-prod`** zip path) |
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
