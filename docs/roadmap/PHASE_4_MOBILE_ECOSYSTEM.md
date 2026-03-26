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

| Platform | Status |
|----------|--------|
| Chrome/Firefox/Safari Extension | **MAINTAIN** — stability, performance |
| Web Dashboard | **ENHANCE** — enterprise admin, intl |
| iOS App | **BUILD** |
| Android App | **BUILD** |

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
  - React Native (shared logic with dashboard where possible)
  - Native call integration (CallKit for call screening)
  - On-device Call Guard (local AI inference for latency)
  - Alias lookup and quick generation
  - Push notifications (breach alerts, scam detections, alias health)
  - Biometric authentication (Face ID / Touch ID) for vault access
  - eSIM management
  - Exposure report viewer
  - Family member management

- [ ] **Android app** — **0%**
  - React Native (shared codebase with iOS)
  - Native call integration (ConnectionService API)
  - On-device Call Guard
  - Same feature set as iOS
  - Additional: default dialer integration option

- [ ] **Mobile-specific features** — **0%**
  - Widget: risk score + quick alias generation on home screen
  - Quick actions: long-press app icon for "Generate Alias," "Check Risk"
  - Offline mode: cached aliases and credentials accessible without network
  - QR code alias sharing (show QR with alias info for in-person signups)

### Month 20–22: Ecosystem Integration

- [ ] **Full Kova integration** — **0%**
  - Phantom's AI agents built and deployed through Kova's agent factory
  - Agent versioning: rollback to previous agent versions if issues detected
  - Agent performance dashboard (accuracy, latency, user satisfaction per agent)
  - Custom agent creation: power users can tweak agent behavior via Kova
  - Agent marketplace: community-contributed engagement personas

- [ ] **Full VulnIQ integration** — **0%**
  - Bidirectional threat intelligence API (production)
  - Phantom → VulnIQ: scam transcripts, phishing URLs, deepfake samples, broker behaviors
  - VulnIQ → Phantom: vulnerability feeds, breach predictions, threat actor profiles
  - Shared threat dashboard (cross-product view)
  - VulnIQ-powered service risk scores (inform alias health for specific services)

- [ ] **Ecosystem single sign-on** — **0%**
  - One account across Kova, VulnIQ, Phantom
  - Unified billing
  - Cross-product navigation
  - Shared notification center

### Month 22–24: Enterprise + International + Advanced

- [ ] **Enterprise product** — **0%**
  - Admin console: manage employee identities, aliases, security policies
  - SSO integration (SAML, OIDC)
  - Compliance reporting (SOC 2, GDPR, CCPA)
  - Bulk alias provisioning for employees
  - Threat intelligence feed for corporate security teams
  - Per-department policies (sales team gets phone aliases, engineering gets email aliases)
  - API for integration with existing security tools (SIEM, MDM)

- [ ] **International expansion** — **0%**
  - EU: GDPR compliance (already built-in), EU phone numbers, EU data residency option
  - UK: same as EU + UK-specific data brokers
  - Canada: PIPEDA compliance, Canadian phone numbers
  - Australia: APPs compliance, Australian phone numbers
  - Localized dashboard (language support)
  - Region-specific broker registries

- [ ] **Advanced features** — **0%**
  - Honeypot alias network (bait identities seeded into broker ecosystem)
  - Legal escalation pipeline (coordinated group action against repeat-offender brokers)
  - Scam network mapping (operation profiles shared with law enforcement)
  - Threat Intelligence API (monetized, for telecom and financial institution customers)
  - AI outbound agent v2 (appointments, cancellations, rate negotiations)
  - Credit monitoring integration (credit report monitoring, dispute automation)

## Success Metrics (End of Phase 4)

| Metric | Target |
|--------|--------|
| Paid subscribers | 100,000 |
| Mobile app installs | 50,000 |
| Enterprise accounts | 50 |
| Countries supported | 5 |
| Ecosystem cross-product users | 10,000 |
| Calls screened (total) | 5,000,000 |
| Scammer minutes wasted (total) | 500,000 |
| Data broker records removed (total) | 10,000,000 |
| Threat intelligence API customers | 10 |
| ARR | $5M+ |

## Key Risks

| Risk | Mitigation |
|------|-----------|
| Mobile app store rejection | Follow Apple/Google guidelines strictly. Privacy-focused apps generally approved. Submit early. |
| React Native performance for call screening | On-device inference via ONNX Runtime. Native modules for audio processing. |
| Enterprise sales cycle | Start with SMBs. Offer free pilot. Build case studies. |
| International regulatory complexity | Partner with local legal counsel per region. Start with most similar markets (UK, Canada). |
| Ecosystem integration complexity | API-first design from Phase 1. Well-defined contracts between products. |
