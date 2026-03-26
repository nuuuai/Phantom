# QA — automated vs manual (Phase 1)

## Automated (CI + local)

| Area | What runs | Where |
|------|-----------|--------|
| Lint / unit tests | Full monorepo `npm run lint` + `npm run test` | `.github/workflows/ci.yml` |
| API smoke | `GET /health/live`, `GET /health`, `POST /api/auth/login` validation, webhooks unconfigured paths | `src/api/src/app.test.ts` |
| **Integration (requires Postgres)** | Auth register → login → `GET /api/user/me`; Stripe signed webhooks (`checkout.session.completed`, `customer.subscription.deleted`) | `src/api/src/launch.integration.test.ts` |
| **Integration (requires Postgres)** | Register + aliases; vault sync conflict | `src/api/src/auth.integration.test.ts` |

Integration suites are **skipped** when `DATABASE_URL` is unset or equals the vitest placeholder (`phantom_placeholder`). They run in **GitHub Actions** (Postgres service + `DATABASE_URL`). Locally, use a real `DATABASE_URL` in repo-root `.env` to enable them.

## Manual (pre-launch)

Run before Chrome Web Store submit and first production deploy.

### Dashboard + API

- [ ] Register and log in on production (or staging) dashboard URL.
- [ ] Create email alias; confirm it appears in alias list.
- [ ] **Billing:** start Checkout (Stripe test mode on staging), complete test card, confirm `User.tier` becomes **paid** after webhook (or use Stripe Dashboard → **Send test webhook** to your endpoint).
- [ ] **Billing:** open Customer Portal from dashboard; cancel subscription; confirm tier returns to **free** after `customer.subscription.deleted` (or equivalent) webhook.
- [ ] Broker scan: run scan, open results, confirm free vs Pro removal CTAs match account tier.

### Extension

- [ ] Install unpacked dev build OR store build; set API URL to target environment.
- [ ] Log in from extension; generate alias; autofill on a known test page.
- [ ] Optional: vault unlock / sync if testing E2E encryption path.

### Ops

- [ ] `GET /health/live` and `GET /health` return expected JSON behind TLS.
- [ ] CORS: dashboard origin allowed; credentials work for API calls.

## Deferred (Phase 1 gap)

- Full **Playwright** E2E (dashboard + extension) — not wired in repo; add in a later milestone if desired.
- **Load testing** and **third-party security audit** — manual engagement, not automated here.
