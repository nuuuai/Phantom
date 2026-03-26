# PHANTOM

**Your AI Privacy Operations Center**

Phantom is an AI-native personal privacy and security platform. It doesn't just block threats — it fights back, learns, adapts, and manages your entire digital identity lifecycle autonomously.

Part of the **Kova · VulnIQ · Phantom** ecosystem.

---

## What Is Phantom?

Phantom operates across four capability layers:

| Layer | Name | What It Does |
|-------|------|-------------|
| 1 | **The Shield** | Defensive privacy — aliases, VPN, virtual cards, data broker removal |
| 2 | **The Brain** | Adaptive AI core — behavioral baselines, risk scoring, cross-user intelligence |
| 3 | **The Sword** | Offensive counter-ops — scammer engagement, complaint filing, network mapping |
| 4 | **The Autopilot** | Autonomous identity management — breach response, alias rotation, exposure reports |

## Platform Strategy

**Desktop-first.** Web dashboard + browser extension ship first. Mobile apps are Phase 4.

- **Browser Extension** → primary tool, alias generation at point-of-signup, autofill, identity switching
- **Web Dashboard** → command center for exposure reports, threat intel, alias lifecycle, family admin
- **Mobile Apps** → companion apps added last once core platform is proven

## Tech Stack

See [`docs/architecture/TECH_STACK.md`](docs/architecture/TECH_STACK.md) for full details.

- **Frontend:** React + TypeScript + Vite
- **Extension:** Chrome Extension Manifest V3 (Firefox/Safari later)
- **Backend:** Node.js + Express (API), Python (AI/ML pipelines)
- **Database:** PostgreSQL (primary), Redis (cache/sessions), Elasticsearch (threat intel)
- **AI/ML:** OpenAI/Anthropic APIs + custom models for call screening and scam detection
- **Telephony:** Tier-1 carrier partnerships, SIP/RTP infrastructure
- **Infrastructure:** AWS/GCP, Docker, Kubernetes

## Project Structure

```
Phantom/
├── README.md                    # You are here
├── .cursorrules                 # Cursor AI development rules + design system
├── .gitignore                   # Git ignore rules
├── docs/                        # All documentation
│   ├── OVERVIEW.md              # Product vision and summary
│   ├── architecture/            # Technical architecture docs
│   ├── features/                # Feature specifications
│   ├── roadmap/                 # Phase-by-phase development plan
│   ├── design/                  # Design system + reference components
│   ├── competitive/             # Competitive analysis
│   ├── business/                # Business model and pricing
│   └── ecosystem/               # Kova + VulnIQ integration
└── src/                         # Source code (see src/README.md)
```

## Recently shipped (Phase 1)

High-level only — full detail lives in [`docs/roadmap/README.md`](docs/roadmap/README.md) and [`docs/roadmap/PHASE_1_FOUNDATION.md`](docs/roadmap/PHASE_1_FOUNDATION.md).

- **CI** — Lint, test, build on push/PR (`.github/workflows/ci.yml`); Postgres-backed **integration tests** for auth, vault conflicts, and **signed Stripe webhooks** when `DATABASE_URL` is real.
- **Auth** — Optional **RS256** JWT; refresh tokens via **Redis** when `REDIS_URL` is set.
- **Vault** — E2E encrypted blob sync (`/api/vault/sync`), LWW merge in `@phantom/shared`, extension DEK + IndexedDB.
- **Brokers** — 150+ catalog seed; scan/removal simulation; **`canRequestRemoval`** on scan summary; tier-gated removal queue.
- **Billing** — Stripe Checkout + Portal + webhook → **`User.tier`**; dashboard **`/billing`**.
- **Launch ops** — **`DEPLOYMENT.md`** (env, health probes), **`EXTENSION_STORE_BUILD.md`** (prod zip), **`CHROME_WEB_STORE_CHECKLIST.md`**, **`QA_MANUAL.md`**.

**Agent playbook (sequential runs):** [`docs/roadmap/PHASE_1_AGENT_RUNS.md`](docs/roadmap/PHASE_1_AGENT_RUNS.md).

## Documentation Index

### Architecture
- [`SYSTEM_ARCHITECTURE.md`](docs/architecture/SYSTEM_ARCHITECTURE.md) — High-level system design
- [`TECH_STACK.md`](docs/architecture/TECH_STACK.md) — Technology choices and rationale
- [`DATA_FLOWS.md`](docs/architecture/DATA_FLOWS.md) — How data moves through the system
- [`SECURITY_MODEL.md`](docs/architecture/SECURITY_MODEL.md) — Zero-knowledge encryption, vault design

### Features
- [`LAYER_1_SHIELD.md`](docs/features/LAYER_1_SHIELD.md) — Defensive privacy features
- [`LAYER_2_BRAIN.md`](docs/features/LAYER_2_BRAIN.md) — Adaptive AI engine
- [`LAYER_3_SWORD.md`](docs/features/LAYER_3_SWORD.md) — Offensive counter-operations
- [`LAYER_4_AUTOPILOT.md`](docs/features/LAYER_4_AUTOPILOT.md) — Autonomous identity management
- [`SCAMMER_ENGAGEMENT_ENGINE.md`](docs/features/SCAMMER_ENGAGEMENT_ENGINE.md) — Deep dive on SEE
- [`BROWSER_EXTENSION.md`](docs/features/BROWSER_EXTENSION.md) — Extension architecture and UX

### Roadmap
- [`PHASE_1_AGENT_RUNS.md`](docs/roadmap/PHASE_1_AGENT_RUNS.md) — Sequential agent prompts (Runs 1–5) + remaining Phase 1 checklist
- [`PHASE_1_FOUNDATION.md`](docs/roadmap/PHASE_1_FOUNDATION.md) — Months 1–6: Dashboard + Extension
- [`PHASE_2_INTELLIGENCE.md`](docs/roadmap/PHASE_2_INTELLIGENCE.md) — Months 6–12: AI + Threat Intel
- [`PHASE_3_AUTONOMY.md`](docs/roadmap/PHASE_3_AUTONOMY.md) — Months 12–18: Autopilot + Advanced AI
- [`PHASE_4_MOBILE_ECOSYSTEM.md`](docs/roadmap/PHASE_4_MOBILE_ECOSYSTEM.md) — Months 18–24: Mobile + Ecosystem
- [`MILESTONES.md`](docs/roadmap/MILESTONES.md) — Key milestones and success metrics

### Competitive & Business
- [`CLOAKED_TEARDOWN.md`](docs/competitive/CLOAKED_TEARDOWN.md) — Competitive analysis vs Cloaked
- [`PRICING.md`](docs/business/PRICING.md) — Pricing tiers and strategy
- [`REVENUE_MODEL.md`](docs/business/REVENUE_MODEL.md) — Revenue streams and projections

### Design
- [`DESIGN_SYSTEM.md`](docs/design/DESIGN_SYSTEM.md) — Midnight Editorial theme spec
- [`REFERENCE_DASHBOARD.jsx`](docs/design/REFERENCE_DASHBOARD.jsx) — Reference dashboard implementation

### Ecosystem
- [`ECOSYSTEM_OVERVIEW.md`](docs/ecosystem/ECOSYSTEM_OVERVIEW.md) — Kova + VulnIQ + Phantom integration

---

**Confidential** — © 2026
