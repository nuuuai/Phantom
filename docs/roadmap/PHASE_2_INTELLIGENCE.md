# Phase 2 — Intelligence (Months 6–12)

## Phase 1 → Phase 2 handoff (docs only)

- **Brain / risk:** Phase 1 ships **heuristic** overview metrics (optional **`DASHBOARD_DEMO_METRICS`**), **alias health** states on aliases, **broker scan** simulation, and **dark web** via **HIBP** when configured — **not** behavioral ML, cross-user baselines, or real-time threat fusion. Phase 2 Brain should build on existing **`userId`**, **`Alias`**, **`Notification`**, and **`GET /api/dashboard/metrics`** patterns.
- **Call Guard / telephony:** Dashboard **placeholder** routes and extension **do not** include SIP, call recording, or carrier APIs. Phase 1 **phone** aliases use **mock** or **Twilio stub**; **PSTN** and **Call Guard** start from **`PHONE_INTEGRATION.md`** + env-driven adapters.
- **Scammer Engagement Engine (SEE):** **Placeholder** “Scam engage” route only. No transcript pipeline, personas, or TTS in repo.
- **Threat intel / community:** **Placeholder** “Threat intel” route; no cross-user network or marketplace feeds wired.
- **Extension:** Shield (alias generation, form shield, vault sync, **`fetchAuth`**) is the baseline; Phase 2 adds **Call Guard UI**, **Firefox/Safari**, and richer **Brain** surfaces — assume **MV3** + **`host_permissions`** model unchanged unless product narrows **`matches`**.

> **Progress:** Each deliverable shows **% complete** (0% = not started).

| Track | Avg |
|-------|-----|
| Brain + risk | **0%** |
| Telephony + Call Guard + SEE | **0%** |
| Threat intel + brokers + complaints | **0%** |
| Cards + VPN + extensions + dark web | **0%** |
| **Phase 2 (overall)** | **0%** |

## Objective

Deploy the AI Brain layer. Launch Call Guard, Scammer Engagement Engine v1, cross-user threat intelligence, and expand to Firefox/Safari. Upgrade to carrier-grade phone numbers. Launch virtual payment cards and VPN.

## Platform Scope

| Platform | Status | Progress |
|----------|--------|----------|
| Chrome Extension | **ENHANCE** — Call Guard UI, threat alerts | **0%** |
| Web Dashboard | **ENHANCE** — SEE transcript viewer, threat intel dashboard | **0%** |
| Firefox Extension | **BUILD** | **0%** |
| Safari Extension | **BUILD** | **0%** |
| Mobile Apps | Not started | **0%** |

## Deliverables

### Month 6–7: The Brain v1

- [ ] **Behavioral baseline engine** — **0%**
  - Time-series data collection (anonymized timestamps, no content) — **0%**
  - 30-day rolling window for baseline calculation — **0%**
  - Anomaly detection (Z-score + ML classifier) — **0%**
  - Per-alias communication pattern tracking — **0%**
  - Weekly baseline recalculation — **0%**

- [ ] **Risk scoring engine** — **0%**
  - 6-factor model (exposure, alias health, breaches, call threats, password hygiene, dark web) — **0%**
  - Real-time score calculation on data change events — **0%**
  - Dashboard widget: risk score with trend chart — **0%**
  - Score-based action triggers (notifications at thresholds) — **0%**

- [ ] **Alias health monitoring** — **0%**
  - 4-state model: Healthy → Warning → Compromised → Quarantined — **0%**
  - Spam volume tracking per alias — **0%**
  - Breach cross-reference (auto-check aliases against new breach databases) — **0%**
  - Health change notifications in extension and dashboard — **0%**
  - Recommended actions per health state — **0%**

### Month 7–9: Telephony Upgrade + Call Guard

- [ ] **Carrier-grade phone numbers** — **0%**
  - Tier-1 carrier partnership signed and integrated — **0%**
  - Migration path from VoIP to carrier numbers — **0%**
  - Number porting for existing users — **0%**
  - Data poisoning engine (multi-user number assignment) — **0%**

- [ ] **Call Guard AI v1** — **0%**
  - SIP/RTP gateway for call interception — **0%**
  - Speech-to-text (Whisper) for caller transcription — **0%**
  - Intent classification model (legitimate / suspicious / scam) — **0%**
  - Call routing: contacts → pass through, unknowns → screen — **0%**
  - Transcript streaming to dashboard via WebSocket — **0%**
  - "Take over" button in dashboard (switch from AI to user mid-call) — **0%**
  - Call log with transcripts in dashboard — **0%**

- [ ] **Scammer Engagement Engine v1** — **0%**
  - 3 initial personas: Confused Retiree, Nervous Newbie, Interested Buyer — **0%**
  - TTS voice synthesis per persona (age-appropriate, distinct voices) — **0%**
  - Background noise injection (TV, keyboard, ambient) — **0%**
  - Engagement quality scoring (is scammer still engaged?) — **0%**
  - Transcript viewer in dashboard (real-time streaming) — **0%**
  - Basic intelligence extraction (payment methods, callback numbers) — **0%**

### Month 9–10: Threat Intelligence + Broker Expansion

- [ ] **Cross-user threat intelligence network** — **0%**
  - Anonymization pipeline (strip PII at point of collection) — **0%**
  - Pattern recognition: scam campaign clustering — **0%**
  - Pre-protection: when pattern detected across 50+ users, alert all users — **0%**
  - Threat feed API (internal, for dashboard consumption) — **0%**
  - VulnIQ bridge (initial API endpoint for threat data exchange) — **0%**

- [ ] **Data broker expansion** — **0%**
  - Broker registry expanded to 250+ — **0%**
  - Re-listing monitor (14-day re-scan cycle) — **0%**
  - Auto-re-removal on re-listing detection — **0%**
  - Dashboard: re-listing tracking per broker — **0%**
  - Basic legal escalation (CCPA notice template for repeat offenders) — **0%**

- [ ] **Automated complaint filing** — **0%**
  - FTC complaint auto-generation from scam engagement transcripts — **0%**
  - FCC complaint submission — **0%**
  - Dashboard: complaint tracking (filed, acknowledged, case number) — **0%**

### Month 10–11: Virtual Cards + VPN

- [ ] **Virtual payment cards** — **0%**
  - Card issuer partnership (Marqeta / Stripe Issuing) — **0%**
  - Card generation API (per-merchant, single-use, recurring) — **0%**
  - Spending limits and merchant locking — **0%**
  - Transaction notifications in dashboard — **0%**
  - Extension: autofill virtual card at checkout — **0%**

- [ ] **VPN** — **0%**
  - WireGuard-based VPN infrastructure — **0%**
  - Identity-aware routing (different exit node per active alias context) — **0%**
  - Extension toggle (one-click enable/disable) — **0%**
  - Dashboard: VPN status, data usage, connection logs — **0%**

### Month 11–12: Firefox/Safari + Dark Web Monitoring

- [ ] **Firefox extension** — **0%**
  - Port Chrome extension via Plasmo — **0%**
  - Firefox Add-ons store submission — **0%**
  - Cross-browser testing — **0%**

- [ ] **Safari extension** — **0%**
  - Plasmo → Safari Web Extension conversion — **0%**
  - App Store submission (requires Xcode wrapper) — **0%**
  - macOS/iOS Safari testing — **0%**

- [ ] **Dark web monitoring** — **0%**
  - Integration with dark web data providers — **0%**
  - Monitoring: SSN, emails, phones, credit cards, addresses — **0%**
  - Alert pipeline: detection → classification → notification → recommended action — **0%**
  - Dashboard: dark web findings list with severity — **0%**

- [ ] **Identity theft insurance** — **0%**
  - Insurance provider partnership (AIG or similar) — **0%**
  - Integration into account provisioning — **0%**
  - Claims process documentation — **0%**

## Success Metrics (End of Phase 2)

| Metric | Target | Progress to target |
|--------|--------|---------------------|
| Paid subscribers | 5,000 | **0%** |
| Total aliases generated | 500,000 | **0%** |
| Calls screened | 100,000 | **0%** |
| Scam engagements completed | 10,000 | **0%** |
| Avg scammer time wasted | 12 min | **0%** |
| FTC complaints filed | 5,000 | **0%** |
| Brokers covered | 250+ | **0%** |
| Cross-user threat patterns | 500+ | **0%** |
| Firefox/Safari installs | 5,000 | **0%** |

## Key Risks

| Risk | Mitigation | Status |
|------|-----------|--------|
| Carrier partnership delays | Keep VoIP as fallback. Document carrier-rejected services for transparency. | **Open** |
| Call Guard false positives | Conservative thresholds (default: only block >80% confidence). Easy override. User feedback training loop. | **Open** |
| SEE personas not convincing | Extensive testing with real scam call recordings. Iterate on voice quality and conversation flow. | **Open** |
| Virtual card issuer compliance | Start with established issuer (Marqeta). Follow PCI DSS requirements. | **Open** |
| Safari extension approval | Apple review is strict. Start submission process early. Minimal permissions. | **Open** |
