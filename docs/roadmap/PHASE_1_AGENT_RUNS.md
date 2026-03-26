# Phase 1 — five agent runs (sequential)

Use **Run 1 → Run 5** in order. After each run, **commit** (or **tag**, e.g. `phase1-run-1-phone`) so the next agent has a clear baseline. Update the roadmap files each run specifies before closing the run.

| Run | Focus | Milestones / docs |
|-----|--------|---------------------|
| [Run 1](#run-1--phone-aliases-m5) | Phone aliases | M5 · `PHONE_INTEGRATION.md` · `PHASE_1_FOUNDATION.md` phone |
| [Run 2](#run-2--data-brokers-scan--removal-depth-m6m7) | Brokers scan + removal | M6–M7 · broker rows in `PHASE_1_FOUNDATION.md` |
| [Run 3](#run-3--vault--email-continuity-m2--email-engine) | Vault + email | M2 · email · `EMAIL_INBOUND.md` |
| [Run 4](#run-4--launch--paid-tier-m8m9) | Launch + paid tier | M8–M9 · `DEPLOYMENT.md` · store docs |
| [Run 5](#run-5--qa-onboarding-and-doc-sync) | QA, onboarding, doc sync | Testing / Onboarding in `PHASE_1_FOUNDATION.md` · `docs/roadmap/README.md` |

---

## Run 1 — Phone aliases (M5)

**Context:** Phantom Phase 1. Read `docs/roadmap/PHASE_1_FOUNDATION.md`, `docs/roadmap/MILESTONES.md` (M5), `docs/roadmap/PHONE_INTEGRATION.md`.

**Mission:** Implement the next slice of **phone aliases**: provider-agnostic boundaries (env-driven adapter), API + Prisma as needed, dashboard UX for provisioning/forwarding/status, clear errors when provider is not configured.

**Constraints:** Phase 1 only; no Phase 2. Match existing Express/Prisma/dashboard patterns.

**Done when:** `PHASE_1_FOUNDATION.md` phone section, `MILESTONES.md` M5, and `PHONE_INTEGRATION.md` reflect what shipped; env vars documented.

---

## Run 2 — Data brokers: scan + removal depth (M6–M7)

**Context:** Phase 1. Read `PHASE_1_FOUNDATION.md` (broker scanner + removal), `MILESTONES.md` (M6, M7).

**Mission:** Improve **broker scanning** (workers, rate limits, real vs simulated where the codebase allows) and **removal pipeline** (submission, status tracking, paid-tier gating). Add tests for critical paths.

**Constraints:** Phase 1 only; avoid unrelated refactors.

**Done when:** M6/M7 and deliverable rows updated in roadmap docs; tests pass for new logic.

---

## Run 3 — Vault + email continuity (M2 + email engine)

**Context:** Phase 1. Read `PHASE_1_FOUNDATION.md` (encrypted vault, email alias engine), `docs/roadmap/EMAIL_INBOUND.md`.

**Mission:** Advance **vault E2E** (extension ↔ dashboard sync merge/conflict or documented rules + implementation) and/or **email path** (inbound webhook hardening, inbox UX, forwarding fields) — prioritize whichever is more incomplete in the repo after a quick audit.

**Constraints:** Phase 1 only; crypto/sensitive data handled per existing `@phantom/shared` patterns.

**Done when:** M2 and relevant email/vault bullets in `PHASE_1_FOUNDATION.md` updated; `EMAIL_INBOUND.md` aligned if behavior changed.

---

## Run 4 — Launch + paid tier (M8–M9)

**Context:** Phase 1. Read `docs/roadmap/DEPLOYMENT.md`, `CHROME_WEB_STORE_CHECKLIST.md`, `EXTENSION_STORE_BUILD.md` (or equivalent store build doc), `PHASE_1_FOUNDATION.md` (Free/Paid tier), `MILESTONES.md` (M8, M9).

**Mission:** Move **public launch readiness** and **paid tier**: store-ready extension build steps, deploy checklist alignment, **Stripe (or chosen) checkout + webhooks** updating subscription/tier in DB, gated features consistent with `User.tier`. Secrets via env only.

**Constraints:** Phase 1 only; document anything blocked on external accounts (Chrome Web Store, DNS, legal).

**Done when:** M8/M9 and paid-tier rows in roadmap docs updated; new routes/webhooks tested in dev.

---

## Run 5 — QA, onboarding, and doc sync

**Context:** Phase 1. Read `PHASE_1_FOUNDATION.md` (Onboarding, Testing and QA), `docs/roadmap/README.md`.

**Mission:** Add **integration or E2E** coverage for the most critical flows (login, alias create, vault sync touchpoint, broker scan, checkout webhook if present). Improve **onboarding** where cheap (extension install → first alias). **Reconcile** all Phase 1 roadmap percentages with the repo; update `README.md` “Recently shipped” and fix any stale bullets.

**Constraints:** Phase 1 only; no new features unless they close gaps listed in Phase 1 doc.

**Done when:** CI meaningful for core paths; roadmap is internally consistent; short “remaining before Phase 1 complete” list is explicit.

---

## Remaining before Phase 1 complete

Engineering judgment: Phase 1 is **not** “all green” until external and high-effort items below are either done or explicitly accepted as post-launch.

| Category | What’s left |
|----------|-------------|
| **External** | Chrome Web Store **account + listing + review**; **live DNS/TLS** for API and dashboard; **legal** review of privacy policy / ToS; **live Stripe** keys + **live** webhook URL; **email** MX + inbound worker (see `EMAIL_INBOUND.md`); **phone** real carrier/Twilio production (see `PHONE_INTEGRATION.md`). |
| **Product / QA** | Playwright **E2E** not required for Phase 1 exit in repo today — **manual** list in `QA_MANUAL.md`; **load** and **security audit** are external engagements. |
| **Nice-to-have** | SRP auth; Argon2id vault KDF; community threat feed; CSV import; Terraform/AWS automation — tracked in `PHASE_1_FOUNDATION.md` gaps table. |

For the rolling **% complete** model, see [`README.md`](./README.md) in this folder.
