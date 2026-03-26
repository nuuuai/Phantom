# QA — automated vs manual (Phase 1)

## Automated (CI + local)

| Area | What runs | Where |
|------|-----------|--------|
| Lint / unit tests | Full monorepo `npm run lint` + `npm run test` | `.github/workflows/ci.yml` |
| API smoke | `GET /health/live`, `GET /health`, `POST /api/auth/login` validation, webhooks unconfigured paths | `src/api/src/app.test.ts` |
| **Integration (requires Postgres)** | Auth register → login → `GET /api/user/me`; Stripe signed webhooks (`checkout.session.completed`, `customer.subscription.deleted`); **duplicate `event.id`** returns `{ duplicate: true }` without double-applying tier | `src/api/src/launch.integration.test.ts` |
| **Integration (requires Postgres)** | Register + aliases; vault sync conflict | `src/api/src/auth.integration.test.ts` |

Integration suites are **skipped** when `DATABASE_URL` is unset or equals the vitest placeholder (`phantom_placeholder`). They run in **GitHub Actions** (Postgres service + `DATABASE_URL`). Locally, use a real `DATABASE_URL` in repo-root `.env` to enable them.

## Manual (pre-launch)

Run before Chrome Web Store submit and first production deploy.

### Dashboard + API

- [ ] Register and log in on production (or staging) dashboard URL.
- [ ] Create email alias; confirm it appears in alias list.
- [ ] **Billing:** start Checkout (Stripe test mode on staging), complete test card; confirm **`/billing?session_id=`** triggers tier sync and UI shows **paid** (webhook may follow slightly later).
- [ ] **Billing:** repeat the same Checkout session webhook delivery (or Stripe CLI resend) and confirm API returns **`200`** with **`duplicate: true`** — user tier should **not** flip twice.
- [ ] **Billing:** open Customer Portal from dashboard; cancel subscription; confirm tier returns to **free** after `customer.subscription.deleted` (or equivalent) webhook.
- [ ] **Vault:** unlock vault with password; add or rotate a password; confirm **Encrypted backup · vN** and **Last synced** update on **Vault** page after sync succeeds.
- [ ] **Vault:** with two browsers/sessions, provoke a sync conflict (edit vault on both); confirm **Retry sync** recovers after merge (LWW in `@phantom/shared`).
- [ ] Broker scan: run scan, open results, confirm free vs Pro removal CTAs match account tier; confirm **429** / **Retry-After** when free-tier scan cap exceeded in 24h.

### Extension

- [ ] Install unpacked dev build OR store build; set **`PLASMO_PUBLIC_API_URL`** to target environment (`EXTENSION_STORE_BUILD.md`).
- [ ] Log in from extension; generate alias; autofill on a known test page.
- [ ] **Auth:** let access token expire (or revoke server-side); trigger an authenticated action — extension should **refresh** session once; on API **503** on refresh, a **second attempt** is scheduled (see `apiClient.ts`).
- [ ] Optional: vault unlock / sync — confirm best-effort push after login (background `pushVaultSyncFromExtension`).

### Ops

- [ ] `GET /health/live` and `GET /health` return expected JSON behind TLS (`DEPLOYMENT.md`).
- [ ] CORS: dashboard origin allowed; credentials work for API calls.
- [ ] Stripe Dashboard: webhook URL **`POST /api/webhooks/stripe`** receives **`200`**; **`StripeWebhookEvent`** rows accumulate unique **`event.id`** values.

## Deferred (Phase 1 gap)

- Full **Playwright** E2E (dashboard + extension) — not wired in repo; add in a later milestone if desired.
- **Load testing** and **third-party security audit** — manual engagement, not automated here.
- **Outbound email notifications** (SES/SMTP) — reserved env names in **`DEPLOYMENT.md`**; no sender in repo yet.
