# Deployment checklist (Phase 1)

Minimal path to run Phantom API + dashboard + extension against production-like config.

## API (`src/api`)

Apply schema changes in production: `npx prisma migrate deploy` (from `src/api` or CI) after pulling migrations — e.g. broker `removalUrl` / `removalNotes` on `DataBroker`.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` or `JWT_PRIVATE_KEY` + `JWT_PUBLIC_KEY` | Access JWT signing |
| `REDIS_URL` | Refresh tokens + optional global rate limit |
| `CORS_ORIGIN` | Comma-separated dashboard origins |
| `DASHBOARD_PUBLIC_URL` | Stripe success/cancel + portal return URLs |
| `STRIPE_SECRET_KEY` | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | Verify `POST /api/webhooks/stripe` |
| `STRIPE_PRICE_PAID_MONTHLY` | Price ID for Pro subscription |
| `INBOUND_WEBHOOK_SECRET` | `POST /api/webhooks/email-inbound` HMAC |

**Stripe:** In the Stripe Dashboard, add webhook endpoint `https://<api-host>/api/webhooks/stripe` and subscribe at least to `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.

## Dashboard (`src/dashboard`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Full API origin in production (or rely on reverse-proxy path `/api`) |

Build: `npm run build -w @phantom/dashboard` — static assets served behind HTTPS.

## Extension

See [EXTENSION_STORE_BUILD.md](./EXTENSION_STORE_BUILD.md).

## CI

`.github/workflows/ci.yml` runs migrate, lint, test, and full monorepo build — keep green before release.
