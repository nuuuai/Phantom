# Roadmap — progress model

All roadmap docs use **percent complete** as a manual engineering estimate (not auto-generated). Update numbers when scope ships or when you re-baseline.

## Where % appears

| Location | What it means |
|----------|----------------|
| **Deliverable** (`- [ ] **Title** — **N%**`) | Whole workstream vs its spec. |
| **Sub-bullets** (indented under a deliverable) | Line-item progress; Phase 1 is granular, Phases 2–4 default to **0%** until started. |
| **Platform Scope** | Readiness of each platform for that phase. |
| **Success metrics** | Progress **toward** numeric targets (often **0%** pre-launch). |
| **Dependencies** (Phase 1) | External gating items. |
| **Key risks** | **Open** = tracked; close or reword when mitigated. |
| **`MILESTONES.md`** | Per-milestone **Progress**, North Star **Progress**, guardrail **Progress vs threshold**. |

## Phase documents (summary)

| File | Scope | Document-level summary |
|------|--------|-------------------------|
| [PHASE_1_FOUNDATION.md](./PHASE_1_FOUNDATION.md) | Months 1–6, desktop MVP | Deliverables avg **~89%** (see table at top of file; updated per ship). |
| [INFRA_AWS_PHASE1.md](./INFRA_AWS_PHASE1.md) | AWS / Terraform gap (Phase 1) | Minimal Terraform root in **`infra/terraform/`** (~24%; **`.gitignore`** + README); recommended AWS layout, probes, CI parity. |
| [AUTH_AND_VAULT_PHASE1.md](./AUTH_AND_VAULT_PHASE1.md) | JWT vs vault KDF vs SRP | Phase 1 policy (PBKDF2 vault; RS256/HS256 JWT). |
| [BROKER_REMOVAL_QUEUE.md](./BROKER_REMOVAL_QUEUE.md) | Removal jobs / workers | Simulated today; queue + Playwright direction. |
| [PHASE_2_INTELLIGENCE.md](./PHASE_2_INTELLIGENCE.md) | Months 6–12, Brain + telephony | **0%** (not started). |
| [PHASE_3_AUTONOMY.md](./PHASE_3_AUTONOMY.md) | Months 12–18, Autopilot | **0%** (not started). |
| [PHASE_4_MOBILE_ECOSYSTEM.md](./PHASE_4_MOBILE_ECOSYSTEM.md) | Months 18–24, mobile + ecosystem | **0%** (not started). |
| [MILESTONES.md](./MILESTONES.md) | Critical path + North Star + guardrails | Milestone **Progress** column + metric tables. |
| [PHASE_1_AGENT_RUNS.md](./PHASE_1_AGENT_RUNS.md) | Sequential Cursor/agent prompts (Runs 1–5) | One run = one baseline commit or tag. |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | API/dashboard/extension env for prod | Health `/health/live` + `/health`; **docker-compose** port/env table; **`BROKER_SCAN_*`** env; **`X-Request-Id`** + Redis policies; **§ CI** table (same order as GitHub Actions); Stripe; integration tests. |
| [EXTENSION_STORE_BUILD.md](./EXTENSION_STORE_BUILD.md) | Plasmo prod zip / M8 | Store-ready extension build. |
| [CHROME_WEB_STORE_CHECKLIST.md](./CHROME_WEB_STORE_CHECKLIST.md) | CWS submission | Permissions, privacy, external blockers. |
| [QA_MANUAL.md](./QA_MANUAL.md) | Automated vs manual QA | Pre-launch checklist; billing duplicate webhook, vault sync, scan cap, **`NOTIFICATIONS_EMAIL_ENABLED`** stub. |

## Conventions

- **0%** = not started or not yet measurable.
- **TBD** = needs production metrics or instrumentation.
- **~N%** = rough / directional estimate.
- Sub-bullet % rows do not need to average to the parent deliverable %; parent is the rollup judgment call.

## Recently shipped (examples)

- **Inbox read state**: Prisma **`isRead`** on `AliasInboxMessage`; **`GET /api/email-inbox?unread=1`**; **`PATCH …/:id/read`**; dashboard filter + actions.
- **Stripe webhooks**: DB **`StripeWebhookEvent`** (`event.id` unique); duplicate POSTs → **`{ duplicate: true }`** after idempotent handler work.
- **API reliability**: **`passOnStoreError`** on HTTP rate limiters; refresh-token Redis I/O wrapped (no silent success on failure); JWT **`clockTolerance`**.
- **GitHub Actions CI** (`.github/workflows/ci.yml`): lint, test, build on push/PR.
- **Free-tier alias caps** (API): email 3, phone 1, username 5, password 25 for `tier === free`; `GET /api/user/me` returns usage. Dashboard **Settings** + **Aliases** show quotas.
- **Notification system**: Prisma `Notification` model (priority, category, layer), API endpoints (`GET /api/notifications`, `POST /read-all`, `POST /seed-demo`), dashboard bell icon in TopBar with dropdown, mark-read, and demo seeding.
- **Vault page** (Password manager v1): card-grid layout with strength meter, search/filter by category, generate modal, copy/reveal/rotate/remove per credential.
- **Extension form detection v2**: heuristic expansion (name/id/placeholder/label-based), username field detection, Shadow DOM injected shield icon on each detected field that generates + auto-fills aliases on click.
- **Auth / JWT**: optional **RS256** when `JWT_PRIVATE_KEY` + `JWT_PUBLIC_KEY` are set (HS256 + `JWT_SECRET` remains the dev default). Refresh tokens in **Redis** when `REDIS_URL` is set.
- **Extension vault at rest**: random **DEK** in `chrome.storage.session`, AES-GCM ciphertext in **IndexedDB** (replaces plaintext vault key in `chrome.storage.local`); legacy key migrated on next login.
- **Vault sync (E2E blob)**: `GET`/`PUT /api/vault/sync` + `User.vaultSyncCiphertext` / `vaultSyncVersion`; **LWW merge** + prune to active password aliases (`executeVaultSyncPush` in `@phantom/shared`); dashboard **Encrypted backup · vN** + failed-sync banner with **Retry**; extension **best-effort** push after login. Integration test: **409** when `clientVersion` stale (`auth.integration.test.ts`, needs `DATABASE_URL`).
- **Broker catalog 150+**: seed merges 50 real brokers + 100 synthetic `.example` rows; scan uses bounded-concurrency “workers” with per-broker delay.
- **Billing stub**: `GET /api/billing/status` + Stripe env placeholders in `.env.example`.
- **Settings**: browser **desktop notification** permission (Enable).
- **Docs**: `EMAIL_INBOUND.md`; **`PHONE_INTEGRATION.md`** (adapter, env, GET `/api/phone/provider`, provider-specific TODOs).
- **Email path (code)**: `POST /api/webhooks/email-inbound` (HMAC `X-Phantom-Signature: sha256=…`, `INBOUND_WEBHOOK_SECRET`), `AliasInboxMessage` + `GET /api/email-inbox`, dashboard **`/inbox`**, optional **`forwardToEmail`** via `PATCH /api/user/me`.
- **Infra**: Global API rate limit uses **Redis** when `REDIS_URL` is set (`rate-limit-redis`); in-memory fallback if not.
- **Launch prep**: `CHROME_WEB_STORE_CHECKLIST.md` for Web Store submission.
- **M8/M9 billing & launch**: Stripe **Checkout** + **Customer Portal**, **`POST /api/webhooks/stripe`** + **`POST /api/billing/sync-checkout-session`** (return URL `?session_id=`) → `User.tier` + `subscriptionStatus`, dashboard **`/billing`**; **`GET /health/live`** + **`GET /health`**; **`launch.integration.test.ts`** + **`billingSyncSession.integration.test.ts`** in CI with Postgres. Env: `STRIPE_*`, `DASHBOARD_PUBLIC_URL`. See `DEPLOYMENT.md`, `QA_MANUAL.md`.
- **Vault & extension**: `executeVaultSyncPush` tests (wrong passphrase, **409** retry, no-op skip **PUT**, conflict exhaustion, **PUT** hard error); dashboard **`useVaultSync`** `retry: 2`; extension **`fetchAuth`** / **`refreshSession`** (exponential backoff on **503/429**, **`network_error`** vs API errors vs **401**).
- **Terraform starter**: **`infra/terraform/`** (`terraform.tf`, `variables.tf`, `outputs.tf`, README) — validate when CLI available; see **`INFRA_AWS_PHASE1.md`**.
- **Shared vault + brokers**: **`VaultSyncGetResponse` / `VaultSyncPutRequest`** wire types; **LWW** tie-break on equal `updatedAt`; **`brokerRemovalMethodLabel`** for broker expanded row.
- **Onboarding / brokers / overview**: **7-step** modal (includes **`/inbox`** + **`/billing`**); broker **status legend** on pre-scan card; **Get started** links include **`/inbox`**.
- **Vault / extension**: dashboard **conflict** hint for more API messages; extension **devLog** on vault sync failure (truncated, dev-only); **`apiClient`** refresh backoff documented.
- **Integration tests**: **`brokerScanQuota.integration.test.ts`** — free tier second **`/broker-scan/start`** → **429** + **`retryAfterSeconds`** in JSON (needs seeded catalog).
- **Journey / funnel (Run 4):** overview **Get started** link order + **Quick actions** include **Vault**; broker pre-scan **first exposure scan**; **`EXTENSION_STORE_BUILD.md`** funnel blurb.
- **Run 5 (M1/M8 doc parity):** **`DEPLOYMENT.md` § CI** step table + **`BROKER_SCAN_WORKER_DELAY_MS`**; **`infra/terraform/.gitignore`**; **`EXTENSION_STORE_BUILD.md`** MV3 background (fetchAuth, vault push); **`CHROME_WEB_STORE_CHECKLIST`** / **`QA_MANUAL`** link to CI order; **`INFRA_AWS_PHASE1`** CI bullet aligned.
- **Run 6 (removal + notifications triad):** **`BrokerScanSummary.freeTierBrokerScanMaxPer24h`** on **`GET /api/broker-scan/summary`** (quota parity); **`notificationCategoryFilter`** + tests; **`BROKER_REMOVAL_QUEUE.md`** / **`EMAIL_INBOUND.md`** honesty on simulation + email stub; dashboard **Upgrade · Pro queue** + pre-scan footnote; **`QA_MANUAL`** broker + notification prefs steps.
- **Run 7 (config / operator):** **`assertJwtEnvConfigured`** + **`logOperatorConfigSummary`** at API startup; **`.env.example`** + **`DEPLOYMENT.md`** extended (**`NODE_ENV`**, **`API_PORT`**, Twilio **SID** note); **`INFRA_AWS_PHASE1`** Terraform **~24%**; tests for JWT assert + operator log smoke.
- **Run 8 (tier matrix):** **`403`** **`tier_limit`** + **`error.tierLimit`** on alias generate; **`isFreeTierAliasTypeAtCap`** + **`User.subscriptionStatus`** on **`GET /api/user/me`**; dashboard **Generate alias** / **Vault** modals + **Billing** subscription display; extension **`tier_limit`** messaging.
- **Run 9 (idempotency / safe retry):** Stripe webhook **claim `event.id` before handler** + delete claim on **`500`**; **`PUT /api/vault/sync`** atomic **`vaultSyncVersion`** CAS; email inbound **unique** race → **`deduped`**; **`sync-checkout-session`** idempotent test ×2; **`DEPLOYMENT.md`** Stripe at-least-once note.
- **Run 10 (client contract + UX):** Shared **`clientErrorFromApiFailure`** / **`normalizeClientError`** / **`BillingStatus`**; **`httpStatus`** on parsed API errors; dashboard **`parseApiResponseJson`** dev **`X-Request-Id`** hint; loading / error / empty patterns on major surfaces; **Brokers** scan **disabled** while run animation active; **`/billing`** sync failure visible; **`QA_MANUAL.md`** status-code UX table.
- **Phone (M5)**: `provisionPhoneAlias`, `phoneProvider` / `phoneForwardTo` on aliases, alias detail **Phone routing**; `PHONE_PROVIDER` + Twilio env (stub branch); **503** `phone_provider_unavailable` on **`GET /api/phone/provider`** + generate/rotate when Twilio misconfigured; dashboard **`lastError`** banners (Run 16).
- **Email inbound**: **`POST /api/webhooks/email-inbound`** hardened (**415** media type, **`X-Phantom-Request-Id`**, tests in `webhookEmailInbound.test.ts`).
- **Broker scan**: optional **`BROKER_SCAN_CONCURRENCY`** (1–32); env in `.env.example` + `DEPLOYMENT.md`.
- **Extension store**: root script **`npm run build:extension:store`** (shared + extension prod build).
- **Run 12 / CWS + MV3:** Removed unused **`tabs`** permission; **`getApiBaseUrl`** async + **`phantom_api_base_url`** override; **options** page (URL validation, loading/saved); **`onInstalled`** clears invalid API override on update; **`CHROME_WEB_STORE_CHECKLIST`** permissions table + listing copy draft; **`DEPLOYMENT.md`** extension API/CORS note; extension **`0.1.0`**.
- **Run 13 / QA & CI:** CI **`concurrency`** + cancel-in-progress; **`README.md`** + **`QA_MANUAL.md`** exact command order; **`DEPLOYMENT.md`** CI Postgres URL; unit tests: **`tierQuota`** edge cases, **`brokerRemovalPipeline`** email vs manual, **`apiClient`** (429 retry, 401 refresh success, no-token **401**, invalid URL protocol / storage fallback).
- **Run 14 / brokers vertical:** **`validateBrokerScanRuntimeConfig`** before **`POST /api/broker-scan/start`** → **503** `broker_scan_config_invalid`; **`BrokersPage`** removes fake scan delay, adds **scan error** + **429** upgrade hint; tests: pipeline validation, summary data-type rollup, quota cap **500**; **`.env.example`** / **`DEPLOYMENT.md`** / **`BROKER_REMOVAL_QUEUE.md`** updated.
- **Run 15 / email & inbox:** **`webhookEmailInbound.test.ts`** extended (missing signature, bad alias shape, **404** with Postgres); **`emailInbox.integration.test.ts`** (register → generate alias → signed webhook → **GET** inbox → **PATCH** read → **unread=1**); **`EmailInboxPage`** **Retry** + **`emailInboxAll`** invalidation; **Settings** forward-to **client validation** + outbound external note; **`EMAIL_INBOUND.md`** / **`DEPLOYMENT.md`** inbound contract.
- **Run 16 / phone vertical:** **`GET /api/phone/provider`** → **503** `phone_provider_unavailable` + **`error.lastError`** when **`PHONE_PROVIDER=twilio`** without SID (**200** when ready); **`ApiErrorBody.lastError`** + **`ClientErrorMeta.lastError`**; unknown **`PHONE_PROVIDER`** → mock + warning; **`DEPLOYMENT.md`** / **`PHONE_INTEGRATION.md`** / **`.env.example`**; **`auth.integration.test`** provider **503**; dashboard alias detail + generate modal show API **message** + **`lastError`** banner.
- **Run 17 / vault vertical:** Extended **`executeVaultSyncPush`** tests (no-op **PUT** skip, conflict exhaustion, non-conflict **PUT** error); **PBKDF2** determinism test; **`AUTH_AND_VAULT_PHASE1.md`** E2E sync + per-credential rows; **`DEPLOYMENT.md`** vault E2E + free password cap **25**; **`PHASE_1_FOUNDATION`** vault + password manager + M2 bumps.
- **Run 19 / notifications vertical:** **`notifications.ts`** read-path prefs documentation; **`PUT /preferences`** boolean **`enabled`** validation; **`POST /seed-demo`** **403** in production; **`notifications.integration.test.ts`** (CI Postgres); **`EMAIL_INBOUND.md`** / **`DEPLOYMENT.md`** outbound honesty; **`QA_MANUAL`** bell + desktop delta + prefs; **`PHASE_1_FOUNDATION`** + **M4** bumps.
- **Run 20 / auth & session:** **`jwt.ts`** HS256 verify **`algorithms: ['HS256']`**; **`AUTH_AND_VAULT_PHASE1.md`** JWT + refresh semantics; **`DEPLOYMENT.md`** Redis/JWT fixes (no false in-memory refresh); **CI** **Redis** service + **`REDIS_URL`**; **`authSession.integration.test.ts`**; expanded **`jwt.test.ts`**; **`QA_MANUAL`** auth flows; **`PHASE_1_FOUNDATION`** + **M1** bumps.
- **Run 21 / dashboard shell & onboarding:** **`dashboardRoutes.ts`** (**`DASHBOARD_PATHS`**, **`QUICK_ACTIONS`**); **`MobileNavBar`** + hidden sidebar on small screens; **`OnboardingModal`** 7 steps, **Back**, scroll, Chrome Web Store + dev **load unpacked** + **`chrome-extension://`** limitation; **`routeTitles`** alias detail + tests; broker upgrade modal → **`/billing`** (superseded by shared **`UpgradeModal`**, Run 23); skip link **`#main-content`**; **`PHASE_1_FOUNDATION`** onboarding + web dashboard + **M4** bumps.
- **Run 22 / aliases + extension alias UX:** **`GenerateAliasModal`** per-type quota from **`user.me`**; **`AliasesPage`** **Retry** on load error; extension **popup** **Email** / **Password** generate + **`fieldKind`**; **shield** shows API errors (**`aria-busy`**); autofill **`InputEvent`** + **`change`**; background **`tier_limit`** + **`rate_limited`** retry hint; **`aliasTierLimits`** username test; **`DEPLOYMENT.md`** **`FREE_TIER_ALIAS_MAX`** not env-overridable; **`QA_MANUAL`** alias checklist.
- **Run 23 / conversion & upsell:** Shared **`UpgradeModal`** + **`upgradeCopy.ts`** (API **`code`** → **`UpgradeReason`**); **`BrokersPage`** scan **429** + removal **`upgrade_required`**; **`GenerateAliasModal`** / **`VaultGenerateModal`** at **`tier_limit`**; **`OnboardingModal`** billing step → **`/billing`**; **`BillingPage`** FAQ + post-checkout success; unit tests **`upgradeCopy.test.ts`**; **`QA_MANUAL`** free → billing → tier refresh.
- **Tests**: `vaultSyncMerge`, `brokerRemovalHelp`, `mapBrokerScan`, `userTierPaid`, `phoneConfig`, `validateForward`, `provisionPhone`, `webhookEmailInbound`, **`brokerScanSummaryAugment`**, **`notificationCategoryFilter`**, **`notifications.integration.test`**, **`authSession.integration.test`**, **`jwt`** (expiry, tamper, alg), **`aliasTierLimits`** (email + username caps), **`tierQuota`**; dashboard **`routeTitles`**, **`dashboardRoutes`**; webhook smoke in `app.test.ts`.
- **Run 25 (perf sprint):** Dashboard React Query **`staleTime` / `gcTime`**, **`AbortSignal`** on list fetches, **`React.lazy`** for brokers/vault/inbox/billing, nav + quick-action **prefetch**, memoized list rows, extension background **dynamic import** for vault sync push; see root **`README.md`** § Performance notes.
- **Run 26 (Settings hub):** **`SettingsPage`** — parallel **`user/me`** + notification **prefs**; **forward-to** validation (**`settingsForwardEmail`**) + **`PATCH`** errors; quotas + **Aliases** / **Vault** links; **Billing** + **`UpgradeModal`**; prefs **invalidate** after **PUT**; desktop permission copy; **Danger zone** sign-out (**no** delete-account API); **`QA_MANUAL`** + **`DEPLOYMENT.md`**; **`PHASE_1_FOUNDATION`** / **M4** bumps.
- **Run 27 (gap-closure docs):** **`DEPLOYMENT.md`** — **`NOTIFICATIONS_EMAIL_ENABLED`** explicitly not read by API; **`BROKER_REMOVAL_QUEUE.md`** — dashboard ↔ shared **`brokerRemovalMethodLabel`** / **`canRequestRemoval`**; **`CHROME_WEB_STORE_CHECKLIST`** — root **`npm run build:extension:store`**; **`QA_MANUAL`** — CI Postgres **16** / Redis **7**; **`PHASE_1_FOUNDATION`** — exit criteria, Dependencies (**Live Stripe**, hosted privacy), Blocked/Deferred tables; **`MILESTONES`** M8/M9 nudge; root **`README`** + **`docs/OVERVIEW.md`** — how to run + link **`DEPLOYMENT.md`**.
