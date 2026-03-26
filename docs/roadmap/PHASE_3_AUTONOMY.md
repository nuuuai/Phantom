# Phase 3 — Autonomy (Months 12–18)

## Objective

Deploy the Autopilot layer. Full autonomous identity management, advanced Scammer Engagement Engine with gamification, deepfake voice detection, Family Command Center, and natural language interface.

## Platform Scope

| Platform | Status |
|----------|--------|
| Chrome/Firefox/Safari Extension | **ENHANCE** — NLI, autopilot controls |
| Web Dashboard | **ENHANCE** — Family center, gamification, advanced reports |
| Mobile Apps | **DESIGN** — UI/UX design begins, no build yet |

## Deliverables

### Month 12–14: Autopilot Mode

- [ ] **Tiered autonomy system**
  - Notify Only → Suggest + Auto-Queue → Auto with Undo → Full Autopilot
  - Per-feature autonomy settings (alias rotation, password changes, broker removal)
  - Dashboard: autonomy level selector with clear explanations
  - Undo system: 7-day rollback for any autonomous action

- [ ] **Autonomous alias rotation**
  - Rotation triggers: health drop, age limit, spam threshold, breach detection
  - AutoCloak: programmatic credential update at source services
  - Migration: forwarding rules transfer from old to new alias
  - Quarantine: old alias monitored 30 days before retirement
  - Dashboard: rotation history and upcoming scheduled rotations

- [ ] **Breach auto-response**
  - Credential Rotation Engine: change passwords at source services
  - Email alias quarantine + replacement pipeline
  - Phone number lock + replacement pipeline
  - Response timeline in dashboard (what happened, what was done, when)
  - User notification with action summary

- [ ] **Monthly exposure report**
  - AI-generated document (PDF + in-dashboard view)
  - Risk score trend, broker removal progress, alias health summary
  - Scam calls blocked/engaged, dark web findings
  - Breach incidents and automated responses
  - Recommendations for improving privacy posture
  - Email delivery + dashboard archive

### Month 14–16: Scammer Engagement Engine v2

- [ ] **Full persona library**
  - 8+ personas (add: Lonely Optimist, Angry but Curious, Corporate Gatekeeper, Distracted Parent, Eager Investor)
  - Advanced conversation models (longer engagement, better adaptation)
  - Per-persona voice profiles (TTS with age/accent/speech patterns)
  - Adaptive behavior (adjust approach based on scammer responses)

- [ ] **Gamification system**
  - Scam Leaderboard: longest engagements, most time wasted
  - Scam of the Week: curated best transcript
  - Impact Dashboard: personal stats (minutes wasted, complaints filed, scams prevented estimate)
  - Achievement badges: "100 Minutes Wasted," "First Complaint Filed," "Scam Network Exposed"
  - Social sharing: one-click share anonymized transcripts

- [ ] **Live listening**
  - Opt-in real-time audio stream of active scam engagements
  - Dashboard player with transcript alongside audio
  - Community feed of active engagements (anonymized)

- [ ] **Deepfake voice detection v1**
  - Spectral analysis for TTS/voice-cloning artifacts
  - Audio fingerprinting against known deepfake generation patterns
  - Confidence score in call transcript: "Voice: 94% likely AI-generated"
  - Alert: "This caller's voice may be synthetic"
  - Optional: user registers family voice samples for comparison

### Month 16–18: Family + NLI + Desktop Notifications

- [ ] **Family Command Center**
  - Family plan account structure (up to 6 members)
  - Per-member alias management and risk scoring
  - Shared threat dashboard (family-wide view)
  - Elder Protection Mode: lower screening thresholds, all unknown calls screened, financial alerts
  - Parental Controls: age-appropriate alias categories, activity visibility
  - Weekly family digest email

- [ ] **Natural language interface**
  - LLM-powered conversational interface in dashboard
  - Tool use: AI can execute Phantom actions (create alias, rotate password, check risk score)
  - Context-aware: understands current aliases, recent threats, user preferences
  - Examples: "Create a shopping identity," "Why am I getting calls from 800 numbers?"
  - Extension: quick NLI in popup (shorter interactions)

- [ ] **Desktop notification system**
  - System-level notifications (browser notification API)
  - Priority levels: critical (breach), high (scam detected), medium (alias warning), low (report ready)
  - Notification preferences per category
  - Click-through to relevant dashboard section

- [ ] **eSIM multi-profile support**
  - Multiple eSIM numbers per device
  - Context-based: work, personal, dating, shopping, travel
  - Dashboard management of eSIM profiles
  - eSIM ↔ alias identity linking

## Success Metrics (End of Phase 3)

| Metric | Target |
|--------|--------|
| Paid subscribers | 25,000 |
| Autopilot-enabled users | 40% of paid |
| Avg scammer engagement time | 18 min |
| Monthly exposure reports generated | 20,000 |
| Family plan accounts | 3,000 |
| NLI interactions / day | 5,000 |
| Deepfake detections | 1,000 |
| Social shares of transcripts | 10,000 |

## Key Risks

| Risk | Mitigation |
|------|-----------|
| AutoCloak breaks service logins | Start with top 50 services. Extensive testing. Easy rollback. User approval for risky services. |
| Deepfake detection false positives | Conservative thresholds. Label as "possible" not "confirmed." User decides action. |
| Family plan complexity | Simple onboarding. Guided setup per family member. Progressive disclosure. |
| NLI executing wrong actions | Confirmation prompts for destructive actions. Undo for everything. Audit log. |
