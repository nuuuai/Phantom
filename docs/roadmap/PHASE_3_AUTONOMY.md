# Phase 3 — Autonomy (Months 12–18)

> **Progress:** Each deliverable shows **% complete** (0% = not started).

| Track | Avg |
|-------|-----|
| Autopilot + rotation + breach | **0%** |
| SEE v2 + gamification + deepfake | **0%** |
| Family + NLI + desktop + eSIM | **0%** |
| **Phase 3 (overall)** | **0%** |

## Objective

Deploy the Autopilot layer. Full autonomous identity management, advanced Scammer Engagement Engine with gamification, deepfake voice detection, Family Command Center, and natural language interface.

## Platform Scope

| Platform | Status | Progress |
|----------|--------|----------|
| Chrome/Firefox/Safari Extension | **ENHANCE** — NLI, autopilot controls | **0%** |
| Web Dashboard | **ENHANCE** — Family center, gamification, advanced reports | **0%** |
| Mobile Apps | **DESIGN** — UI/UX design begins, no build yet | **0%** |

## Deliverables

### Month 12–14: Autopilot Mode

- [ ] **Tiered autonomy system** — **0%**
  - Notify Only → Suggest + Auto-Queue → Auto with Undo → Full Autopilot — **0%**
  - Per-feature autonomy settings (alias rotation, password changes, broker removal) — **0%**
  - Dashboard: autonomy level selector with clear explanations — **0%**
  - Undo system: 7-day rollback for any autonomous action — **0%**

- [ ] **Autonomous alias rotation** — **0%**
  - Rotation triggers: health drop, age limit, spam threshold, breach detection — **0%**
  - AutoCloak: programmatic credential update at source services — **0%**
  - Migration: forwarding rules transfer from old to new alias — **0%**
  - Quarantine: old alias monitored 30 days before retirement — **0%**
  - Dashboard: rotation history and upcoming scheduled rotations — **0%**

- [ ] **Breach auto-response** — **0%**
  - Credential Rotation Engine: change passwords at source services — **0%**
  - Email alias quarantine + replacement pipeline — **0%**
  - Phone number lock + replacement pipeline — **0%**
  - Response timeline in dashboard (what happened, what was done, when) — **0%**
  - User notification with action summary — **0%**

- [ ] **Monthly exposure report** — **0%**
  - AI-generated document (PDF + in-dashboard view) — **0%**
  - Risk score trend, broker removal progress, alias health summary — **0%**
  - Scam calls blocked/engaged, dark web findings — **0%**
  - Breach incidents and automated responses — **0%**
  - Recommendations for improving privacy posture — **0%**
  - Email delivery + dashboard archive — **0%**

### Month 14–16: Scammer Engagement Engine v2

- [ ] **Full persona library** — **0%**
  - 8+ personas (add: Lonely Optimist, Angry but Curious, Corporate Gatekeeper, Distracted Parent, Eager Investor) — **0%**
  - Advanced conversation models (longer engagement, better adaptation) — **0%**
  - Per-persona voice profiles (TTS with age/accent/speech patterns) — **0%**
  - Adaptive behavior (adjust approach based on scammer responses) — **0%**

- [ ] **Gamification system** — **0%**
  - Scam Leaderboard: longest engagements, most time wasted — **0%**
  - Scam of the Week: curated best transcript — **0%**
  - Impact Dashboard: personal stats (minutes wasted, complaints filed, scams prevented estimate) — **0%**
  - Achievement badges: "100 Minutes Wasted," "First Complaint Filed," "Scam Network Exposed" — **0%**
  - Social sharing: one-click share anonymized transcripts — **0%**

- [ ] **Live listening** — **0%**
  - Opt-in real-time audio stream of active scam engagements — **0%**
  - Dashboard player with transcript alongside audio — **0%**
  - Community feed of active engagements (anonymized) — **0%**

- [ ] **Deepfake voice detection v1** — **0%**
  - Spectral analysis for TTS/voice-cloning artifacts — **0%**
  - Audio fingerprinting against known deepfake generation patterns — **0%**
  - Confidence score in call transcript: "Voice: 94% likely AI-generated" — **0%**
  - Alert: "This caller's voice may be synthetic" — **0%**
  - Optional: user registers family voice samples for comparison — **0%**

### Month 16–18: Family + NLI + Desktop Notifications

- [ ] **Family Command Center** — **0%**
  - Family plan account structure (up to 6 members) — **0%**
  - Per-member alias management and risk scoring — **0%**
  - Shared threat dashboard (family-wide view) — **0%**
  - Elder Protection Mode: lower screening thresholds, all unknown calls screened, financial alerts — **0%**
  - Parental Controls: age-appropriate alias categories, activity visibility — **0%**
  - Weekly family digest email — **0%**

- [ ] **Natural language interface** — **0%**
  - LLM-powered conversational interface in dashboard — **0%**
  - Tool use: AI can execute Phantom actions (create alias, rotate password, check risk score) — **0%**
  - Context-aware: understands current aliases, recent threats, user preferences — **0%**
  - Examples: "Create a shopping identity," "Why am I getting calls from 800 numbers?" — **0%**
  - Extension: quick NLI in popup (shorter interactions) — **0%**

- [ ] **Desktop notification system** — **0%**
  - System-level notifications (browser notification API) — **0%**
  - Priority levels: critical (breach), high (scam detected), medium (alias warning), low (report ready) — **0%**
  - Notification preferences per category — **0%**
  - Click-through to relevant dashboard section — **0%**

- [ ] **eSIM multi-profile support** — **0%**
  - Multiple eSIM numbers per device — **0%**
  - Context-based: work, personal, dating, shopping, travel — **0%**
  - Dashboard management of eSIM profiles — **0%**
  - eSIM ↔ alias identity linking — **0%**

## Success Metrics (End of Phase 3)

| Metric | Target | Progress to target |
|--------|--------|---------------------|
| Paid subscribers | 25,000 | **0%** |
| Autopilot-enabled users | 40% of paid | **0%** |
| Avg scammer engagement time | 18 min | **0%** |
| Monthly exposure reports generated | 20,000 | **0%** |
| Family plan accounts | 3,000 | **0%** |
| NLI interactions / day | 5,000 | **0%** |
| Deepfake detections | 1,000 | **0%** |
| Social shares of transcripts | 10,000 | **0%** |

## Key Risks

| Risk | Mitigation | Status |
|------|-----------|--------|
| AutoCloak breaks service logins | Start with top 50 services. Extensive testing. Easy rollback. User approval for risky services. | **Open** |
| Deepfake detection false positives | Conservative thresholds. Label as "possible" not "confirmed." User decides action. | **Open** |
| Family plan complexity | Simple onboarding. Guided setup per family member. Progressive disclosure. | **Open** |
| NLI executing wrong actions | Confirmation prompts for destructive actions. Undo for everything. Audit log. | **Open** |
