# Source Code

## Structure (Planned)

```
src/
├── dashboard/              # Web dashboard (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/     # Shared UI components
│   │   ├── features/       # Feature modules (domain-organized)
│   │   │   ├── aliases/    # Alias management
│   │   │   ├── threats/    # Threat intelligence viewer
│   │   │   ├── broker/     # Data broker removal tracking
│   │   │   ├── callGuard/  # Call screening dashboard
│   │   │   ├── vault/      # Password/credential vault
│   │   │   ├── family/     # Family command center
│   │   │   ├── reports/    # Exposure reports
│   │   │   └── settings/   # Account and preferences
│   │   ├── lib/            # Shared utilities
│   │   │   ├── api.ts      # Phantom API client
│   │   │   ├── crypto.ts   # Client-side encryption
│   │   │   └── auth.ts     # Authentication helpers
│   │   ├── stores/         # State management (Zustand)
│   │   └── App.tsx         # Root component
│   ├── package.json
│   └── vite.config.ts
│
├── extension/              # Browser extension (Plasmo, Manifest V3)
│   ├── src/
│   │   ├── background/     # Service worker
│   │   ├── content/        # Content scripts (form detection, autofill)
│   │   ├── popup/          # Extension popup UI
│   │   ├── shadow/         # Shadow DOM injected components
│   │   └── lib/            # Shared extension utilities
│   ├── manifest.json
│   └── package.json
│
├── api/                    # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Database models
│   │   ├── middleware/     # Auth, rate limiting, etc.
│   │   ├── jobs/           # Background job processors
│   │   └── lib/            # Shared utilities
│   ├── package.json
│   └── tsconfig.json
│
├── ai/                     # AI/ML service (Python + FastAPI)
│   ├── src/
│   │   ├── agents/         # AI agent implementations
│   │   │   ├── callGuard/  # Call screening agent
│   │   │   ├── scamEngage/ # Scammer engagement personas
│   │   │   ├── aliasBot/   # Alias management agent
│   │   │   └── breachBot/  # Breach response agent
│   │   ├── models/         # ML model definitions
│   │   ├── pipelines/      # Data processing pipelines
│   │   └── api/            # FastAPI endpoints
│   ├── requirements.txt
│   └── pyproject.toml
│
├── telephony/              # Telephony infrastructure
│   ├── src/
│   │   ├── sip/            # SIP/RTP handling
│   │   ├── routing/        # Call routing engine
│   │   ├── tts/            # Text-to-speech for personas
│   │   └── stt/            # Speech-to-text (Whisper)
│   └── package.json
│
├── shared/                 # Shared types, constants, utils
│   ├── types/              # TypeScript type definitions
│   ├── constants/          # Shared constants
│   └── utils/              # Cross-package utilities
│
└── infra/                  # Infrastructure as code
    ├── terraform/          # AWS infrastructure
    ├── docker/             # Docker configurations
    └── scripts/            # Deployment scripts
```

## Development Setup

```bash
# Prerequisites: Node.js 20+, Docker optional (for compose services)

# Clone and install (npm workspaces — install once at repo root)
git clone https://github.com/nuuuai/Phantom.git
cd Phantom
npm install

# Configure env (see repo .env.example): DATABASE_URL, JWT_SECRET (16+ chars), optional REDIS_URL
# Ports: API 8787 (API_PORT), dashboard 5173 with /api proxied to the API, extension PLASMO_PUBLIC_API_URL

# Start local development (shared + api + dashboard + extension)
docker-compose up -d   # optional: PostgreSQL, Redis, Elasticsearch
npm run dev
```

CI runs Postgres as a service container, applies `prisma migrate deploy`, then lint / test / build. Refresh-token flows that need Redis are not exercised in CI unless `REDIS_URL` is added to the workflow.

The browser extension build generates `src/extension/.plasmo/` (gitignored). Plasmo’s static entry shims use `@ts-ignore` for dynamic imports of your pages; do not hand-edit those files — they are regenerated on build.

### Local API / dashboard troubleshooting

- **Login fails or the dashboard stays on “Connecting…”**: confirm the API is listening on **8787** (same as the Vite proxy in `src/dashboard/vite.config.ts`), `.env` has a valid **`JWT_SECRET` (≥16 characters)** and **`DATABASE_URL`**, Postgres is running, migrations are applied (`npm run db:migrate:deploy -w @phantom/api` or `db:migrate` in dev), and the seed user exists (`npm run db:seed -w @phantom/api`) with credentials matching **`VITE_DEV_EMAIL`** / **`VITE_DEV_PASSWORD`** (see `src/api/prisma/seed.ts` and `.env.example`).
- If **`REDIS_URL`** is set, Redis must be reachable; otherwise refresh-token storage during login can throw.

## Key Principles

1. **Feature-organized, not layer-organized** — code lives in `features/aliases/`, not `components/AliasCard.tsx`
2. **Shared types across packages** — `shared/types/` is the single source of truth
3. **API client is centralized** — never call `fetch()` directly in components
4. **Encryption happens in `lib/crypto.ts`** — one place for all crypto operations
5. **AI agents are modular** — each agent is independently deployable via Kova

## Code Ownership

| Package | Owner | Priority |
|---------|-------|----------|
| dashboard | Frontend team | Phase 1 |
| extension | Frontend team | Phase 1 |
| api | Backend team | Phase 1 |
| ai | ML team | Phase 2 |
| telephony | Infra team | Phase 2 |
| infra | DevOps | Phase 1 |
