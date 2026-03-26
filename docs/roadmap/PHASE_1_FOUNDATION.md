# Phase 1 — Foundation (Months 1–6)

> **Progress:** Each deliverable line shows **% complete** for that workstream (rough engineering estimate; update as you ship).

| Section | Avg (of deliverables in section) |
|---------|-------------------------------------|
| Month 1–2 infrastructure | **~72%** |
| Month 2–3 extension + dashboard | **~91%** |
| Month 3–4 phone + brokers | **~71%** |
| Month 4–5 removal + notifications | **~65%** |
| Month 5–6 launch + QA | **~75%** |
| **Phase 1 (all deliverables)** | **~93%** |

## Objective

Ship the desktop platform MVP: web dashboard + Chrome browser extension. Establish core alias generation, data broker scanning, and password management. Launch free tier to build user base and collect data.

## Platform Scope

| Platform | Status | Progress |
|----------|--------|----------|
| Chrome Extension | **BUILD** — primary user interface | **~88%** |
| Web Dashboard | **BUILD** — command center | **~90%** |
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
  - CI/CD pipeline (GitHub Actions) — **90%** (documented step order in **`DEPLOYMENT.md` § CI** matches `.github/workflows/ci.yml`: `npm ci` → migrate → **seed** → lint → test → build → **`terraform validate`** on `infra/terraform/`; **Postgres + Redis** services; seed enables broker integration tests)
  - Terraform for AWS infrastructure — **38%** (minimal root in `infra/terraform/` + `variables.tf` / `outputs.tf` + **`.gitignore`** + **CI `terraform validate`**; no AWS resources yet — see `INFRA_AWS_PHASE1.md`)

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
  - Email forwarding infrastructure (inbound → user's real email) — **50%** (signed **`POST /api/webhooks/email-inbound`**: **415** / **401** / **503**; **`X-Phantom-Request-Id`**; **256kb** body; **120/min** IP limit; alias length cap; **`providerMessageId`** + **phantom `v1` hash** dedupe; **unique** race → **`deduped: true`**; webhook tests + **`emailInbox.integration.test.ts`** (list **`meta`/`offset`**, clamp, idempotent read PATCH) + **`PATCH /user/me`** forward-email validation in CI; shared **`parseForwardToEmailPatchBody`**; optional **`User.forwardToEmail`**; worker/MX still external)
  - Alias inbox (view forwarded emails in dashboard) — **62%** (`AliasInboxMessage` **`isRead`** + **`GET /api/email-inbox`** **`q`** **`unread=1`**; **`PATCH /api/email-inbox/:id/read`**; dashboard **`/inbox`** retry on load error + mark read/unread + filter; **Settings** forward field client validation + API parity)
  - SPF, DKIM, DMARC configuration for deliverability — **15%** (checklist: `docs/roadmap/EMAIL_INBOUND.md` aligned with code)

### Month 2–3: Extension + Dashboard MVP

- [ ] **Browser extension v1** — **78%**
  - Form detection (heuristic: input types, labels, structure) — **65%** (email/password/username heuristics + label parsing)
  - Alias generation popup (email + password) — **62%** (popup shows **API error strings** on sign-in / generate failure; **`aria` roles** on status/error; **`clientErrorFromApiFailure`** + **`normalizeClientError`** for network path)
  - Autofill for generated aliases — **58%** (shield-click fills field value + dispatches **`InputEvent`** / **`change`**; password-type decrypt via vault key when present)
  - Shadow DOM injected UI (shield icon on form fields) — **62%** (closed Shadow DOM; **fixed** viewport positioning + scroll/resize reposition)
  - Service worker for API communication — **81%** (login + alias generate + **`pushVaultSyncFromExtension`** after unlock — **dynamic import** of vault sync chunk; **`fetchAuth` / `refreshSession`**: offline → synthetic **`network_error`** (**503**); API **503** passthrough; **401** when refresh fails; **refresh** exponential backoff on **503/429** + **documented caps** in `apiClient.ts` + tests; **`onInstalled`**: clear invalid API URL override; **options** page: **`validateApiBaseUrlInput`** + loading/saved states; shared **`clientError`** mapping for responses)
  - Encrypted credential cache in IndexedDB — **58%** (DEK + session-wrapped vault key material; see extension **`vaultStorage`**)

- [ ] **Web dashboard v1** — **92%**
  - Login / account management — **58%** (dev login path; **`PATCH /api/user/me`** for `forwardToEmail` with validation; **`/settings`** shows **email** + **displayName** + tier from **`GET /api/user/me`**; bootstrap errors use **`clientErrorFromApiFailure`**)
  - Alias list view (all generated aliases with metadata) — **68%** (loading / empty / **Retry** on **normalized** error; category + health filters)
  - Alias detail view (service, creation date, health status, forwarding rules) — **62%** (**phone:** adapter banner + edit forward; **email:** inbox/forwarding honesty + Settings link; **Retry** on load error)
  - Create alias manually (not just from extension) — **62%** (**`GenerateAliasModal`**: per-type **quota** copy on type tiles from **`GET /api/user/me`**)
  - Delete / disable alias — **54%** (**DELETE** soft-deactivate; list/detail invalidate)
  - Basic settings (forwarding preferences, notification preferences) — **76%** (single **Settings** hub: **`GET /api/user/me`** + parallel **`GET /api/notifications/preferences`**; **forward-to** client + API **400** parity; quotas + **Aliases** / **Vault** links; **Billing** + **Upgrade** CTA; prefs toggles + **invalidate** after **PUT**; per-section **Retry**; desktop notification copy **default**/**granted**/**denied**; **Danger zone** sign-out + query clear — no delete-account API in Phase 1)
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
  - Vault generate modal (service name, category, one-click generate) — **78%** (**`VaultGenerateModal`**; free tier **25** password aliases per **`FREE_TIER_ALIAS_MAX`**; paid: **`assertCanCreateAlias`** + **`aliasUsage.max`** null — no false cap)
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

- [ ] **Notification system** — **80%**
  - Desktop notifications (browser notification API) — **72%** (Settings → **Enable** permission; **NotificationCenter** fires **`Notification`** only when **unread count increases** vs prior poll and permission is **granted** — not on every **30s** poll)
  - Email notifications (breach alerts, removal confirmations) — **12%** (no API sender; **`NOTIFICATIONS_EMAIL_ENABLED`** stub in **`DEPLOYMENT.md`** / **`EMAIL_INBOUND.md`**; no delivery claims without SMTP)
  - Dashboard notification center (bell icon, unread count) — **82%** (API + TopBar bell + dropdown + loading/empty/error + mark read/all; **`POST /seed-demo`** **403** in **`NODE_ENV=production`**)
  - Notification preferences (per-category) — **84%** (**GET/PUT `/api/notifications/preferences`**; **`enabled` boolean validation**; Settings toggles + errors + **saved** feedback; **`notificationCategoryFilter`**: disabled categories **hidden** from list/count/read-all — rows remain in DB; writers documented in **`notifications.ts`**)
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
  - Unlimited password storage — **92%** (paid/enterprise: **`assertCanCreateAlias`** bypass + **`buildAliasUsage`** `max: null`; vault header shows **unlimited (paid plan)**; **`buildAliasUsage` tests**)
  - Billing / subscription surface — **78%** (Stripe **`/api/billing/checkout-session`**, **`/portal-session`**, **`GET /status`**; **`POST /api/webhooks/stripe`** **claims** **`event.id`** in **`StripeWebhookEvent`** *before* handler work → duplicate deliveries **`duplicate: true`** without re-running side effects; handler failure **deletes** claim for Stripe retry; **`POST /api/billing/sync-checkout-session`** idempotent for same `session_id`; dashboard **`/billing`** strips `session_id`; **integration tests:** signed webhooks + duplicate **`event.id`** + **sync-checkout-session** ×2 with mocked Stripe in CI)
  - Dark web monitoring (basic) — **80%** (Prisma **`DarkWebFinding`**; paginated **`GET`** + **`PATCH`** (`acknowledged` alias); HIBP refresh when **`DARK_WEB_HIBP_API_KEY`**; paid-only; notifications **`security_alert`** + **`/dark-web`**; dashboard **`/dark-web`**; overview **`darkWebAlerts`** from DB — **not** marketplace crawling; **`DASHBOARD_DEMO_METRICS`** / **`OVERVIEW_DEMO_METRICS`** for synthetic Sword chart demos; see **`DEPLOYMENT.md`**)
  - Priority support — **0%**

- [ ] **Onboarding flow** — **84%**
  - Extension install → sign in → first alias generation — **62%** (8-step modal: welcome → **install extension** → **sign in** (pin/MV3 popup) → **first alias** → inbox → vault → brokers → billing; **`DASHBOARD_PATHS`** + **`QUICK_ACTIONS`**)
  - Guided exposure scan ("see who's selling your data") — **50%** (brokers **first scan** CTA + pre-scan legend + **429** UI with **retryAfterSeconds**)
  - Multi-step modal — **82%** (**8 steps**; **billing** step CTA matches app-wide **upgrade** path (**`/billing`**); Chrome Web Store + **load unpacked** honesty; **no `chrome-extension://` links from https** documented in UI)
  - Import existing passwords — **0%**
  - Generate aliases for top services (Gmail, Amazon, Facebook, etc.) — **0%**

- [ ] **Testing and QA** — **77%**
  - Unit tests for: vault encryption, alias generation, API auth — **74%** (+ **`envOverviewDemo`**; **`upgradeCopy`** **`apiErrorCodeToUpgradeReason`** + copy helpers; **`aliasTierLimits`**, **`tierQuota`** edge cases **max null** / missing row / **enterprise**, **extension** `fetchAuth` **429** retry + **401** refresh success path + **no token** synthetic **401**, **`validateApiBaseUrlInput`** + invalid storage override fallback, **`refreshSession`** exponential backoff, **`inboundWebhookDedupe`**, **`brokerScanQuota`**, **`brokerScanSummaryAugment`**, **`notificationCategoryFilter`**, **`assertJwtEnvConfigured`**, **`operatorConfigLog`**, **vault sync** `executeVaultSyncPush` wrong passphrase + **409 retry**, **tampered blob**, **phone** `phoneConfig` / `validateForward` / `provisionPhone`, **paid tier** helper, webhook smoke tests, **broker** `computeBrokerScanSummary`, **`brokerRemovalPipeline`** (**email** vs **manual**, clamp), scan **delay env** parsing, **`prismaUnique`** Stripe dedupe helper, **`errorJson`** **`requestId`** in non-prod bodies)
  - Integration tests for: API auth + vault **409** + **Stripe webhooks (signed)** + **billing sync-checkout-session** idempotency + **broker scan free-tier 429** — **60%** (`auth.integration.test.ts`, `launch.integration.test.ts`, **`billingSyncSession.integration.test.ts`**, **`brokerScanQuota.integration.test.ts`** when Postgres + seeded catalog; **CI** `DATABASE_URL` + **duplicate `event.id`**); **`webhookEmailInbound.test.ts`** (503 / 415 / 401 / invalid JSON); **`app.test.ts`** health + route smoke + **`X-Request-Id`** + **404** **`error.requestId`**; **`darkWeb.integration.test`** production **`seed-demo` 403**; **`notifications.integration.test`** production **`seed-demo` 403** with **`NODE_ENV` restore**
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

## Phase 1 exit criteria (repository vs external)

**In repo (engineering “green”):** CI order matches **`DEPLOYMENT.md` § CI** and **`.github/workflows/ci.yml`**; integration tests listed in **`QA_MANUAL.md`** run when **`DATABASE_URL`** points at a real Postgres (Actions job); store zip path **`src/extension/build/chrome-mv3-prod/`** per **`EXTENSION_STORE_BUILD.md`**; broker removal remains **simulated** per **`BROKER_REMOVAL_QUEUE.md`**; notification prefs + bell honor **`notificationCategoryFilter`**; **`NOTIFICATIONS_EMAIL_ENABLED`** is documented in **`.env.example`** / **`DEPLOYMENT.md`** but **not** read by API code (no false delivery claims).

**External (not faked in %):** live **Stripe** keys + public HTTPS webhook URL; **DNS/MX** + inbound worker; **Chrome Web Store** listing + review; **hosted privacy policy** URL; **ToS** legal review — see **Dependencies** below.

### Phase 1 complete (engineering)

**Done in repo (baseline for handoff to Phase 2 planning):**

- **CI** matches **`DEPLOYMENT.md` § CI**: `npm ci` → migrate → seed → lint → test → build, then **`terraform validate`** on `infra/terraform/` (placeholder module; no AWS resources). **Postgres 16** + **Redis 7** in Actions; integration tests listed in **`QA_MANUAL.md`** run when **`DATABASE_URL`** is real.
- **Extension:** store output **`src/extension/build/chrome-mv3-prod/`** per **`EXTENSION_STORE_BUILD.md`**; content-script shields (Shadow DOM), heuristic form fields, autofill + events, popup/sign-in error surfacing, **`fetchAuth`** / **`refreshSession`** backoff — see **`apiClient.ts`**.
- **Dashboard + API:** alias tiers, **`GET /api/user/me`** **`aliasUsage`**, vault page **Retry** on list error, alias detail **Retry** + email forwarding copy, onboarding **install → first alias** funnel, broker **429** UX, simulated removal per **`BROKER_REMOVAL_QUEUE.md`**, notification prefs + **`notificationCategoryFilter`**.
- **Honesty:** **`NOTIFICATIONS_EMAIL_ENABLED`** is documented in **`.env.example`** / **`DEPLOYMENT.md`** and is **not** read by application code (no false email delivery).

**External-only (not treated as missing repo work):** live **Stripe** + HTTPS webhook; **DNS/MX** + worker → email inbound; **CWS** + hosted legal URLs; production **Twilio**/carrier — see **Blocked (external)** above and **`DEPLOYMENT.md`** *External blockers* (**owner + blocker** per row). Stakeholder wording: **`QA_MANUAL.md`** § *Stakeholder handoff* (**engineering closed vs waiting on ops**).

**Phase 2+ / explicitly not required for this engineering close:** Brain, Call Guard, carrier-grade numbers, Firefox extension, **Playwright E2E** (deferred), CSV import, community threat feed — see **`PHASE_2_INTELLIGENCE.md`** (Phase 1→2 **handoff** bullets) and **Deferred** tables in this doc.

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
| Chrome Web Store listing + review | **54%** (checklists + **`npm run build:extension:store`** + prod **`chrome-mv3-prod`** zip path + **`QA_MANUAL.md`**; **external:** CWS developer account + hosted privacy policy URL + submission) |
| **Live Stripe** (secret key, webhook signing secret, Dashboard webhook URL on public HTTPS) | **0%** (ops — test keys + CI mocks only in repo) |
| **Hosted privacy policy** URL (required for CWS + trust) | **0%** (legal/ops) |
| VoIP provider partnership signed | **0%** |
| AWS infrastructure provisioned | **0%** |
| Chrome Web Store developer account | **0%** |
| Legal review of terms of service and privacy policy | **0%** |

## Remaining before Phase 1 complete

Engineering “done” vs a **first public beta** differ: the items below include external work and nice-to-haves.

### Blocked (external; owner)

| Item | Dependency |
|------|------------|
| Public payments | Live **Stripe** + HTTPS **`POST /api/webhooks/stripe`** endpoint |
| Inbound mail | **DNS/MX** + worker → **`POST /api/webhooks/email-inbound`** |
| Extension distribution | **CWS** account + listing + **hosted privacy policy** URL |
| Telephony | **Twilio** (or partner) production numbers — see **`PHONE_INTEGRATION.md`** |

### Deferred (Phase 1 policy)

| Item | Reason |
|------|--------|
| Playwright E2E (extension + dashboard) | Deferred — manual **`QA_MANUAL.md`** + CI integration suites cover API paths |
| Full **CSV** password import | Out of scope for Phase 1 deliverables |
| **Community threat feed** | **0%** in deliverables; not started |

**Nice-to-haves / later:** Polished **onboarding** beyond current 7-step modal; **load** and **security** audits (often external). **Brokers:** real **opt-out automation** (not simulated); periodic catalog **URL** verification.
