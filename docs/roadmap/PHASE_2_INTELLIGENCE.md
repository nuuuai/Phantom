# Phase 2 — Intelligence (Months 6–12)

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

| Platform | Status |
|----------|--------|
| Chrome Extension | **ENHANCE** — Call Guard UI, threat alerts |
| Web Dashboard | **ENHANCE** — SEE transcript viewer, threat intel dashboard |
| Firefox Extension | **BUILD** |
| Safari Extension | **BUILD** |
| Mobile Apps | Not started |

## Deliverables

### Month 6–7: The Brain v1

- [ ] **Behavioral baseline engine** — **0%**
  - Time-series data collection (anonymized timestamps, no content)
  - 30-day rolling window for baseline calculation
  - Anomaly detection (Z-score + ML classifier)
  - Per-alias communication pattern tracking
  - Weekly baseline recalculation

- [ ] **Risk scoring engine** — **0%**
  - 6-factor model (exposure, alias health, breaches, call threats, password hygiene, dark web)
  - Real-time score calculation on data change events
  - Dashboard widget: risk score with trend chart
  - Score-based action triggers (notifications at thresholds)

- [ ] **Alias health monitoring** — **0%**
  - 4-state model: Healthy → Warning → Compromised → Quarantined
  - Spam volume tracking per alias
  - Breach cross-reference (auto-check aliases against new breach databases)
  - Health change notifications in extension and dashboard
  - Recommended actions per health state

### Month 7–9: Telephony Upgrade + Call Guard

- [ ] **Carrier-grade phone numbers** — **0%**
  - Tier-1 carrier partnership signed and integrated
  - Migration path from VoIP to carrier numbers
  - Number porting for existing users
  - Data poisoning engine (multi-user number assignment)

- [ ] **Call Guard AI v1** — **0%**
  - SIP/RTP gateway for call interception
  - Speech-to-text (Whisper) for caller transcription
  - Intent classification model (legitimate / suspicious / scam)
  - Call routing: contacts → pass through, unknowns → screen
  - Transcript streaming to dashboard via WebSocket
  - "Take over" button in dashboard (switch from AI to user mid-call)
  - Call log with transcripts in dashboard

- [ ] **Scammer Engagement Engine v1** — **0%**
  - 3 initial personas: Confused Retiree, Nervous Newbie, Interested Buyer
  - TTS voice synthesis per persona (age-appropriate, distinct voices)
  - Background noise injection (TV, keyboard, ambient)
  - Engagement quality scoring (is scammer still engaged?)
  - Transcript viewer in dashboard (real-time streaming)
  - Basic intelligence extraction (payment methods, callback numbers)

### Month 9–10: Threat Intelligence + Broker Expansion

- [ ] **Cross-user threat intelligence network** — **0%**
  - Anonymization pipeline (strip PII at point of collection)
  - Pattern recognition: scam campaign clustering
  - Pre-protection: when pattern detected across 50+ users, alert all users
  - Threat feed API (internal, for dashboard consumption)
  - VulnIQ bridge (initial API endpoint for threat data exchange)

- [ ] **Data broker expansion** — **0%**
  - Broker registry expanded to 250+
  - Re-listing monitor (14-day re-scan cycle)
  - Auto-re-removal on re-listing detection
  - Dashboard: re-listing tracking per broker
  - Basic legal escalation (CCPA notice template for repeat offenders)

- [ ] **Automated complaint filing** — **0%**
  - FTC complaint auto-generation from scam engagement transcripts
  - FCC complaint submission
  - Dashboard: complaint tracking (filed, acknowledged, case number)

### Month 10–11: Virtual Cards + VPN

- [ ] **Virtual payment cards** — **0%**
  - Card issuer partnership (Marqeta / Stripe Issuing)
  - Card generation API (per-merchant, single-use, recurring)
  - Spending limits and merchant locking
  - Transaction notifications in dashboard
  - Extension: autofill virtual card at checkout

- [ ] **VPN** — **0%**
  - WireGuard-based VPN infrastructure
  - Identity-aware routing (different exit node per active alias context)
  - Extension toggle (one-click enable/disable)
  - Dashboard: VPN status, data usage, connection logs

### Month 11–12: Firefox/Safari + Dark Web Monitoring

- [ ] **Firefox extension** — **0%**
  - Port Chrome extension via Plasmo
  - Firefox Add-ons store submission
  - Cross-browser testing

- [ ] **Safari extension** — **0%**
  - Plasmo → Safari Web Extension conversion
  - App Store submission (requires Xcode wrapper)
  - macOS/iOS Safari testing

- [ ] **Dark web monitoring** — **0%**
  - Integration with dark web data providers
  - Monitoring: SSN, emails, phones, credit cards, addresses
  - Alert pipeline: detection → classification → notification → recommended action
  - Dashboard: dark web findings list with severity

- [ ] **Identity theft insurance** — **0%**
  - Insurance provider partnership (AIG or similar)
  - Integration into account provisioning
  - Claims process documentation

## Success Metrics (End of Phase 2)

| Metric | Target |
|--------|--------|
| Paid subscribers | 5,000 |
| Total aliases generated | 500,000 |
| Calls screened | 100,000 |
| Scam engagements completed | 10,000 |
| Avg scammer time wasted | 12 min |
| FTC complaints filed | 5,000 |
| Brokers covered | 250+ |
| Cross-user threat patterns | 500+ |
| Firefox/Safari installs | 5,000 |

## Key Risks

| Risk | Mitigation |
|------|-----------|
| Carrier partnership delays | Keep VoIP as fallback. Document carrier-rejected services for transparency. |
| Call Guard false positives | Conservative thresholds (default: only block >80% confidence). Easy override. User feedback training loop. |
| SEE personas not convincing | Extensive testing with real scam call recordings. Iterate on voice quality and conversation flow. |
| Virtual card issuer compliance | Start with established issuer (Marqeta). Follow PCI DSS requirements. |
| Safari extension approval | Apple review is strict. Start submission process early. Minimal permissions. |
