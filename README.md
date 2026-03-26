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

## How to run (developers)

1. **Node 20+** — matches [CI](.github/workflows/ci.yml).
2. Copy [`.env.example`](.env.example) → `.env` at the repo root; set **`DATABASE_URL`**, **`JWT_SECRET`** (or RS256 keys), and **`REDIS_URL`** when exercising refresh sessions / rate limits.
3. Start **Postgres** and **Redis** (e.g. `docker compose up -d postgres redis` if your [`docker-compose.yml`](docker-compose.yml) defines them) or point **`DATABASE_URL`** / **`REDIS_URL`** at existing instances.
4. From the repo root: **`npm install`** then **`npm run dev`** for API + dashboard + extension dev, or follow the exact migrate/seed/lint/test/build order in [`docs/roadmap/DEPLOYMENT.md`](docs/roadmap/DEPLOYMENT.md) **§ CI** for parity with GitHub Actions.

On Windows, [`run.ps1`](run.ps1) wraps common dev commands (e.g. **`-DashboardOnly`** for UI-only).

### 5-minute local (first run)

1. **Dependencies:** `npm install` at the repo root (Node **20+**).
2. **Data services:** `docker compose up -d postgres redis` (or point **`DATABASE_URL`** / **`REDIS_URL`** at your own instances).
3. **Env:** copy [`.env.example`](.env.example) → `.env`; set **`DATABASE_URL`**, **`JWT_SECRET`** (≥16 chars or RS256 keys), and **`REDIS_URL`** if you want refresh sessions.
4. **Migrate + seed:** `npm run db:migrate:deploy -w @phantom/api` then `npm run db:seed -w @phantom/api`.
5. **Run:** `npm run dev` — API on **8787**, dashboard on **5173** (see [§ Local dashboard](#local-dashboard-dev)).
6. **Extension (optional):** `npm run build:extension:store`, then load the unpacked output in `chrome://extensions` (see [`docs/roadmap/EXTENSION_STORE_BUILD.md`](docs/roadmap/EXTENSION_STORE_BUILD.md)).

Full production-like steps, CI parity, and env tables: [`docs/roadmap/DEPLOYMENT.md`](docs/roadmap/DEPLOYMENT.md).

| Root script | What it runs |
|-------------|----------------|
| `npm run dev` | Shared watch + API + dashboard + extension (see [`package.json`](package.json)) |
| `npm run build` | Shared → API → dashboard → extension |
| `npm run build:extension:store` | Shared + **extension** prod bundle for Chrome Web Store / unpacked testing |
| `npm run lint` / `npm run test` | ESLint repo-wide; tests in each workspace |

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
- **Billing** — Stripe Checkout + Portal + webhook → **`User.tier`** (webhook stores **`event.id`** in **`StripeWebhookEvent`**; duplicate deliveries → **`duplicate: true`**); **`POST /api/billing/sync-checkout-session`** after redirect; dashboard **`/billing`**.
- **Email inbound webhook** — `Content-Type` enforcement, request id header, **`webhookEmailInbound.test.ts`**.
- **Broker scan** — tunable **`BROKER_SCAN_CONCURRENCY`**; store build via **`npm run build:extension:store`**.
- **Launch ops** — **`DEPLOYMENT.md`** (env, health probes, **`REDIS_URL`** behavior), **`EXTENSION_STORE_BUILD.md`** (prod zip), **`CHROME_WEB_STORE_CHECKLIST.md`**, **`QA_MANUAL.md`**.
- **Auth/vault policy** — **`docs/roadmap/AUTH_AND_VAULT_PHASE1.md`** (JWT vs SRP/Argon2id); tenant boundary — **`docs/architecture/USER_DATA_SCOPE.md`**.
- **Inbox + phone UX** — Email inbox **`q`** filter + dashboard search; phone provider **`lastError`** on generate + alias detail.
- **Broker removal** — Queue/worker direction — **`docs/roadmap/BROKER_REMOVAL_QUEUE.md`**; Pro removal queue + **API-broker** UI labels (simulated automation).
- **Free tier broker scans** — Rolling **24h** cap (**`FREE_TIER_BROKER_SCAN_MAX_PER_24H`**, default 3); **`429`** + **`Retry-After`** on excess; scan history retained (no per-user run wipe).
- **Notifications** — Category **prefs** (API + Settings); **desktop** OS notifications when unread increases (if browser permission granted).
- **Launch / AWS** — **`docs/roadmap/INFRA_AWS_PHASE1.md`** (recommended AWS layout, health probes, prod parity); **`DEPLOYMENT.md`** links it; extension store docs include **manifest path** + prod parity table.
- **Email inbound** — **`phantom:v1:`** content hash dedupe when **`providerMessageId`** is omitted (worker retries); see **`docs/roadmap/EMAIL_INBOUND.md`**.
- **Dashboard / extension UX** — Overview **Get started** (0 aliases), **Quick actions** + **Settings**, **`MobileNavBar`** on small screens, **onboarding** 7-step flow with CWS/dev copy; overview **Retry** on load failure; broker **status legend**. Extension **`network_error`** JSON when API unreachable (**tests**).
- **API ops** — **`X-Request-Id`** on every response; structured JSON **error** logs; JWT verify **`clockTolerance`** 60s; Redis: global rate limit **fail-open** on store errors, refresh tokens **fail closed** on Redis write/read errors; **`DEPLOYMENT.md`** documents compose + policies.
- **Alias inbox** — **`isRead`** on messages; **`GET`** `unread=1`; **`PATCH /api/email-inbox/:id/read`**; dashboard **Unread only** + mark read/unread.
- **Vault UX + tests** — Dashboard **Last synced** (relative time) + conflict copy; **`decryptVaultSyncBlob`** tamper test in **`@phantom/shared`**.
- **Extension auth** — **`refreshSession`** one retry after **503** on **`/api/auth/refresh`** (fake-timer test).
- **QA / notifications stub** — **`QA_MANUAL.md`** expanded (billing duplicate webhook, vault, scan cap, ops); **`NOTIFICATIONS_EMAIL_ENABLED`** in **`DEPLOYMENT.md`** + **`.env.example`** (outbound email not in API yet).

**Agent playbook (sequential runs):** [`docs/roadmap/PHASE_1_AGENT_RUNS.md`](docs/roadmap/PHASE_1_AGENT_RUNS.md).

## Local dashboard (dev)

With the API on **`127.0.0.1:8787`** (default), the Vite dashboard serves at **`http://localhost:5173`** and proxies **`/api`** to the API. Use `npm run dev` (full stack) or `npm run dev -w @phantom/dashboard` (UI only); on Windows, **`run.ps1 -DashboardOnly`** starts the dashboard the same way.

## Performance notes (dashboard)

- React Query uses explicit **`staleTime`** per surface (for example inbox vs **`user/me`**); query keys include **`accessToken`**, and **`queryClient.clear()`** on sign-out avoids cross-session cache bleed.
- **`useQuery`** passes **`AbortSignal`** into **`phantomApi`** fetches so rapid inbox/broker filter changes cancel superseded requests.
- Heavy routes (**aliases**, **alias detail**, **settings**, **brokers**, **vault**, **inbox**, **billing**, **dark web**) are **`React.lazy`**-loaded with a **`Suspense`** skeleton in **`MainLayout`**; primary nav and **Quick actions** **prefetch** data on hover/focus.
- Memoized list/table rows on aliases, inbox, and broker removal cells cut re-renders while parent state updates.
- To compare bundle weight locally: `npm run build -w @phantom/dashboard` and inspect `src/dashboard/dist/assets`; use Chrome DevTools **Performance** for interaction timing in dev.

## CI (local parity with GitHub Actions)

From the **repository root** on **Node 20**:

1. `npm ci`
2. `npm run db:migrate:deploy -w @phantom/api`
3. `npm run db:seed -w @phantom/api`
4. `npm run lint`
5. `npm run test`
6. `npm run build`

Details, Postgres **`DATABASE_URL`** in Actions, and which tests are DB-gated: [`docs/roadmap/DEPLOYMENT.md`](docs/roadmap/DEPLOYMENT.md) **§ CI** and [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

### Integration tests (API)

Postgres-backed **`src/api/src/*.integration.test.ts`** files run automatically in CI when **`DATABASE_URL`** points at a real database. Locally, use Docker Compose for Postgres + Redis, configure **`.env`**, migrate, seed, then `npm run test -w @phantom/api`. See **[`CONTRIBUTING.md`](CONTRIBUTING.md)** for the full flow.

## Documentation Index

### Contributing
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — branch naming, local checks, running Postgres-backed integration tests

### Architecture
- [`SYSTEM_ARCHITECTURE.md`](docs/architecture/SYSTEM_ARCHITECTURE.md) — High-level system design
- [`TECH_STACK.md`](docs/architecture/TECH_STACK.md) — Technology choices and rationale
- [`DATA_FLOWS.md`](docs/architecture/DATA_FLOWS.md) — How data moves through the system
- [`SECURITY_MODEL.md`](docs/architecture/SECURITY_MODEL.md) — Zero-knowledge encryption, vault design
- [`USER_DATA_SCOPE.md`](docs/architecture/USER_DATA_SCOPE.md) — Logical multi-tenancy (`userId`) in Phase 1

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
