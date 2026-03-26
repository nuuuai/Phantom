# Phase 1 — Foundation (Months 1–6)

> **Progress:** Each deliverable line shows **% complete** for that workstream (rough engineering estimate; update as you ship).

| Section | Avg (of deliverables in section) |
|---------|-------------------------------------|
| Month 1–2 infrastructure | **34%** |
| Month 2–3 extension + dashboard | **48%** |
| Month 3–4 phone + brokers | **28%** |
| Month 4–5 removal + notifications | **18%** |
| Month 5–6 launch + QA | **3%** |
| **Phase 1 (all deliverables)** | **~24%** |

## Objective

Ship the desktop platform MVP: web dashboard + Chrome browser extension. Establish core alias generation, data broker scanning, and password management. Launch free tier to build user base and collect data.

## Platform Scope

| Platform | Status |
|----------|--------|
| Chrome Extension | **BUILD** — primary user interface |
| Web Dashboard | **BUILD** — command center |
| Firefox/Safari Extension | Not started |
| Mobile Apps | Not started |

## Deliverables

### Month 1–2: Core Infrastructure

- [ ] **Project scaffolding** — **55%**
  - React + TypeScript + Vite dashboard app
  - Plasmo Chrome extension (Manifest V3)
  - Node.js + Express API server
  - PostgreSQL database with per-user schema isolation
  - Redis for sessions and cache
  - Docker Compose for local development
  - CI/CD pipeline (GitHub Actions)
  - Terraform for AWS infrastructure

- [ ] **Authentication system** — **40%**
  - SRP (Secure Remote Password) protocol implementation
  - Master passphrase → Argon2id key derivation
  - JWT with RS256 (15-min access, 7-day refresh)
  - Session management in Redis

- [ ] **Encrypted vault (client-side)** — **5%**
  - Web Crypto API integration (AES-256-GCM)
  - Encrypted IndexedDB in extension
  - Per-user isolated database schemas
  - Vault sync between extension and dashboard

- [ ] **Email alias engine** — **35%**
  - Custom domain setup (phantom.id, shade.email)
  - Email alias generation API
  - Email forwarding infrastructure (inbound → user's real email)
  - Alias inbox (view forwarded emails in dashboard)
  - SPF, DKIM, DMARC configuration for deliverability

### Month 2–3: Extension + Dashboard MVP

- [ ] **Browser extension v1** — **45%**
  - Form detection (heuristic: input types, labels, structure)
  - Alias generation popup (email + password)
  - Autofill for generated aliases
  - Shadow DOM injected UI (shield icon on form fields)
  - Service worker for API communication
  - Encrypted credential cache in IndexedDB

- [ ] **Web dashboard v1** — **50%**
  - Login / account management
  - Alias list view (all generated aliases with metadata)
  - Alias detail view (service, creation date, health status, forwarding rules)
  - Create alias manually (not just from extension)
  - Delete / disable alias
  - Basic settings (forwarding preferences, notification preferences)

### Month 3–4: Phone Aliases + Data Broker Scanning

- [ ] **Phone alias engine** — **15%**
  - VoIP number provisioning (temporary bridge until carrier partnership Phase 2)
  - Phone alias generation API
  - Call forwarding to user's real number
  - SMS forwarding to dashboard inbox
  - Basic call log in dashboard

- [ ] **Data broker scanner** — **55%**
  - Broker registry database (initial 150+ brokers)
  - Scanner workers (parallel, rate-limited)
  - Search: name, phone, email, address variations
  - Results aggregation and storage
  - Dashboard: exposure scan results view
  - Free tier: scan only (show what's exposed)
  - Paid tier: removal submission

- [ ] **Password manager v1** — **15%**
  - Password generation (configurable length, complexity)
  - Password storage in encrypted vault
  - Import from 1Password, LastPass, Bitwarden (CSV import)
  - Autofill passwords via extension
  - TOTP seed storage and auto-fill

### Month 4–5: Data Broker Removal + Notifications

- [ ] **Data broker removal engine** — **35%**
  - Automated opt-out submission (API brokers)
  - Browser automation for manual-submission brokers (Playwright workers)
  - Submission tracking: { submitted, pending, confirmed, failed }
  - Verification re-scan 7–30 days after submission
  - Dashboard: removal status per broker

- [ ] **Notification system** — **0%**
  - Desktop notifications (browser notification API)
  - Email notifications (breach alerts, removal confirmations)
  - Dashboard notification center (bell icon, unread count)
  - Notification preferences (per-category: alias health, broker removal, security alerts)

### Month 5–6: Polish + Free Tier Launch

- [ ] **Free tier** — **0%**
  - Exposure scan (unlimited)
  - 3 email aliases
  - 1 phone alias
  - Password manager (up to 25 passwords)
  - Community threat feed (read-only)
  - No data broker removal (upsell to paid)

- [ ] **Paid tier ($9.99/mo)** — **0%**
  - Unlimited aliases (email + phone)
  - Data broker removal (150+ brokers)
  - Unlimited password storage
  - Dark web monitoring (basic)
  - Priority support

- [ ] **Onboarding flow** — **0%**
  - Extension install → account creation → first alias generation
  - Guided exposure scan ("see who's selling your data")
  - Import existing passwords
  - Generate aliases for top services (Gmail, Amazon, Facebook, etc.)

- [ ] **Testing and QA** — **10%**
  - Unit tests for: vault encryption, alias generation, API auth
  - Integration tests for: extension ↔ API, broker scanning
  - E2E tests with Playwright (extension + dashboard flows)
  - Security audit of encryption implementation
  - Load testing for alias generation and broker scanning

## Success Metrics (End of Phase 1)

| Metric | Target |
|--------|--------|
| Registered users (free) | 10,000 |
| Paid subscribers | 500 |
| Aliases generated | 50,000 |
| Broker scans completed | 5,000 |
| Extension installs | 15,000 |
| Alias generation latency | < 500ms p95 |
| Dashboard load time | < 2s |
| Extension popup load | < 200ms |
| Uptime | 99.5% |

## Key Risks

| Risk | Mitigation |
|------|-----------|
| Email deliverability issues | Warm up domains gradually. SPF/DKIM/DMARC from day 1. Monitor reputation. |
| VoIP numbers rejected by services | Known limitation. Carrier-grade numbers come in Phase 2. Document which services reject VoIP. |
| Broker scan accuracy | Start with well-known brokers. Manual QA of scan results. User feedback loop. |
| Extension review rejection | Follow Chrome Web Store policies strictly. Minimal permissions. Clear privacy policy. |
| Low free-to-paid conversion | Optimize the "aha moment" (seeing your data exposed). Strong upsell at broker removal step. |

## Dependencies

- Custom email domains registered and configured
- VoIP provider partnership signed
- AWS infrastructure provisioned
- Chrome Web Store developer account
- Legal review of terms of service and privacy policy
