# Phase 1 — Foundation (Months 1–6)

> **Progress:** Each deliverable line shows **% complete** for that workstream (rough engineering estimate; update as you ship).

| Section | Avg (of deliverables in section) |
|---------|-------------------------------------|
| Month 1–2 infrastructure | **~38%** |
| Month 2–3 extension + dashboard | **~55%** |
| Month 3–4 phone + brokers | **33%** |
| Month 4–5 removal + notifications | **30%** |
| Month 5–6 launch + QA | **~10%** |
| **Phase 1 (all deliverables)** | **~32%** |

## Objective

Ship the desktop platform MVP: web dashboard + Chrome browser extension. Establish core alias generation, data broker scanning, and password management. Launch free tier to build user base and collect data.

## Platform Scope

| Platform | Status | Progress |
|----------|--------|----------|
| Chrome Extension | **BUILD** — primary user interface | **~55%** |
| Web Dashboard | **BUILD** — command center | **~50%** |
| Firefox/Safari Extension | Not started | **0%** |
| Mobile Apps | Not started | **0%** |

## Deliverables

### Month 1–2: Core Infrastructure

- [ ] **Project scaffolding** — **60%**
  - React + TypeScript + Vite dashboard app — **90%**
  - Plasmo Chrome extension (Manifest V3) — **70%**
  - Node.js + Express API server — **85%**
  - PostgreSQL database with per-user schema isolation — **65%**
  - Redis for sessions and cache — **0%**
  - Docker Compose for local development — **80%**
  - CI/CD pipeline (GitHub Actions) — **80%** (lint + test + build on push/PR)
  - Terraform for AWS infrastructure — **0%**

- [ ] **Authentication system** — **40%**
  - SRP (Secure Remote Password) protocol implementation — **0%**
  - Master passphrase → Argon2id key derivation — **0%**
  - JWT with RS256 (15-min access, 7-day refresh) — **25%** (HS JWT stub; RS256/refresh TBD)
  - Session management in Redis — **0%**

- [ ] **Encrypted vault (client-side)** — **5%**
  - Web Crypto API integration (AES-256-GCM) — **0%**
  - Encrypted IndexedDB in extension — **5%**
  - Per-user isolated database schemas — **0%**
  - Vault sync between extension and dashboard — **0%**

- [ ] **Email alias engine** — **35%**
  - Custom domain setup (phantom.id, shade.email) — **0%**
  - Email alias generation API — **50%** (generated aliases; no MX)
  - Email forwarding infrastructure (inbound → user's real email) — **0%**
  - Alias inbox (view forwarded emails in dashboard) — **0%**
  - SPF, DKIM, DMARC configuration for deliverability — **0%**

### Month 2–3: Extension + Dashboard MVP

- [ ] **Browser extension v1** — **55%**
  - Form detection (heuristic: input types, labels, structure) — **60%** (email/password/username heuristics + label parsing)
  - Alias generation popup (email + password) — **55%**
  - Autofill for generated aliases — **50%** (shield-click fills field value + dispatches events)
  - Shadow DOM injected UI (shield icon on form fields) — **55%** (closed Shadow DOM, positioned icon on each detected field)
  - Service worker for API communication — **60%**
  - Encrypted credential cache in IndexedDB — **10%**

- [ ] **Web dashboard v1** — **55%**
  - Login / account management — **45%** (dev login path)
  - Alias list view (all generated aliases with metadata) — **60%**
  - Alias detail view (service, creation date, health status, forwarding rules) — **40%**
  - Create alias manually (not just from extension) — **55%**
  - Delete / disable alias — **50%**
  - Basic settings (forwarding preferences, notification preferences) — **55%** (account + quotas UI; prefs partial)
  - Notification center (bell icon, unread count, mark read) — **65%** (UI + API + demo seeding)

### Month 3–4: Phone Aliases + Data Broker Scanning

- [ ] **Phone alias engine** — **15%**
  - VoIP number provisioning (temporary bridge until carrier partnership Phase 2) — **0%**
  - Phone alias generation API — **25%** (mock / placeholder numbers)
  - Call forwarding to user's real number — **0%**
  - SMS forwarding to dashboard inbox — **0%**
  - Basic call log in dashboard — **0%**

- [ ] **Data broker scanner** — **55%**
  - Broker registry database (initial 150+ brokers) — **35%** (50 seeded; path to 150+)
  - Scanner workers (parallel, rate-limited) — **0%**
  - Search: name, phone, email, address variations — **40%** (simulated)
  - Results aggregation and storage — **60%**
  - Dashboard: exposure scan results view — **55%**
  - Free tier: scan only (show what's exposed) — **55%**
  - Paid tier: removal submission — **35%** (simulated queue)

- [ ] **Password manager v1** — **35%**
  - Password generation (configurable length, complexity) — **40%** (alias-type passwords)
  - Password storage in encrypted vault — **0%**
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

- [ ] **Notification system** — **40%**
  - Desktop notifications (browser notification API) — **0%**
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

- [ ] **Paid tier ($9.99/mo)** — **0%**
  - Unlimited aliases (email + phone) — **15%** (tier field; not billing)
  - Data broker removal (150+ brokers) — **25%** (simulated removal)
  - Unlimited password storage — **0%**
  - Dark web monitoring (basic) — **0%**
  - Priority support — **0%**

- [ ] **Onboarding flow** — **10%**
  - Extension install → account creation → first alias generation — **15%**
  - Guided exposure scan ("see who's selling your data") — **25%** (brokers page CTA)
  - Import existing passwords — **0%**
  - Generate aliases for top services (Gmail, Amazon, Facebook, etc.) — **0%**

- [ ] **Testing and QA** — **15%**
  - Unit tests for: vault encryption, alias generation, API auth — **15%** (tier limit constants + existing tests)
  - Integration tests for: extension ↔ API, broker scanning — **0%**
  - E2E tests with Playwright (extension + dashboard flows) — **0%**
  - Security audit of encryption implementation — **0%**
  - Load testing for alias generation and broker scanning — **0%**

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
| Custom email domains registered and configured | **0%** |
| VoIP provider partnership signed | **0%** |
| AWS infrastructure provisioned | **0%** |
| Chrome Web Store developer account | **0%** |
| Legal review of terms of service and privacy policy | **0%** |
