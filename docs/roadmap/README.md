# Roadmap — progress model

All roadmap docs use **percent complete** as a manual engineering estimate (not auto-generated). Update numbers when scope ships or when you re-baseline.

## Where % appears

| Location | What it means |
|----------|----------------|
| **Deliverable** (`- [ ] **Title** — **N%**`) | Whole workstream vs its spec. |
| **Sub-bullets** (indented under a deliverable) | Line-item progress; Phase 1 is granular, Phases 2–4 default to **0%** until started. |
| **Platform Scope** | Readiness of each platform for that phase. |
| **Success metrics** | Progress **toward** numeric targets (often **0%** pre-launch). |
| **Dependencies** (Phase 1) | External gating items. |
| **Key risks** | **Open** = tracked; close or reword when mitigated. |
| **`MILESTONES.md`** | Per-milestone **Progress**, North Star **Progress**, guardrail **Progress vs threshold**. |

## Phase documents (summary)

| File | Scope | Document-level summary |
|------|--------|-------------------------|
| [PHASE_1_FOUNDATION.md](./PHASE_1_FOUNDATION.md) | Months 1–6, desktop MVP | Deliverables avg **~43%** (see table at top of file). |
| [PHASE_2_INTELLIGENCE.md](./PHASE_2_INTELLIGENCE.md) | Months 6–12, Brain + telephony | **0%** (not started). |
| [PHASE_3_AUTONOMY.md](./PHASE_3_AUTONOMY.md) | Months 12–18, Autopilot | **0%** (not started). |
| [PHASE_4_MOBILE_ECOSYSTEM.md](./PHASE_4_MOBILE_ECOSYSTEM.md) | Months 18–24, mobile + ecosystem | **0%** (not started). |
| [MILESTONES.md](./MILESTONES.md) | Critical path + North Star + guardrails | Milestone **Progress** column + metric tables. |

## Conventions

- **0%** = not started or not yet measurable.
- **TBD** = needs production metrics or instrumentation.
- **~N%** = rough / directional estimate.
- Sub-bullet % rows do not need to average to the parent deliverable %; parent is the rollup judgment call.

## Recently shipped (examples)

- **GitHub Actions CI** (`.github/workflows/ci.yml`): lint, test, build on push/PR.
- **Free-tier alias caps** (API): email 3, phone 1, username 5, password 25 for `tier === free`; `GET /api/user/me` returns usage. Dashboard **Settings** + **Aliases** show quotas.
- **Notification system**: Prisma `Notification` model (priority, category, layer), API endpoints (`GET /api/notifications`, `POST /read-all`, `POST /seed-demo`), dashboard bell icon in TopBar with dropdown, mark-read, and demo seeding.
- **Vault page** (Password manager v1): card-grid layout with strength meter, search/filter by category, generate modal, copy/reveal/rotate/remove per credential.
- **Extension form detection v2**: heuristic expansion (name/id/placeholder/label-based), username field detection, Shadow DOM injected shield icon on each detected field that generates + auto-fills aliases on click.
- **Auth / JWT**: optional **RS256** when `JWT_PRIVATE_KEY` + `JWT_PUBLIC_KEY` are set (HS256 + `JWT_SECRET` remains the dev default). Refresh tokens in **Redis** when `REDIS_URL` is set.
- **Extension vault at rest**: random **DEK** in `chrome.storage.session`, AES-GCM ciphertext in **IndexedDB** (replaces plaintext vault key in `chrome.storage.local`); legacy key migrated on next login.
- **Vault sync (E2E blob)**: `GET`/`PUT /api/vault/sync` + `User.vaultSyncCiphertext` / `vaultSyncVersion` for opaque client ciphertext; dashboard `phantomApi.vault.getSync` / `putSync`.
- **Broker catalog 150+**: seed merges 50 real brokers + 100 synthetic `.example` rows; scan uses bounded-concurrency “workers” with per-broker delay.
- **Billing stub**: `GET /api/billing/status` + Stripe env placeholders in `.env.example`.
- **Settings**: browser **desktop notification** permission (Enable).
- **Docs**: `EMAIL_INBOUND.md`, `PHONE_INTEGRATION.md` (DNS / VoIP boundaries and gaps).
- **Email path (code)**: `POST /api/webhooks/email-inbound` (HMAC `X-Phantom-Signature: sha256=…`, `INBOUND_WEBHOOK_SECRET`), `AliasInboxMessage` + `GET /api/email-inbox`, dashboard **`/inbox`**, optional **`forwardToEmail`** via `PATCH /api/user/me`.
- **Infra**: Global API rate limit uses **Redis** when `REDIS_URL` is set (`rate-limit-redis`); in-memory fallback if not.
- **Launch prep**: `CHROME_WEB_STORE_CHECKLIST.md` for Web Store submission.
