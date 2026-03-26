# Contributing to Phantom

## Branches

Use short, descriptive branch names, for example:

- `fix/email-inbox-meta`
- `feat/notification-prefs-test`
- `docs/deployment-health`

## Local checks (before pushing)

From the repo root (Node **20+**):

1. `npm ci` (or `npm install`)
2. `npm run lint`
3. `npm run test`
4. `npm run build` (if you touched build output or Prisma)

CI order matches [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Integration tests (Postgres + Redis)

Many `*.integration.test.ts` files under `src/api/src` **skip** when `DATABASE_URL` is unset or equals the Vitest placeholder (`phantom_placeholder`). To run them locally:

1. Start services: `docker compose up -d postgres redis` (or use your own instances).
2. Copy [`.env.example`](.env.example) → `.env` and set **`DATABASE_URL`**, **`JWT_SECRET`**, and **`REDIS_URL`** (e.g. `redis://localhost:6379`).
3. Migrate and seed:  
   `npm run db:migrate:deploy -w @phantom/api`  
   `npm run db:seed -w @phantom/api`
4. Run API tests with a real DB URL in the environment:  
   `npm run test -w @phantom/api`

GitHub Actions runs Postgres and Redis services and sets **`DATABASE_URL`** / **`REDIS_URL`** so integration tests execute on every push.

## Docs

Operational steps for deploy, webhooks, and manual QA live in [`docs/roadmap/DEPLOYMENT.md`](docs/roadmap/DEPLOYMENT.md), [`docs/roadmap/EMAIL_INBOUND.md`](docs/roadmap/EMAIL_INBOUND.md), and [`docs/roadmap/QA_MANUAL.md`](docs/roadmap/QA_MANUAL.md).
