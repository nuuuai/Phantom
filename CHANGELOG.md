# Changelog

All notable changes to this project are documented here. The format is loose; versions align with tagged releases when applicable.

## Unreleased

- **Batch 5 (quality / verticals / resilience):** Shared **`forwardEmail`** validation for **`PATCH /api/user/me`** and dashboard Settings; **`GET /api/email-inbox`** adds **`offset`** (capped) and returns **`meta: { limit, offset }`**; integration tests for forward-email validation, inbox clamping, and idempotent read PATCH; dashboard **`FeatureRouteErrorBoundary`** around lazy routes; **`CONTRIBUTING.md`**; **`DEPLOYMENT.md`** / **`EMAIL_INBOUND.md`** aligned with inbox + health behavior; **`dashboardRoutes`** test for notification deep links.
