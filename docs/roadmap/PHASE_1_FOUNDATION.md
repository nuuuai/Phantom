# Phase 1 — Foundation (Months 1–6)

> **Progress:** Each deliverable line shows **% complete** for that workstream (rough engineering estimate; update as you ship).

| Section | Avg (of deliverables in section) |
|---------|-------------------------------------|
| Month 1–2 infrastructure | **~52%** |
| Month 2–3 extension + dashboard | **~62%** |
| Month 3–4 phone + brokers | **~42%** |
| Month 4–5 removal + notifications | **~36%** |
| Month 5–6 launch + QA | **~22%** |
| **Phase 1 (all deliverables)** | **~43%** |

## Objective

Ship the desktop platform MVP: web dashboard + Chrome browser extension. Establish core alias generation, data broker scanning, and password management. Launch free tier to build user base and collect data.

## Platform Scope

| Platform | Status | Progress |
|----------|--------|----------|
| Chrome Extension | **BUILD** — primary user interface | **~58%** |
| Web Dashboard | **BUILD** — command center | **~58%** |
| Firefox/Safari Extension | Not started | **0%** |
| Mobile Apps | Not started | **0%** |

## Deliverables

### Month 1–2: Core Infrastructure

- [ ] **Project scaffolding** — **72%**
  - React + TypeScript + Vite dashboard app — **90%**
  - Plasmo Chrome extension (Manifest V3) — **72%**
  - Node.js + Express API server — **88%**
  - PostgreSQL database with per-user schema isolation — **65%**
  - Redis for sessions and cache — **45%** (compose + `REDIS_URL`; refresh-token sessions; optional **Redis-backed global rate limit** via `rate-limit-redis`; `/health` reports redis)
  - Docker Compose for local development — **85%**
  - CI/CD pipeline (GitHub Actions) — **80%** (lint + test + build on push/PR)
  - Terraform for AWS infrastructure — **0%**

- [ ] **Authentication system** — **52%**
  - SRP (Secure Remote Password) protocol implementation — **0%**
  - Master passphrase → Argon2id key derivation — **0%** (vault uses PBKDF2-SHA256 via Web Crypto today)
  - JWT with RS256 (15-min access, 7-day refresh) — **45%** (HS256 dev default; **RS256 when `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY` set**; opaque refresh in Redis)
  - Session management in Redis — **40%** (refresh token store; access JWT stateless)

- [ ] **Encrypted vault (client-side)** — **38%**
  - Web Crypto API integration (AES-256-GCM) — **85%** (`@phantom/shared` vault crypto)
  - Encrypted IndexedDB in extension — **45%** (DEK in `chrome.storage.session`; ciphertext in IndexedDB; legacy hex migration)
  - Per-user isolated database schemas — **0%**
  - Vault sync between extension and dashboard — **35%** (opaque E2E blob: `GET`/`PUT /api/vault/sync` + `User.vaultSync*`; client merge TBD)

- [ ] **Email alias engine** — **55%**
  - Custom domain setup (phantom.id, shade.email) — **0%** (DNS still external)
  - Email alias generation API — **50%** (generated `@phantom.id` aliases; no live MX in repo)
  - Email forwarding infrastructure (inbound → user's real email) — **25%** (signed **`POST /api/webhooks/email-inbound`** + `INBOUND_WEBHOOK_SECRET`; optional `User.forwardToEmail` for future SMTP; worker/MX still external)
  - Alias inbox (view forwarded emails in dashboard) — **45%** (`AliasInboxMessage` + **`GET /api/email-inbox`** + dashboard **`/inbox`**)
  - SPF, DKIM, DMARC configuration for deliverability — **15%** (checklist: `docs/roadmap/EMAIL_INBOUND.md`)

### Month 2–3: Extension + Dashboard MVP

- [ ] **Browser extension v1** — **55%**
  - Form detection (heuristic: input types, labels, structure) — **60%** (email/password/username heuristics + label parsing)
  - Alias generation popup (email + password) — **55%**
  - Autofill for generated aliases — **50%** (shield-click fills field value + dispatches events)
  - Shadow DOM injected UI (shield icon on form fields) — **55%** (closed Shadow DOM, positioned icon on each detected field)
  - Service worker for API communication — **60%**
  - Encrypted credential cache in IndexedDB — **42%** (vault key material encrypted at rest; see extension `vaultStorage`)

- [ ] **Web dashboard v1** — **62%**
  - Login / account management — **50%** (dev login path; **`PATCH /api/user/me`** for `forwardToEmail`)
  - Alias list view (all generated aliases with metadata) — **60%**
  - Alias detail view (service, creation date, health status, forwarding rules) — **40%**
  - Create alias manually (not just from extension) — **55%**
  - Delete / disable alias — **50%**
  - Basic settings (forwarding preferences, notification preferences) — **62%** (account + quotas + **forward-to email**; notification prefs)
  - Notification center (bell icon, unread count, mark read) — **65%** (UI + API + demo seeding)

### Month 3–4: Phone Aliases + Data Broker Scanning

- [ ] **Phone alias engine** — **22%**
  - VoIP number provisioning (temporary bridge until carrier partnership Phase 2) — **0%**
  - Phone alias generation API — **25%** (mock / placeholder numbers)
  - Call forwarding to user's real number — **0%**
  - SMS forwarding to dashboard inbox — **0%**
  - Basic call log in dashboard — **0%**
  - Integration boundaries / env — **40%** (`docs/roadmap/PHONE_INTEGRATION.md`)

- [ ] **Data broker scanner** — **62%**
  - Broker registry database (initial 150+ brokers) — **75%** (50 real + 100 synthetic `.example` rows = 150 seeded)
  - Scanner workers (parallel, rate-limited) — **45%** (bounded concurrency + per-broker delay in `/broker-scan/start`)
  - Search: name, phone, email, address variations — **40%** (simulated)
  - Results aggregation and storage — **60%**
  - Dashboard: exposure scan results view — **55%**
  - Free tier: scan only (show what's exposed) — **55%**
  - Paid tier: removal submission — **35%** (simulated queue)

- [ ] **Password manager v1** — **38%**
  - Password generation (configurable length, complexity) — **40%** (alias-type passwords)
  - Password storage in encrypted vault — **25%** (encrypted `encryptedValue` + extension vault path; sync blob API)
  - Vault dashboard page (card grid, search, filter, strength meter) — **60%**
  - Vault generate modal (service name, category, one-click generate) — **65%**
  - Import from 1Password, LastPass, Bitwarden (CSV import) — **0%**
  - Autofill passwords via extension — **25%** (shield icon triggers fill)
  - TOTP seed storage and auto-fill — **0%**

### Month 4–5: Data Broker Removal + Notifications

- [ ] **Data broker removal engine** — **35%**
  - Automated opt-out submission (API brokers) — **0%**
  - Browser automation for manual-submission brokers (Playwright workers) — **0%**
  - Submission tracking: { submitted, pending, confirmed, failed } — **45%** (simulated states)
  - Verification re-scan 7–30 days after submission — **25%** (simulated advancement)
  - Dashboard: removal status per broker — **40%**

- [ ] **Notification system** — **45%**
  - Desktop notifications (browser notification API) — **28%** (Settings → enable; delivery wiring TBD)
  - Email notifications (breach alerts, removal confirmations) — **0%**
  - Dashboard notification center (bell icon, unread count) — **65%** (API + TopBar bell + dropdown + mark read/all + demo seed)
  - Notification preferences (per-category: alias health, broker removal, security alerts) — **15%** (Prisma schema has category enum; UI prefs TBD)
  - Notification model (Prisma schema, migration, priority/layer/category) — **80%**

### Month 5–6: Polish + Free Tier Launch

- [ ] **Free tier** — **28%**
  - Exposure scan (unlimited) — **50%** (scan exists; limits not enforced)
  - 3 email aliases — **70%** (API-enforced caps on generate + `/api/user/me` usage)
  - 1 phone alias — **70%**
  - Password manager (up to 25 passwords) — **70%** (password-type alias cap)
  - Community threat feed (read-only) — **0%**
  - No data broker removal (upsell to paid) — **40%** (tier gate stub)

- [ ] **Paid tier ($9.99/mo)** — **18%**
  - Unlimited aliases (email + phone) — **15%** (tier field; not billing)
  - Data broker removal (150+ brokers) — **25%** (simulated removal)
  - Unlimited password storage — **0%**
  - Billing / subscription surface — **20%** (`GET /api/billing/status` stub; Stripe env placeholders)
  - Dark web monitoring (basic) — **0%**
  - Priority support — **0%**

- [ ] **Onboarding flow** — **14%**
  - Extension install → account creation → first alias generation — **15%**
  - Guided exposure scan ("see who's selling your data") — **25%** (brokers page CTA)
  - Import existing passwords — **0%**
  - Generate aliases for top services (Gmail, Amazon, Facebook, etc.) — **0%**

- [ ] **Testing and QA** — **30%**
  - Unit tests for: vault encryption, alias generation, API auth — **32%** (+ inbound webhook **HMAC** tests; global rate limit wiring typed)
  - Integration tests for: extension ↔ API, broker scanning — **0%**
  - E2E tests with Playwright (extension + dashboard flows) — **0%**
  - Security audit of encryption implementation — **0%**
  - Load testing for alias generation and broker scanning — **0%**

## Phase 1 — remaining gaps (launch blockers vs nice-to-have)

| Area | Still TODO / external |
|------|------------------------|
| **Auth** | SRP; Argon2id vault KDF (PBKDF2 today). |
| **Vault** | Per-user DB isolation; full client merge for `vault/sync`. |
| **Email** | Live MX + worker calling webhook; outbound forward to `forwardToEmail`; domain purchase/DNS automation. |
| **Phone** | Real VoIP/SMS provider (see `PHONE_INTEGRATION.md`). |
| **Billing** | Stripe Checkout / Portal; webhooks. |
| **Brokers** | Real removal automation / Playwright workers; API brokers beyond simulation. |
| **QA** | E2E (Playwright); extension↔API integration suite; load / security audit. |
| **Store / legal** | CWS submission (`CHROME_WEB_STORE_CHECKLIST.md`); ToS/privacy legal review. |

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
| Chrome Web Store listing + review | **15%** (checklist: `docs/roadmap/CHROME_WEB_STORE_CHECKLIST.md`) |
| VoIP provider partnership signed | **0%** |
| AWS infrastructure provisioned | **0%** |
| Chrome Web Store developer account | **0%** |
| Legal review of terms of service and privacy policy | **0%** |
