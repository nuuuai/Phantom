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

**Environment file location:**

- Copy `.env.example` to **`.env` at the repository root** (same folder as root `package.json`).
- **`DATABASE_URL`**, **`JWT_SECRET`**, and other API vars come from that file. The API, Prisma (`migrate`, `generate`), and `db:seed` load it via **`src/api/src/loadRootEnv.ts`**, so vars work **regardless of npm cwd** (including `npm run -w @phantom/api`).
- If you previously used only `src/api/.env`, move or symlink it to the root.
- Do not commit `.env`.

### Local Postgres (no Docker)

Use this when you want PostgreSQL on the **host** (e.g. Windows) without Docker.

1. **Install PostgreSQL for Windows** from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/) (official installer). During setup, note the **port** (default **5432**), **superuser password**, and ensure the service is set to start (Services → `postgresql-x64-…`).
2. **Create a database** for Phantom, e.g. `phantom`, using **pgAdmin**, **SQL Shell (psql)**, or:
   - `CREATE DATABASE phantom;`
   - For dev you may use the `postgres` superuser in `DATABASE_URL`, or create a dedicated role: `CREATE USER phantom WITH PASSWORD '…';` then grant usage on schema and DB as needed.
3. **Configure the repo root `.env`** (see bullets above):
   - `DATABASE_URL=postgresql://USER:PASSWORD@127.0.0.1:5432/phantom` (use your real user, password, and port — usually **5432**, not an arbitrary port unless you changed PostgreSQL’s listen port).
   - `JWT_SECRET=` a long random string (**≥16 characters**).
   - `API_PORT=8787` (default).
   - `VITE_DEV_EMAIL` / `VITE_DEV_PASSWORD` should match the seed user (defaults in `src/api/prisma/seed.ts`: `dev@phantom.local` / `devpassword123`).
   - `CORS_ORIGIN` is optional in dev; the API defaults include `http://localhost:5173` and `127.0.0.1` variants (see `src/api/src/lib/corsOrigins.ts`).
4. **Apply schema and seed** from the **repository root**:
   - `npm run db:migrate -w @phantom/api` — first-time / dev migrations (`prisma migrate dev`).
   - `npm run db:seed -w @phantom/api`
5. **Redis (optional):** If **`REDIS_URL` is unset**, refresh-token storage in Redis is disabled; that is fine for most local work. To test refresh flows without Docker, install a Windows-compatible Redis (e.g. **Memurai**, or Redis under **WSL**) and set `REDIS_URL=redis://127.0.0.1:6379`.
6. **Verify:** `npm run dev -w @phantom/api` or full `npm run dev` / `run.ps1`. Open `http://127.0.0.1:8787/health` — expect **`db: "connected"`** when PostgreSQL is reachable. Start the dashboard and sign in with the seeded credentials.

CI runs Postgres as a service container, applies `prisma migrate deploy`, then lint / test / build. Refresh-token flows that need Redis are not exercised in CI unless `REDIS_URL` is added to the workflow.

The browser extension build generates `src/extension/.plasmo/` (gitignored). Plasmo’s static entry shims use `@ts-ignore` for dynamic imports of your pages; do not hand-edit those files — they are regenerated on build.

### Local API / dashboard troubleshooting

- **Login fails or the dashboard stays on “Connecting…”**: confirm the API is listening on **8787** (same as the Vite proxy in `src/dashboard/vite.config.ts`), `.env` has a valid **`JWT_SECRET` (≥16 characters)** and **`DATABASE_URL`**, Postgres is running, migrations are applied (`npm run db:migrate:deploy -w @phantom/api` or `db:migrate` in dev), and the seed user exists (`npm run db:seed -w @phantom/api`) with credentials matching **`VITE_DEV_EMAIL`** / **`VITE_DEV_PASSWORD`** (see `src/api/prisma/seed.ts` and `.env.example`).
- If **`REDIS_URL`** is set, Redis must be reachable; otherwise refresh-token storage during login can throw.
- **Windows `npm run build` fails with `EPERM` … `query_engine-windows.dll.node`:** usually a **file lock** (API `npm run dev`, another terminal, IDE, or antivirus holding Prisma’s engine). Stop dev servers, wait a few seconds, retry `npm run build`. If it persists, exclude the repo from real-time scanning or reboot, then run `npx prisma generate` in `src/api` before the full build. This is environmental, not an application bug.

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
