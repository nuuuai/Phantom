# Phase 4 — Mobile + Ecosystem (Months 18–24)

> **Progress:** Each deliverable shows **% complete** (0% = not started).

| Track | Avg |
|-------|-----|
| iOS + Android + mobile features | **0%** |
| Kova + VulnIQ + SSO | **0%** |
| Enterprise + international + advanced | **0%** |
| **Phase 4 (overall)** | **0%** |

## Objective

Ship mobile apps (iOS + Android) as polished companions to the proven desktop platform. Full Kova and VulnIQ ecosystem integration. Enterprise product launch. International expansion.

## Platform Scope

| Platform | Status | Progress |
|----------|--------|----------|
| Chrome/Firefox/Safari Extension | **MAINTAIN** — stability, performance | **0%** (phase gate) |
| Web Dashboard | **ENHANCE** — enterprise admin, intl | **0%** |
| iOS App | **BUILD** | **0%** |
| Android App | **BUILD** | **0%** |

## Why Mobile Is Last

Mobile ships last because:
1. Core platform (dashboard + extension) is now battle-tested with 25K+ paid users
2. AI engine, telephony infrastructure, and alias system are proven stable
3. User feedback from 18 months of desktop use informs mobile UX
4. No buggy launch — mobile arrives as a polished companion (unlike Cloaked's rough mobile-first launch)
5. Native call integration requires mature telephony infrastructure

## Deliverables

### Month 18–20: Mobile Apps

- [ ] **iOS app** — **0%**
  - React Native (shared logic with dashboard where possible) — **0%**
  - Native call integration (CallKit for call screening) — **0%**
  - On-device Call Guard (local AI inference for latency) — **0%**
  - Alias lookup and quick generation — **0%**
  - Push notifications (breach alerts, scam detections, alias health) — **0%**
  - Biometric authentication (Face ID / Touch ID) for vault access — **0%**
  - eSIM management — **0%**
  - Exposure report viewer — **0%**
  - Family member management — **0%**

- [ ] **Android app** — **0%**
  - React Native (shared codebase with iOS) — **0%**
  - Native call integration (ConnectionService API) — **0%**
  - On-device Call Guard — **0%**
  - Same feature set as iOS — **0%**
  - Additional: default dialer integration option — **0%**

- [ ] **Mobile-specific features** — **0%**
  - Widget: risk score + quick alias generation on home screen — **0%**
  - Quick actions: long-press app icon for "Generate Alias," "Check Risk" — **0%**
  - Offline mode: cached aliases and credentials accessible without network — **0%**
  - QR code alias sharing (show QR with alias info for in-person signups) — **0%**

### Month 20–22: Ecosystem Integration

- [ ] **Full Kova integration** — **0%**
  - Phantom's AI agents built and deployed through Kova's agent factory — **0%**
  - Agent versioning: rollback to previous agent versions if issues detected — **0%**
  - Agent performance dashboard (accuracy, latency, user satisfaction per agent) — **0%**
  - Custom agent creation: power users can tweak agent behavior via Kova — **0%**
  - Agent marketplace: community-contributed engagement personas — **0%**

- [ ] **Full VulnIQ integration** — **0%**
  - Bidirectional threat intelligence API (production) — **0%**
  - Phantom → VulnIQ: scam transcripts, phishing URLs, deepfake samples, broker behaviors — **0%**
  - VulnIQ → Phantom: vulnerability feeds, breach predictions, threat actor profiles — **0%**
  - Shared threat dashboard (cross-product view) — **0%**
  - VulnIQ-powered service risk scores (inform alias health for specific services) — **0%**

- [ ] **Ecosystem single sign-on** — **0%**
  - One account across Kova, VulnIQ, Phantom — **0%**
  - Unified billing — **0%**
  - Cross-product navigation — **0%**
  - Shared notification center — **0%**

### Month 22–24: Enterprise + International + Advanced

- [ ] **Enterprise product** — **0%**
  - Admin console: manage employee identities, aliases, security policies — **0%**
  - SSO integration (SAML, OIDC) — **0%**
  - Compliance reporting (SOC 2, GDPR, CCPA) — **0%**
  - Bulk alias provisioning for employees — **0%**
  - Threat intelligence feed for corporate security teams — **0%**
  - Per-department policies (sales team gets phone aliases, engineering gets email aliases) — **0%**
  - API for integration with existing security tools (SIEM, MDM) — **0%**

- [ ] **International expansion** — **0%**
  - EU: GDPR compliance (already built-in), EU phone numbers, EU data residency option — **0%**
  - UK: same as EU + UK-specific data brokers — **0%**
  - Canada: PIPEDA compliance, Canadian phone numbers — **0%**
  - Australia: APPs compliance, Australian phone numbers — **0%**
  - Localized dashboard (language support) — **0%**
  - Region-specific broker registries — **0%**

- [ ] **Advanced features** — **0%**
  - Honeypot alias network (bait identities seeded into broker ecosystem) — **0%**
  - Legal escalation pipeline (coordinated group action against repeat-offender brokers) — **0%**
  - Scam network mapping (operation profiles shared with law enforcement) — **0%**
  - Threat Intelligence API (monetized, for telecom and financial institution customers) — **0%**
  - AI outbound agent v2 (appointments, cancellations, rate negotiations) — **0%**
  - Credit monitoring integration (credit report monitoring, dispute automation) — **0%**

## Success Metrics (End of Phase 4)

| Metric | Target | Progress to target |
|--------|--------|---------------------|
| Paid subscribers | 100,000 | **0%** |
| Mobile app installs | 50,000 | **0%** |
| Enterprise accounts | 50 | **0%** |
| Countries supported | 5 | **0%** |
| Ecosystem cross-product users | 10,000 | **0%** |
| Calls screened (total) | 5,000,000 | **0%** |
| Scammer minutes wasted (total) | 500,000 | **0%** |
| Data broker records removed (total) | 10,000,000 | **0%** |
| Threat intelligence API customers | 10 | **0%** |
| ARR | $5M+ | **0%** |

## Key Risks

| Risk | Mitigation | Status |
|------|-----------|--------|
| Mobile app store rejection | Follow Apple/Google guidelines strictly. Privacy-focused apps generally approved. Submit early. | **Open** |
| React Native performance for call screening | On-device inference via ONNX Runtime. Native modules for audio processing. | **Open** |
| Enterprise sales cycle | Start with SMBs. Offer free pilot. Build case studies. | **Open** |
| International regulatory complexity | Partner with local legal counsel per region. Start with most similar markets (UK, Canada). | **Open** |
| Ecosystem integration complexity | API-first design from Phase 1. Well-defined contracts between products. | **Open** |
