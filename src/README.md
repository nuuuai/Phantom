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
# Prerequisites: Node.js 20+, Python 3.11+, Docker, Cursor AI

# Clone and install
git clone https://github.com/nuuuai/Phantom.git
cd Phantom

# Install dependencies (when src is populated)
cd src/dashboard && npm install
cd ../extension && npm install
cd ../api && npm install

# Start local development
docker-compose up -d  # PostgreSQL, Redis, Elasticsearch
npm run dev           # Starts all services concurrently
```

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
