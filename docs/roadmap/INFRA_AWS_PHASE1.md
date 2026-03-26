# AWS / Terraform — Phase 1 position

## What is in the repo (Phase 1)

- **No** Terraform or CloudFormation modules ship with Phantom today (`PHASE_1_FOUNDATION.md` lists Terraform at **0%** as *application* code).
- **Deployment contract** is documented in [`DEPLOYMENT.md`](./DEPLOYMENT.md): PostgreSQL, optional Redis, Node API, static dashboard, env-only secrets, **`GET /health/live`** (liveness) and **`GET /health`** (readiness).
- **CI** (`.github/workflows/ci.yml`) mirrors a minimal prod check: migrate, lint, test, build against Postgres.

## Recommended AWS shape (operator choice)

Typical production layout (not prescriptive):

| Layer | Options |
|-------|---------|
| **API** | ECS Fargate, EKS, or EC2 + process manager; **Node 20+** to match `engines` in root `package.json`. |
| **DB** | **RDS PostgreSQL** — `DATABASE_URL` with TLS in prod. |
| **Redis** | **ElastiCache** (Redis) when you need multi-instance refresh tokens + Redis-backed rate limits — set `REDIS_URL`. |
| **Dashboard** | S3 + CloudFront, or same origin as API behind ALB with path routing to static files. |
| **TLS** | ACM certificates on ALB / CloudFront; **HTTPS** required for extension (`PLASMO_PUBLIC_API_URL`) and dashboard. |

## Health probes (load balancer / k8s)

| Path | Role |
|------|------|
| `GET /health/live` | **Liveness** — no DB; restart if failing. |
| `GET /health` | **Readiness** — `200` only when DB is up; includes `redis`: `ok` \| `down` \| `disabled`. |

## Prod parity with local / CI

| Concern | Practice |
|---------|----------|
| **Node** | Same major as CI (see workflow / `package.json` `engines`). |
| **Env** | Same variable *names* as [`DEPLOYMENT.md`](./DEPLOYMENT.md) and repo root `.env.example`; values differ per environment. |
| **Migrations** | `npx prisma migrate deploy` in deploy pipeline before traffic. |
| **Secrets** | Never bake into images; use parameter store / secrets manager. |

## Terraform later

When you add IaC, keep it in a dedicated directory (e.g. `infra/terraform/`) and reference this doc from `PHASE_2+` or a runbook — out of scope for Phase 1 application delivery.
