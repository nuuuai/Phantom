# Layer 2 — The Brain (Adaptive AI Core)

## Purpose

Where Phantom fundamentally diverges from Cloaked. The Brain is a personal AI that learns your patterns, builds behavioral baselines, and makes intelligent decisions. Not a generic spam database — a personalized security intelligence system.

## Features

### 2.1 Behavioral Baseline

The AI learns your normal digital life:
- Who calls you and when (contact frequency patterns)
- Which services you use (login patterns, time-of-day preferences)
- Your typical login locations and devices
- Communication volume baselines (emails/day, calls/week)
- Alias usage patterns (which aliases are active, dormant, or suspicious)

Anything outside this baseline triggers analysis. Example: if you normally get 5 emails/day on a shopping alias and suddenly get 50, the Brain flags it as a potential compromise.

**Implementation:**
- Time-series data stored per-user (anonymized timestamps, no content)
- Rolling 30-day window for baseline calculation
- Anomaly detection via statistical models (Z-score + ML classifier)
- Baseline updates weekly, anomaly checks continuous

### 2.2 Personalized Risk Scoring

Each user gets a dynamic risk score (0-100) based on:

| Factor | Weight | Description |
|--------|--------|-------------|
| Data exposure | 25% | How many brokers still have your data |
| Alias health | 20% | % of aliases with clean health vs. compromised |
| Breach exposure | 20% | Number of breaches involving your aliases |
| Call threat level | 15% | Volume and severity of scam calls received |
| Password hygiene | 10% | Reuse rate, weak passwords, missing 2FA |
| Dark web presence | 10% | How much of your data is on the dark web |

Score updates in real-time. Dashboard shows trend over time.

**Risk Actions:**
- Score > 80 (Critical): Autopilot activates breach response automatically
- Score 60-80 (High): Prominent dashboard warnings, daily digest emails
- Score 40-60 (Medium): Weekly summary, proactive recommendations
- Score < 40 (Low): Monthly report, passive monitoring

### 2.3 Contextual Call Intelligence

Goes beyond spam databases. The AI analyzes:

- **Caller intent** — Conversation analysis, not just number lookup
- **Known scam patterns** — Cross-referenced with threat intel network
- **User context** — Did the user recently order something? Are they expecting a delivery call? Did they apply for a loan?
- **Temporal patterns** — Calls at 2 AM from a "bank" are more suspicious than calls at 2 PM
- **Geographic anomalies** — Call from a region you have no connections to

### 2.4 Alias Health Monitoring

Each alias has a health score (Healthy / Warning / Compromised / Quarantined):

```
HEALTHY     → No spam, no breach exposure, actively used
WARNING     → Minor spam uptick or found in minor breach
COMPROMISED → Significant spam or found in major breach
QUARANTINED → Disabled, no forwarding, pending replacement
```

**Automatic Actions:**
- Warning: Notify user, suggest increased monitoring
- Compromised: Recommend rotation, queue replacement
- Quarantined: Stop all forwarding, generate replacement, notify user

### 2.5 Natural Language Interface

Users interact with Phantom through conversation:

- "Phantom, create a new identity for online shopping"
- "Why am I getting calls from this area code?"
- "Show me which aliases are compromised"
- "Block all calls from 800 numbers"
- "What's my risk score and why?"

**Implementation:** LLM (Claude/GPT) with Phantom-specific tool use. The LLM can call internal APIs to execute actions, not just answer questions.

### 2.6 Cross-User Threat Intelligence Network

Anonymized, aggregated pattern recognition across all Phantom users:

- When 500 users get the same scam call pattern → all users pre-protected
- When a data broker re-lists data for many users → coordinated removal + legal escalation
- When a new phishing campaign targets a specific service → alias health scores adjust for all users using that service

**Privacy guarantee:** No user IDs, no PII in the threat intel store. Patterns only.

## Phase 2 Deliverables (Months 6-12)

- [ ] Behavioral baseline v1 (30-day rolling window)
- [ ] Risk scoring engine (6-factor model)
- [ ] Alias health monitoring (4-state model)
- [ ] Cross-user threat intelligence aggregation
- [ ] Contextual call intelligence v1
- [ ] Natural language interface → Phase 3
