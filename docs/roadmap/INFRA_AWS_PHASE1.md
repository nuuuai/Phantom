# AWS / Terraform — Phase 1 position

## What is in the repo (Phase 1)

- **Terraform:** minimal **root module** at [`infra/terraform/`](../../infra/terraform/) (`terraform.tf`, `variables.tf`, `outputs.tf`, **`.gitignore`**, README) — **`terraform validate`** in **GitHub Actions** after the build step (and locally when the CLI is installed); **~38%** toward “IaC in repo” (no AWS resources yet; avoids **0%** while staying honest).
- **Deployment contract** is documented in [`DEPLOYMENT.md`](./DEPLOYMENT.md): PostgreSQL, optional Redis, Node API, static dashboard, env-only secrets, **`GET /health/live`** (liveness) and **`GET /health`** (readiness).
- **CI** — same step order as [`DEPLOYMENT.md`](./DEPLOYMENT.md) **§ CI**: `npm ci` → migrate → **seed** → lint → test → build → **`terraform validate`** on `infra/terraform/` (`.github/workflows/ci.yml`).

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

## Growing the Terraform module

Add `required_providers`, `provider "aws" {}`, and resources under `infra/terraform/` as you provision RDS, ElastiCache, and compute. Keep this doc aligned with health probes and env names in [`DEPLOYMENT.md`](./DEPLOYMENT.md).
