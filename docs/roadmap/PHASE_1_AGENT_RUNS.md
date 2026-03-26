# Phase 1 — five agent runs (sequential)

Use **Run 1 → Run 5** in order. After each run, **commit** (or **tag**, e.g. `phase1-run-1-phone`) so the next agent has a clear baseline. Update the roadmap files each run specifies before closing the run.

| Run | Focus | Milestones / docs |
|-----|--------|---------------------|
| [Run 1](#run-1--phone-aliases-m5) | Phone aliases | M5 · `PHONE_INTEGRATION.md` · `PHASE_1_FOUNDATION.md` phone |
| [Run 2](#run-2--data-brokers-scan--removal-depth-m6m7) | Brokers scan + removal | M6–M7 · broker rows in `PHASE_1_FOUNDATION.md` |
| [Run 3](#run-3--vault--email-continuity-m2--email-engine) | Vault + email | M2 · email · `EMAIL_INBOUND.md` |
| [Run 4](#run-4--launch--paid-tier-m8m9) | Launch + paid tier | M8–M9 · `DEPLOYMENT.md` · store docs |
| [Run 5](#run-5--qa-onboarding-and-doc-sync) | QA, onboarding, doc sync | Testing / Onboarding in `PHASE_1_FOUNDATION.md` · `docs/roadmap/README.md` |

---

## Run 1 — Phone aliases (M5)

**Context:** Phantom Phase 1. Read `docs/roadmap/PHASE_1_FOUNDATION.md`, `docs/roadmap/MILESTONES.md` (M5), `docs/roadmap/PHONE_INTEGRATION.md`.

**Mission:** Implement the next slice of **phone aliases**: provider-agnostic boundaries (env-driven adapter), API + Prisma as needed, dashboard UX for provisioning/forwarding/status, clear errors when provider is not configured.

**Constraints:** Phase 1 only; no Phase 2. Match existing Express/Prisma/dashboard patterns.

**Done when:** `PHASE_1_FOUNDATION.md` phone section, `MILESTONES.md` M5, and `PHONE_INTEGRATION.md` reflect what shipped; env vars documented.

---

## Run 2 — Data brokers: scan + removal depth (M6–M7)

**Context:** Phase 1. Read `PHASE_1_FOUNDATION.md` (broker scanner + removal), `MILESTONES.md` (M6, M7).

**Mission:** Improve **broker scanning** (workers, rate limits, real vs simulated where the codebase allows) and **removal pipeline** (submission, status tracking, paid-tier gating). Add tests for critical paths.

**Constraints:** Phase 1 only; avoid unrelated refactors.

**Done when:** M6/M7 and deliverable rows updated in roadmap docs; tests pass for new logic.

---

## Run 3 — Vault + email continuity (M2 + email engine)

**Context:** Phase 1. Read `PHASE_1_FOUNDATION.md` (encrypted vault, email alias engine), `docs/roadmap/EMAIL_INBOUND.md`.

**Mission:** Advance **vault E2E** (extension ↔ dashboard sync merge/conflict or documented rules + implementation) and/or **email path** (inbound webhook hardening, inbox UX, forwarding fields) — prioritize whichever is more incomplete in the repo after a quick audit.

**Constraints:** Phase 1 only; crypto/sensitive data handled per existing `@phantom/shared` patterns.

**Done when:** M2 and relevant email/vault bullets in `PHASE_1_FOUNDATION.md` updated; `EMAIL_INBOUND.md` aligned if behavior changed.

---

## Run 4 — Launch + paid tier (M8–M9)

**Context:** Phase 1. Read `docs/roadmap/DEPLOYMENT.md`, `CHROME_WEB_STORE_CHECKLIST.md`, `EXTENSION_STORE_BUILD.md` (or equivalent store build doc), `PHASE_1_FOUNDATION.md` (Free/Paid tier), `MILESTONES.md` (M8, M9).

**Mission:** Move **public launch readiness** and **paid tier**: store-ready extension build steps, deploy checklist alignment, **Stripe (or chosen) checkout + webhooks** updating subscription/tier in DB, gated features consistent with `User.tier`. Secrets via env only.

**Constraints:** Phase 1 only; document anything blocked on external accounts (Chrome Web Store, DNS, legal).

**Done when:** M8/M9 and paid-tier rows in roadmap docs updated; new routes/webhooks tested in dev.

---

## Run 5 — QA, onboarding, and doc sync

**Context:** Phase 1. Read `PHASE_1_FOUNDATION.md` (Onboarding, Testing and QA), `docs/roadmap/README.md`.

**Mission:** Add **integration or E2E** coverage for the most critical flows (login, alias create, vault sync touchpoint, broker scan, checkout webhook if present). Improve **onboarding** where cheap (extension install → first alias). **Reconcile** all Phase 1 roadmap percentages with the repo; update `README.md` “Recently shipped” and fix any stale bullets.

**Constraints:** Phase 1 only; no new features unless they close gaps listed in Phase 1 doc.

**Done when:** CI meaningful for core paths; roadmap is internally consistent; short “remaining before Phase 1 complete” list is explicit.

---

## Remaining before Phase 1 complete

Engineering judgment: Phase 1 is **not** “all green” until external and high-effort items below are either done or explicitly accepted as post-launch.

| Category | What’s left |
|----------|-------------|
| **External** | Chrome Web Store **account + listing + review**; **live DNS/TLS** for API and dashboard; **legal** review of privacy policy / ToS; **live Stripe** keys + **live** webhook URL; **email** MX + inbound worker (see `EMAIL_INBOUND.md`); **phone** real carrier/Twilio production (see `PHONE_INTEGRATION.md`). |
| **Product / QA** | Playwright **E2E** not required for Phase 1 exit in repo today — **manual** list in `QA_MANUAL.md`; **load** and **security audit** are external engagements. |
| **Nice-to-have** | SRP auth; Argon2id vault KDF; community threat feed; CSV import; Terraform/AWS automation — tracked in `PHASE_1_FOUNDATION.md` gaps table. |

For the rolling **% complete** model, see [`README.md`](./README.md) in this folder.

---

## Run 6 — Post–mega-sprint (Phase 1 honesty + shell + polish)

**Scope:** Unify **demo overview metrics** behind **`DASHBOARD_DEMO_METRICS=1`** with **`OVERVIEW_DEMO_METRICS`** as an alias (`envOverviewDemo.ts` + tests); **production** still returns honest zeros unless an operator sets either var. **Placeholder** routes (Call Guard, Scam engage, Threat intel, Reports, Family) now carry explicit **Phase 2** notices so they are not mistaken for shipped features. **Onboarding** adds **sign in → first alias** (pin/extension toolbar + MV3 popup note + https vs `chrome-extension://` clarity). **Alias detail:** **`UpgradeModal`** on **`tier_limit`** from rotate/deactivate, **`userMe`** prefetch for email forward, notification query invalidation after mutations. **Extension content script:** **open shadow root** traversal, **native value setter** for React/Vue inputs, richer **`InputEvent`**. **Notification center:** **Retry** on list load error. Docs: **`DEPLOYMENT.md`** / **`.env.example`** / dashboard copy for demo env names.

**Outcome:** Clearer prod vs demo story for Sword/SEE-style metrics; fewer misleading nav targets; incremental MVP hardening without new Phase 2 backends.

**Deferred / external:** Live Call Guard, SEE, threat feeds, outbound **`NOTIFICATIONS_EMAIL_ENABLED`** mailer — unchanged; still blocked on product + infra per roadmap tables.

---

## Run 7 — Batch 3 (ops, API hardening, store, QA)

**Scope:** **`error.requestId`** on global **404** / **5xx** JSON when **`NODE_ENV !== 'production'`** (shared **`ApiErrorBody`**); production keeps generic messages without body `requestId` ( **`X-Request-Id`** header unchanged). **`DEPLOYMENT.md`** request-tracing + **docker-compose** port overrides + optional **Elasticsearch** row. **`QA_MANUAL`** — 8-step onboarding, dark web + overview demo metrics, billing query params, vault **409** note, notification **Retry**, integration table for **`POST /api/dark-web/seed-demo`** production **403**. **Tests:** **`darkWeb.integration.test`** production seed-demo; **`webhookEmailInbound`** **415** asserts **`X-Request-Id`**; **`app.test`** 404 **`requestId`** in non-prod; **`errorJson.test`** requestId injection.

**Outcome:** Clearer support correlation in dev/staging; demo seeds documented consistently; no change to Stripe idempotency or rate-limit **fail-open** behavior.

**External:** CWS account, live Stripe/MX, legal privacy URL — unchanged.

---

## Run 8 — Batch 4 (perf, a11y, shared errors, DX polish)

**Scope:** **React Query** — single **`QUERY_GC_TIME_MS`** wired to **`queryClient`**; **`STALE.vaultSync`** for vault sync push; **lazy** **`AliasesPage`**, **`AliasDetailPage`**, **`SettingsPage`** under existing **`Suspense`**. **a11y** — **`useRestoreFocusToMainOnClose`** for **Onboarding**, **Upgrade**, **Generate** modals; **`aria-busy`** on billing checkout/portal, generate mutations, sign-out; **Billing** error surfaces match **Retry** + alert pattern; **MobileNavBar** safe-area padding + **44px** touch targets; **TopBar** bell + **Generate alias** minimum tap size + safe-area top. **`@phantom/shared`** — **`PHANTOM_API_ERROR_CODES`** + **`normalizeClientError`** / **`upgradeCopy`** / tests deduped. **Overview API** — **`alias.findMany`** uses **`select`** for health stats payload. **Docs:** root **README** “5-minute local” + script table (**`build:extension:store`**); **`DEPLOYMENT.md`** CSP note for static dashboard.

**Deferred:** List virtualization; new Prisma indexes (existing notification/dark-web indexes retained; activity feeds already **`take`**-bounded); Playwright E2E; live third-party integrations.

**External:** Unchanged (CWS, live Stripe, MX, legal).

---

## Run 9 — Batch 5 (tests, verticals, resilience)

**Scope:** **`@phantom/shared`** **`forwardEmail`** (`parseForwardToEmailPatchBody`, **`isValidForwardEmailInput`**) — single validation path for **`PATCH /api/user/me`** and dashboard Settings; **`GET /api/email-inbox`** **`offset`** + **`data.meta`** with clamped limits; integration tests (invalid forward email, inbox clamp, idempotent read PATCH, existing auth/vault/notifications coverage retained). **Dashboard** **`FeatureRouteErrorBoundary`** around **`Outlet`** for lazy-route chunk failures. **Docs:** **`EMAIL_INBOUND.md`** + **`DEPLOYMENT.md`** (inbox query + readiness vs liveness); **`CONTRIBUTING.md`**; **`CHANGELOG.md`** Unreleased; **`README`** integration-test pointer; **`dashboardRoutes.test.ts`** notification deep-link sanity.

**Deferred:** Playwright E2E; Phase 2 surfaces.

**External:** Unchanged.

---

## Run 10 — Launch handoff + last-mile polish (Phase 1 endgame)

**Scope:** **Docs:** [CHROME_WEB_STORE_CHECKLIST.md](./CHROME_WEB_STORE_CHECKLIST.md) Run 10 manifest verification vs **`package.json`** / prod **`manifest.json`**; [EXTENSION_STORE_BUILD.md](./EXTENSION_STORE_BUILD.md) Run 10 **confirm** block (**`npm run build:extension:store`** → **`src/extension/build/chrome-mv3-prod/`**); [DEPLOYMENT.md](./DEPLOYMENT.md) **external blockers** table (**owner + blocker** per: Stripe webhook, dashboard URL, API TLS, inbound worker, Twilio prod, CWS, legal) + **engineering vs ops** pointer; [QA_MANUAL.md](./QA_MANUAL.md) stakeholder **engineering closed vs waiting on ops**; [PHASE_2_INTELLIGENCE.md](./PHASE_2_INTELLIGENCE.md) **5-bullet** Phase 1→2 handoff (**docs only**). **Extension:** extract **`setNativeInputValue`** → **`nativeInputValue.ts`** + **jsdom** unit test; content-script **shield** uses real **`<button type="button">`**; popup **Sign in** / **Sign out** / **Generate** **`aria-busy`** + disabled while pending. **Shared:** **`broker_scan_config_invalid`** code; **`normalizeClientError`** maps it; **BrokersPage** explicit copy + **DEPLOYMENT.md** pointer on scan **503** config errors.

**Outcome:** Store/deploy docs aligned with repo; clear launch boundary for stakeholders; no new backends (Call Guard, SEE, SMTP, CSV).

**External:** Unchanged (CWS, live Stripe, MX, legal, prod Twilio).
