# Data broker removal — queue & workers (Phase 1)

## Current behavior

- Removal requests are **simulated** in-process: state transitions (`pending` → `confirmed`, etc.) advance via API logic tied to broker metadata (`removalMethod`, `avgRemovalDays`).
- **Tier gating** (free vs Pro) is enforced in API + dashboard summary (`canRequestRemoval`).

## Target shape (real queue)

1. **Enqueue** — `POST` (or internal call) writes a `RemovalJob` row (or equivalent) with `userId`, `brokerId`, status `queued`.
2. **Worker** — a separate process (or cron) claims jobs, runs **adapter-specific** steps:
   - **API brokers:** HTTP client to partner opt-out endpoints (when available).
   - **Manual brokers:** **Playwright** (or similar) automation against public forms — **stub in dev**: no-op or dry-run logging when `BROKER_REMOVAL_PLAYWRIGHT=0` / missing browsers.
3. **Idempotency** — job dedupe key `(userId, brokerId, submissionEpoch)` or status check before submit.

## Dev dry path

Without Playwright installed, the API still accepts removal requests and advances **simulation** so the dashboard and notifications behave end-to-end. See broker removal routes and `advanceRemovalSimulation` in the API package.

## External blockers

- Legal / ToS for automated form submission per broker.
- CAPTCHAs and rate limits on broker sites.
