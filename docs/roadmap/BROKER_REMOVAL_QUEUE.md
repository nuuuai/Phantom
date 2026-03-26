# Data broker removal — queue & workers (Phase 1)

Phase 1 does **not** ship live partner API clients or headless browser automation against broker sites. Every “queue” / “auto opt-out” action is **server-side simulation** only (`advanceRemovalSimulation`, `POST …/request-removal`) so the dashboard and notifications can be exercised end-to-end.

## Current behavior

- Removal requests are **simulated** in-process: state transitions (`pending` → `confirmed`, etc.) advance via API logic tied to broker metadata (`removalMethod`, `avgRemovalDays`).
- **Tier gating** (free vs Pro) is enforced in API + dashboard summary (`canRequestRemoval`). Free tier uses **DIY** catalog / search links only; Pro gets the **simulated** queue in addition.

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
