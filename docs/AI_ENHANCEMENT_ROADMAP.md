# Phantom — AI Enhancement Roadmap

**Status:** Planning document  
**Last updated:** June 2026  
**Scope:** Dashboard, extension, API intelligence layer, and cross-cutting UX

This document captures a page-by-page enhancement plan to evolve Phantom from a strong Phase 1 **Shield** foundation into a genuinely **AI-native Privacy Operations Center** — aligned with the four-layer architecture (Shield → Brain → Sword → Autopilot) defined in [`OVERVIEW.md`](./OVERVIEW.md) and the Phase 2–3 roadmaps.

---

## Executive Summary

Phantom is positioned as an **AI Privacy Operations Center**, but Phase 1 delivers primarily **Shield** capabilities with rule-based math standing in for Brain, and demo/placeholder surfaces for Sword and Autopilot.

**What works today:**

- Zero-knowledge vault, alias CRUD, broker scan pipeline, HIBP dark web, Stripe billing, extension form shield
- Clean Midnight Editorial UI, four-layer mental model, thoughtful privacy architecture

**What users feel:**

| Layer | Vision | Phase 1 reality |
|-------|--------|-----------------|
| **Shield** | Defensive automation | ~70% — aliases, vault, broker simulation, HIBP |
| **Brain** | Personalized AI intelligence | ~10% — heuristic risk score, no ML, no baselines |
| **Sword** | Scam engagement & counter-ops | ~0% live — demo metrics only when `DASHBOARD_DEMO_METRICS=1` |
| **Autopilot** | Autonomous actions | ~5% — removal simulation on overview load |

**Why enhance now:** Competitors offer alias management. Phantom's moat is **Brain + Sword + Autopilot**. Without AI surfaces, the product is a privacy toolkit. With them, it becomes a bodyguard that thinks, explains, and acts.

**Strategic target:** A **personal privacy AI** that watches identities, explains threats in plain language, acts autonomously when appropriate, and wastes scammers' time so they cannot hurt others.

---

## Current State — Technical Baseline

### Live dashboard routes (Phase 1)

| Path | Component | Status |
|------|-----------|--------|
| `/` | `DashboardPage` | Live — overview metrics, timeline, demo Sword chart |
| `/aliases`, `/aliases/:id` | `AliasesPage`, `AliasDetailPage` | Live — CRUD, health badges, rotate |
| `/inbox` | `EmailInboxPage` | Live — snippet list, no full body viewer |
| `/vault` | `VaultPage` | Live — E2E decrypt, heuristic strength |
| `/brokers` | `BrokersPage` | Live — simulated scan + removal queue |
| `/dark-web` | `DarkWebPage` | Live — HIBP when configured + Pro tier |
| `/billing` | `BillingPage` | Live — Stripe checkout/portal |
| `/settings` | `SettingsPage` | Live — prefs, quotas, notifications |

### Placeholder routes (sidebar, Phase 2+)

| Path | Status |
|------|--------|
| `/call-guard` | Placeholder page only |
| `/scam-engage` | Placeholder page only |
| `/threat-intel` | Placeholder page only |
| `/reports` | Placeholder page only |
| `/family` | Placeholder page only |

### Risk score today

The overview risk score is a heuristic in `src/api/src/lib/buildDashboardOverview.ts` — not the documented 6-factor Brain model:

```
riskScore = clamp(12..92, 22 + exposureCount + compromised*3 - removed/4)
```

Sword metrics (`callsScreened`, `scamsEngaged`, `weeklyScams`) are **zero** in production unless `DASHBOARD_DEMO_METRICS=1` or `OVERVIEW_DEMO_METRICS=1`.

### Related specs

- [`features/LAYER_2_BRAIN.md`](./features/LAYER_2_BRAIN.md) — behavioral baseline, 6-factor risk, NL interface
- [`features/LAYER_3_SWORD.md`](./features/LAYER_3_SWORD.md) — Call Guard, SEE
- [`features/LAYER_4_AUTOPILOT.md`](./features/LAYER_4_AUTOPILOT.md) — autonomous response
- [`features/SCAMMER_ENGAGEMENT_ENGINE.md`](./features/SCAMMER_ENGAGEMENT_ENGINE.md) — SEE deep dive
- [`roadmap/PHASE_2_INTELLIGENCE.md`](./roadmap/PHASE_2_INTELLIGENCE.md) — Brain, Call Guard, threat intel
- [`roadmap/PHASE_3_AUTONOMY.md`](./roadmap/PHASE_3_AUTONOMY.md) — full Autopilot

---

## Cross-Cutting Enhancements

These span every page and should be treated as platform capabilities, not one-off features.

### 1. Phantom Copilot (Natural Language Command Layer)

**Spec reference:** Brain §2.5 Natural Language Interface

Persistent sidebar or floating panel accessible from any route:

| User intent | Copilot action |
|-------------|----------------|
| "Why is my risk score 67?" | Explain 6-factor model with live user data |
| "Create a shopping alias for Amazon" | Call alias API with inferred category |
| "Which aliases should I rotate?" | Rank by health, breach exposure, spam velocity |
| "Summarize my week" | Aggregate timeline + inbox + broker progress |
| "Block all calls from 800 numbers" | Call Guard policy (Phase 2) |

**Implementation (v1):** LLM with tool-use against existing `phantomApi` endpoints. Read access + confirmed write actions. No new data model required for first ship.

**Why:** Privacy tools overwhelm users. One intelligent operator beats nine disconnected pages.

### 2. Proactive Intelligence Feed

Replace or augment the reactive `ActivityTimeline` with AI-prioritized intelligence:

- "Your shopping alias received 3× normal email volume — possible list sale"
- "Broker X re-listed 12 users this week — scan recommended"
- "New IRS scam pattern detected in your area code — enable Call Guard"

Each item: layer tag, confidence, recommended action, one-click execute.

**Why:** The feed should answer **"What should I do next?"** not only **"What happened?"**

### 3. Unified Risk Narrative

Upgrade the overview risk widget:

- 30/90-day trend chart
- 6-factor breakdown (exposure, alias health, breaches, call threats, password hygiene, dark web)
- "What changed this week" delta
- Threshold-based action triggers (per Brain spec: Critical >80, High 60–80, etc.)
- Fix: trend arrow should reflect `riskTrend === 0` (no false ↓)

**Why:** A number without explanation erodes trust. Explainability is non-negotiable for AI positioning.

### 4. Priority Actions Queue

Global component surfaced on overview and via Copilot:

1. Rotate alias X (compromised health + breach cross-ref)
2. Confirm broker removal on Y
3. Review dark web finding Z
4. Unlock vault to audit password reuse

Ranked by impact × urgency. One-click where safe; confirm for destructive actions.

---

## Page-by-Page Enhancements

### `/` — Overview (Command Center)

**Current:** Stat grid, activity timeline, weekly scams chart (zeros or demo), system layers panel, quick actions, getting started when 0 aliases.

| Enhancement | Layer | Priority | Why |
|-------------|-------|----------|-----|
| Risk Intelligence Card (factors + sparklines) | Brain | P0 | Users need *why*, not just a score |
| AI Daily Brief (3-sentence summary) | Brain | P0 | Daily habit; reduces page-hopping |
| Priority Actions Queue | Autopilot | P0 | Passive dashboard → active operator |
| Threat Horizon (re-listing risk, quota limits) | Brain | P1 | Predictive beats reactive |
| Real layer telemetry | All | P1 | Replace "Phase 2" strings with live status |
| Hide or gate demo Sword metrics | Sword | P0 | Synthetic stats erode trust in production |
| Threat Intel Preview (community patterns) | Brain | P1 | Replace empty weekly scams chart until Call Guard ships |

**Files to touch:** `DashboardPage.tsx`, `StatGrid.tsx`, `ActivityTimeline.tsx`, `buildDashboardOverview.ts`, new `RiskIntelligenceCard.tsx`, `DailyBrief.tsx`, `PriorityActionsQueue.tsx`

---

### `/aliases` + `/aliases/:id` — Identity Management

**Current:** Table CRUD, 4-state health badges, rotate/edit/generate modals. Health defaults to `healthy` on create.

| Enhancement | Layer | Priority | Why |
|-------------|-------|----------|-----|
| Alias health score 0–100 per alias | Brain | P0 | Granular signal for sort + Copilot |
| AI category suggestion from URL/domain | Brain | P1 | Reduces friction at creation |
| Compromise prediction (cross-user patterns) | Brain | P1 | Network effect without PII exposure |
| Smart rotation suggestions (before compromise) | Autopilot | P1 | Proactive Shield |
| Usage graph (email/call volume over time) | Brain | P1 | Baseline for anomaly detection |
| "Why this health status?" explainability panel | Brain | P0 | Trust + education on detail page |
| Relationship map (aliases ↔ services ↔ vault reuse) | Brain | P1 | Password hygiene is 10% of risk model but invisible |

**Extension synergy:** Context-aware alias type/category from page domain at point of signup.

**Files:** `AliasesPage.tsx`, `AliasDetailPage.tsx`, `GenerateAliasModal.tsx`, new API endpoints for health score + usage metrics

---

### `/inbox` — Alias Email Inbox

**Current:** Snippet list, read/unread, search. No full message body.

| Enhancement | Layer | Priority | Why |
|-------------|-------|----------|-----|
| Full message viewer (sandboxed HTML) | Shield | P0 | Table stakes for an inbox |
| AI classification (spam/marketing/phishing/transactional) | Brain | P0 | Feeds alias health monitoring |
| Phishing risk score per message + explainability | Shield | P0 | Email Shield, not just phone |
| Auto-quarantine suspicious mail | Autopilot | P1 | Implements Brain anomaly spec (volume spikes) |
| Smart summaries ("3 shipping, 1 phishing") | Brain | P1 | Scan 50 emails in seconds |
| Suggested actions (block, rotate, report) | Autopilot | P1 | Closes the loop |

**Why this matters:** Highest ROI "AI smart" feature without telephony — inbound webhook infrastructure already exists. See [`roadmap/EMAIL_INBOUND.md`](./roadmap/EMAIL_INBOUND.md).

**Files:** `EmailInboxPage.tsx`, new `MessageViewer.tsx`, `src/api/src/routes/emailInbox.ts`, classification service

---

### `/vault` — Password Vault

**Current:** Client-side decrypt, heuristic strength label, rotate/remove, vault sync.

| Enhancement | Layer | Priority | Why |
|-------------|-------|----------|-----|
| Breach cross-reference (k-anonymity hash check) | Brain | P0 | Directly feeds risk score factor |
| Reuse detection graph | Brain | P0 | 10% of risk model, unmeasured today |
| AI password audit ("rotate these 3 first") | Brain | P0 | Actionable vs. generic strength labels |
| 2FA gap analysis | Brain | P1 | Password hygiene completeness |
| Context-aware password generation per site | Shield | P2 | Better than generic rules |
| Compromised credential response playbook | Autopilot | P1 | One-click rotate + alias update suggestions |

**Files:** `VaultPage.tsx`, `VaultGenerateModal.tsx`, shared breach-check utility, vault audit API

---

### `/brokers` — Data Broker Removal

**Current:** Deterministic simulation, DIY opt-out links, simulated Pro removal queue.

| Enhancement | Layer | Priority | Why |
|-------------|-------|----------|-----|
| Real broker scanning (start with 10 live) | Shield | P0 | #1 trust surface — simulation must be labeled or replaced |
| Exposure severity scoring (SSN vs name-only) | Brain | P0 | Prioritization intelligence |
| AI removal orchestration ("remove these 5 first") | Autopilot | P1 | Autopilot wedge on existing queue |
| Re-listing prediction (ML on broker patterns) | Brain | P2 | Spec calls for 14-day re-scan; predict *who* |
| Legal escalation drafts (CCPA/GDPR templates) | Sword | P2 | Differentiator vs DIY competitors |
| Scan progress UX (`BrokerScanningState`) | Shield | P1 | Perceived intelligence during scans |
| Post-scan narrative ("30-day removal plan") | Brain | P1 | Copilot-style output from results |

**Honesty upgrade:** Label simulation clearly in UI until live scans ship, or frame as "preview mode."

**Files:** `BrokersPage.tsx`, `brokerScanSimulation.ts` → real adapter, `BrokerResultsPanel.tsx`

---

### `/dark-web` — Breach Monitoring

**Current:** HIBP integration (Pro + API key), severity badges, rule-based actions, dismiss/refresh.

| Enhancement | Layer | Priority | Why |
|-------------|-------|----------|-----|
| Impact analysis ("password reused on 2 aliases") | Brain | P0 | Connect dark web → vault → aliases |
| Automated response playbook | Autopilot | P0 | Brain spec: auto-response when score > 80 |
| Breach timeline (exposed vs detected) | Brain | P1 | Context reduces panic |
| Expanded monitoring (paste sites, markets) | Shield | P2 | HIBP necessary but not sufficient |
| AI remediation steps per finding | Brain | P1 | Personalized, not generic "change password" |

**Files:** `DarkWebPage.tsx`, `darkWebHibpRefresh.ts`, new impact-analysis service

---

### `/billing` — Subscription

**Current:** Stripe checkout, portal, Pro benefits list.

| Enhancement | Layer | Priority | Why |
|-------------|-------|----------|-----|
| ROI calculator ("Pro saved ~X hours") | Brain | P1 | Justifies subscription with outcomes |
| Usage-based value dashboard | Brain | P1 | Aliases, scans, threats blocked |
| AI plan recommendation | Brain | P2 | Conversion optimization |

**Files:** `BillingPage.tsx`, aggregate metrics from existing APIs

---

### `/settings` — Account & Preferences

**Current:** Forward-to email, quota bars, notification toggles, sign out.

| Enhancement | Layer | Priority | Why |
|-------------|-------|----------|-----|
| Autopilot controls (auto-rotate, auto-quarantine, auto-complaint) | Autopilot | P0 | Users must control autonomous actions |
| AI sensitivity slider (aggressive vs conservative) | Brain | P1 | Personalization |
| Notification digest mode (AI summary vs per-event) | Brain | P1 | Reduce alert fatigue |
| Data export + account deletion | Shield | P0 | Trust requirement for privacy product |
| Production auth UI (dashboard sign-in) | System | P0 | Blocker for real users — dev auto-login only today |

**Files:** `SettingsPage.tsx`, new autopilot prefs in user model + API

---

### Placeholder Routes — Build or De-emphasize

| Route | AI vision | Priority | MVP approach |
|-------|-----------|----------|--------------|
| `/call-guard` | Live screening, transcript stream, take-over | **P0** | Call log UI + WebSocket architecture; mock transcripts until PSTN |
| `/scam-engage` | Personas, engagement timer, intel extraction | **P0** | Transcript viewer + demo sessions; 3 personas per SEE spec |
| `/threat-intel` | Community patterns, pre-protection alerts | **P1** | Anonymized feed from cross-user aggregation |
| `/reports` | AI weekly/monthly exposure reports | **P1** | PDF/email from overview + broker + dark web data |
| `/family` | Shared intel, parental controls, seats | **P2** | Waitlist + basic seat model |

**Nav UX:** Badge placeholders as "Coming Soon" with reduced prominence until MVPs ship. Full placeholder pages erode trust.

---

## Browser Extension Enhancements

Primary touchpoint per platform strategy. Current: CSS selector form detection, shield button, alias generation, vault sync.

| Enhancement | Layer | Priority | Why |
|-------------|-------|----------|-----|
| Context-aware alias generation (domain + labels) | Brain | P0 | "AI" feel within <100ms generation target |
| Site risk badge (domain score) | Brain | P1 | Passive protection on every page |
| Smart autofill (right alias for this site) | Shield | P1 | Reduces wrong-alias mistakes |
| Inline threat warnings | Brain | P1 | Threat intel in context |
| Call Guard popup overlay | Sword | P0 | When telephony ships |
| Copilot mini-chat in popup | Brain | P1 | NL interface where users work |
| On-device field classifier (Phase 2) | Brain | P2 | Beyond heuristic selectors in `form-detector.ts` |

**Files:** `form-detector.ts`, `popup.tsx`, `background.ts`, new risk badge content script

---

## Design & UX Polish

Supports "next level" perception alongside AI features.

| Issue | Fix |
|-------|-----|
| Mixed color tokens (`emerald-400` vs `ph-success`) | Standardize on `ph-*` semantic tokens |
| No shared `Button`, `StatCard`, `Badge` | Extract design system components |
| Mobile nav omits sidebar items | Align `MobileNavBar` with `SidebarNav` |
| Unknown routes redirect to `/` silently | Add 404 page |
| Demo metrics in production | Gate or replace with honest empty states |

**AI-specific UX patterns:**

- **Explainability chips** — every AI score has expandable "Why?"
- **Confidence indicators** — "87% scam confidence" on Call Guard
- **Layer-colored intelligence cards** — Brain purple insights, Autopilot blue scheduled actions
- **Streaming text** — Copilot responses, live transcripts
- **Empty states that teach** — "Enable X to unlock this metric" instead of zeros

See [`design/DESIGN_SYSTEM.md`](./design/DESIGN_SYSTEM.md).

---

## Priority Roadmap

### Tier 1 — AI feel on existing data (weeks, high ROI)

1. Phantom Copilot — NL interface over existing APIs
2. Risk score v2 UI — factor breakdown + trend + recommendations (upgrade heuristic backend)
3. Inbox AI classification — spam/phishing scoring
4. Priority Actions queue on overview
5. Hide or honest-label demo Sword metrics
6. Vault reuse + breach cross-reference
7. Alias health explainability on detail page

### Tier 2 — Core differentiators (months)

8. Call Guard v1 — VoIP/mock PSTN acceptable for MVP
9. SEE v1 — 3 personas, transcript viewer, engagement metrics
10. Real broker scanning — 10 live brokers, expand to 250+
11. Behavioral baseline — email volume per alias, anomaly alerts
12. Threat intel feed — anonymized cross-user patterns
13. Production dashboard auth

### Tier 3 — Autopilot & ecosystem (Phase 3+)

14. Auto-rotate, auto-removal, auto-complaint filing
15. Virtual cards, VPN (identity-aware routing)
16. VulnIQ bridge, family seats, scheduled AI reports
17. Python ML pipelines for call screening and scam classification

Aligns with [`roadmap/PHASE_2_INTELLIGENCE.md`](./roadmap/PHASE_2_INTELLIGENCE.md) and [`roadmap/PHASE_3_AUTONOMY.md`](./roadmap/PHASE_3_AUTONOMY.md).

---

## Quick Wins (Ship First)

Maximum "AI smart" perception with data and infrastructure already in place:

1. **Copilot panel** on overview — "Ask Phantom anything about your account"
2. **AI Daily Brief** from overview + aliases + inbox + brokers
3. **Smart Action Queue** — 3 recommended actions, one-click execute
4. **Alias health explanations** on detail page
5. **Badge placeholder nav** as "Coming Soon"
6. **Inbox message viewer + phishing score**

---

## Success Metrics

| Metric | Target | Layer |
|--------|--------|-------|
| Copilot queries / active user / week | >3 | Brain |
| Priority action completion rate | >40% | Autopilot |
| Time to first alias (onboarding) | <5 min | Shield |
| Pro conversion from ROI dashboard | +15% vs baseline | Business |
| Scammer minutes wasted (SEE live) | Track + leaderboard | Sword |
| False positive rate (inbox phishing) | <5% | Brain |
| Risk score explainability satisfaction | Qualitative UX research | Brain |

---

## What Holds Us Back Today

1. Brain/Sword/Autopilot are designed in docs but not felt in product
2. Overview promises a command center but delivers a status board
3. Placeholder nav creates expectation debt
4. No conversational layer — the product doesn't *talk* to users
5. Simulated broker scans and demo metrics are fine for dev, risky for production positioning

## What's Already Right

1. Privacy architecture (E2E vault, zero-knowledge) is genuinely differentiated
2. Four-layer model is a strong product narrative when the UI delivers
3. Extension + dashboard split matches desktop-first strategy
4. Design system is professional — looks like a serious security product
5. API + React Query patterns are clean foundations for Copilot tool-use

---

## Document Index

| Doc | Relevance |
|-----|-----------|
| [`OVERVIEW.md`](./OVERVIEW.md) | Product vision |
| [`features/LAYER_2_BRAIN.md`](./features/LAYER_2_BRAIN.md) | Brain feature spec |
| [`features/SCAMMER_ENGAGEMENT_ENGINE.md`](./features/SCAMMER_ENGAGEMENT_ENGINE.md) | SEE spec |
| [`roadmap/PHASE_2_INTELLIGENCE.md`](./roadmap/PHASE_2_INTELLIGENCE.md) | Phase 2 delivery plan |
| [`roadmap/PHASE_3_AUTONOMY.md`](./roadmap/PHASE_3_AUTONOMY.md) | Autopilot delivery plan |
| [`design/DESIGN_SYSTEM.md`](./design/DESIGN_SYSTEM.md) | UI tokens and patterns |
| [`competitive/CLOAKED_TEARDOWN.md`](./competitive/CLOAKED_TEARDOWN.md) | Competitive positioning |

---

**Confidential** — © 2026
