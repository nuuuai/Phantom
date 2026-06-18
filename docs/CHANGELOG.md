# Changelog

All notable changes to this project are documented here. The format is loose; versions align with tagged releases when applicable.

## Unreleased

- **Docs:** Added [`AI_ENHANCEMENT_ROADMAP.md`](./AI_ENHANCEMENT_ROADMAP.md) — page-by-page AI enhancement plan. Moved root `README.md`, `CHANGELOG.md`, and `CONTRIBUTING.md` into `docs/`.
- **Run 11 (autofill + broker scan copy):** Extension **`syncNativeInputAfterValueChange`** (**`nativeInputValue.ts`**) + tests; content script uses it for shield autofill; vault-missing error on encrypted **password** fields; popup pending states (**`aria-busy`**, **disabled**, **`generateKind`** dependency); **`normalizeClientError`** default for **`broker_scan_config_invalid`**; **BrokersPage** copy tweak; roadmap docs (**`PHASE_1_FOUNDATION`**, **`PHASE_1_AGENT_RUNS`**, **`EXTENSION_STORE_BUILD`**, **`CHROME_WEB_STORE_CHECKLIST`**, **`EMAIL_INBOUND`**).
- **Run 10 (launch handoff):** [CHROME_WEB_STORE_CHECKLIST](./roadmap/CHROME_WEB_STORE_CHECKLIST.md) / [EXTENSION_STORE_BUILD](./roadmap/EXTENSION_STORE_BUILD.md) / [DEPLOYMENT](./roadmap/DEPLOYMENT.md) / [QA_MANUAL](./roadmap/QA_MANUAL.md) / [PHASE_2_INTELLIGENCE](./roadmap/PHASE_2_INTELLIGENCE.md) updates; **`PHANTOM_API_ERROR_CODES.broker_scan_config_invalid`** + **BrokersPage** scan config copy; extension **`nativeInputValue`** helper + tests; popup **`aria-busy`**; shield **`<button type="button">`**.
- **Batch 5 (quality / verticals / resilience):** Shared **`forwardEmail`** validation for **`PATCH /api/user/me`** and dashboard Settings; **`GET /api/email-inbox`** adds **`offset`** (capped) and returns **`meta: { limit, offset }`**; integration tests for forward-email validation, inbox clamping, and idempotent read PATCH; dashboard **`FeatureRouteErrorBoundary`** around lazy routes; **`CONTRIBUTING.md`**; **`DEPLOYMENT.md`** / **`EMAIL_INBOUND.md`** aligned with inbox + health behavior; **`dashboardRoutes`** test for notification deep links.
