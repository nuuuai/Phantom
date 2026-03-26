# Milestones & Success Metrics

> **Progress %** = estimated completion toward that milestone’s Definition of Done (engineering judgment; align with phase docs).

## Critical Path Milestones

### Phase 1 (Months 1–6)


| Milestone                | Target Date | Progress | Definition of Done                                                                                                                          |
| ------------------------ | ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| M1: Infrastructure Ready | Month 1     | **78%**  | API + **Postgres** + **Redis** (compose + CI **Redis 7** service + **`REDIS_URL`**); **JWT** HS256/RS256 (`jwt.ts`, **`clockTolerance`**, explicit verify **algorithms**); refresh hash + rotation + **`authSession.integration.test.ts`**; **`DEPLOYMENT.md`** JWT/Redis accuracy; **`AUTH_AND_VAULT_PHASE1.md`** JWT + refresh rows. **`INFRA_AWS_PHASE1.md`** + **`infra/terraform/`**; **X-Request-Id** + structured errors.                                                                           |
| M2: Vault Operational    | Month 2     | **74%**  | **PBKDF2** + **AES-GCM** in `@phantom/shared`; **`executeVaultSyncPush`** (409 retry, no-op skip PUT, wrong-key/tamper tests); **`GET`/`PUT /api/vault/sync`** opaque blob + **409** `sync_conflict` (**`auth.integration.test`**); dashboard **Encrypted backup · vN**, **Last synced**, **Retry**, **retry: 2**; extension **IndexedDB** + **DEK** + **`pushVaultSyncFromExtension`**; **`AUTH_AND_VAULT_PHASE1.md`** + **`DEPLOYMENT.md`** E2E note. |
| M3: Extension MVP        | Month 2     | **74%**  | Form detection + **`fetchAuth`** / **`refreshSession`**: **`network_error`** vs API **503** vs **401**; exponential backoff on refresh (tests). Shared **`@phantom/shared`** **`clientError`** mapping on login / generate. Alias generation (**popup** **Email**/**Password** + **`fieldKind`**), **shield** autofill + **visible errors** + **`InputEvent`**.                 |
| M4: Dashboard MVP        | Month 3     | **84%**  | Same funnel + **NotificationCenter** (bell, **unread delta** desktop **`Notification`** when granted), **Settings** notification prefs + **PUT** validation; API **read-path** prefs filter (**`notifications.ts`** doc); **`POST /notifications/seed-demo`** **403** in production; **`notifications.integration.test.ts`** (prefs hide category, seed **403**, bad **`enabled`**) with Postgres. **`emailInbox.integration.test.ts`** (webhook → list → patch). **`parseApiResponseJson`** **`httpStatus`**; inbound webhook **401/415/503** tests. **Run 21:** **MobileNavBar** (narrow viewports) + sidebar from **md** breakpoint, **`titleForPath`** alias detail, **7-step onboarding** (**Back**, CWS/dev copy, **`DASHBOARD_PATHS`**), **Quick actions** + **Get started** + **BrokerUpgradeModal** → **`/billing`**, skip link, responsive padding. **Run 22:** **Aliases** list **Retry** + **`GenerateAliasModal`** per-type quota; **`aliasTierLimits`** username cap test.                                    |
| M5: Phone Aliases        | Month 3     | **72%**  | Env adapter + **`GET /api/phone/provider`**: **200** when ready, **503** `phone_provider_unavailable` + **`error.lastError`** when Twilio without SID; generate/rotate **503** parity; dashboard **Phone routing** + modal show **503** / validation; E.164 forward + tier caps. PSTN/SMS still external (Phase 2+).        |
| M6: Broker Scanner       | Month 4     | **76%**  | 150+ brokers searchable. **`validateBrokerScanRuntimeConfig`** + **503** `broker_scan_config_invalid`; bounded **`mapWithConcurrency`**; free-tier **429** `scan_rate_limited` + **`retryAfterSeconds`**; summary **`canRequestRemoval`** + **`freeTierBrokerScanMaxPer24h`**; **`BrokersPage`** honest copy + **429** / error banners; tests extended (`brokerScanPipeline`, `computeBrokerScanSummary`, quota cap **500**). |
| M7: Broker Removal       | Month 5     | **66%**  | Simulated removal for paid tier (**`BROKER_REMOVAL_QUEUE.md`** + env note); **`brokerRemovalMethodLabel`** (API vs DIY) + row CTAs + free **Upgrade** copy; results **status legend**; tier-gated queue (**`upgrade_required`**); **`FREE_TIER_BROKER_SCAN_MAX_PER_24H`** on API summary + UI; read-path **`advanceRemovalSimulation`**. |
| M8: Free Tier Launch     | Month 6     | **72%**  | Public launch path: **`DEPLOYMENT.md`** (extension **`host_permissions`** vs **`CORS_ORIGIN`**, options override) + **`INFRA_AWS_PHASE1.md`**, **`/health/live`** + **`/health`**, free-tier scan cap + alias **`tier_limit`** body + **integration test** for **429**, CI (**`npm ci` → migrate → seed → lint → test → build**, Postgres service, **`cancel-in-progress`**); **`EXTENSION_STORE_BUILD.md`** (MV3 zip path, **`onInstalled`**); **`CHROME_WEB_STORE_CHECKLIST.md`** (permissions table, listing copy draft); **`QA_MANUAL.md`** tier matrix + billing query params (`session_id`, `canceled`) + vault + extension. **`npm run build:extension:store`** prod zip. **Shipped in repo:** MV3 least-privilege manifest, API URL validation + options, expanded unit tests. **Blocked (external):** CWS account, hosted privacy policy URL, marketing. |
| M9: Paid Tier Launch     | Month 6     | **71%**  | Stripe Checkout + Portal; **`POST /api/webhooks/stripe`** persists **`StripeWebhookEvent`** (`event.id`) for idempotent retries + **`duplicate: true`**; **`POST /api/billing/sync-checkout-session`** → **`User.tier`** + **`subscriptionStatus`**; dashboard **`/billing?session_id=`**. Integration tests in CI (signed webhooks, mocked Stripe retrieve); **`QA_MANUAL.md`** tier matrix + billing steps aligned with code. Live Stripe keys + webhook URL remain an external cutover. |


### Phase 2 (Months 6–12)


| Milestone                 | Target Date | Progress | Definition of Done                                                          |
| ------------------------- | ----------- | -------- | --------------------------------------------------------------------------- |
| M10: Brain v1             | Month 7     | **0%**   | Risk scoring, behavioral baseline, alias health monitoring live.            |
| M11: Carrier Numbers      | Month 8     | **0%**   | Tier-1 carrier integration. User migration from VoIP.                       |
| M12: Call Guard Live      | Month 9     | **0%**   | AI call screening operational. <2s decision time. Transcripts in dashboard. |
| M13: SEE v1               | Month 9     | **0%**   | 3 personas deployed. Scam engagement working. Transcript viewer live.       |
| M14: Threat Intel Network | Month 10    | **0%**   | Cross-user pattern detection. Pre-protection alerts.                        |
| M15: Virtual Cards        | Month 11    | **0%**   | Card generation. Per-merchant cards. Extension autofill at checkout.        |
| M16: Firefox/Safari       | Month 12    | **0%**   | Extensions published. Cross-browser testing passed.                         |
| M17: 5K Paid Users        | Month 12    | **0%**   | Revenue milestone. Product-market fit signal.                               |


### Phase 3 (Months 12–18)


| Milestone               | Target Date | Progress | Definition of Done                                                   |
| ----------------------- | ----------- | -------- | -------------------------------------------------------------------- |
| M18: Autopilot Mode     | Month 14    | **0%**   | Tiered autonomy. Auto-rotation. Breach auto-response.                |
| M19: SEE v2             | Month 15    | **0%**   | 8+ personas. Gamification. Leaderboards. Social sharing.             |
| M20: Deepfake Detection | Month 15    | **0%**   | Voice analysis in call pipeline. Confidence scores in transcripts.   |
| M21: Family Center      | Month 17    | **0%**   | Family accounts. Elder protection. Parental controls.                |
| M22: NLI                | Month 17    | **0%**   | Conversational interface in dashboard. Tool use for Phantom actions. |
| M23: 25K Paid Users     | Month 18    | **0%**   | Scale milestone. Ready for mobile and enterprise.                    |


### Phase 4 (Months 18–24)


| Milestone               | Target Date | Progress | Definition of Done                                                    |
| ----------------------- | ----------- | -------- | --------------------------------------------------------------------- |
| M24: iOS App            | Month 20    | **0%**   | App Store published. Native call integration. Feature parity (core).  |
| M25: Android App        | Month 20    | **0%**   | Play Store published. Native call integration. Feature parity (core). |
| M26: Kova Integration   | Month 21    | **0%**   | Agents deployed via Kova. Agent performance dashboard.                |
| M27: VulnIQ Integration | Month 22    | **0%**   | Bidirectional threat intel. Shared dashboard.                         |
| M28: Enterprise v1      | Month 23    | **0%**   | Admin console. SSO. Bulk provisioning. First enterprise customer.     |
| M29: International v1   | Month 24    | **0%**   | UK + Canada live. Localized brokers. Regional compliance.             |
| M30: 100K Paid Users    | Month 24    | **0%**   | Scale milestone. $5M+ ARR.                                            |


## North Star Metrics


| Metric                             | What It Measures                                         | Target (Month 24)    | Progress |
| ---------------------------------- | -------------------------------------------------------- | -------------------- | -------- |
| **Active Aliases**                 | Product value (more aliases = more protection)           | 2,000,000            | **~0%**  |
| **Scammer Minutes Wasted**         | Sword layer impact (time not spent scamming real people) | 500,000 total        | **~0%**  |
| **Data Broker Records Removed**    | Shield layer effectiveness                               | 10,000,000 total     | **~0%**  |
| **Monthly Risk Score Improvement** | Brain layer value (users getting safer over time)        | 70% of users improve | **0%**   |
| **Net Promoter Score**             | User satisfaction and likelihood to recommend            | 60+                  | **0%**   |


## Guardrail Metrics (Never Let These Degrade)


| Metric                               | Threshold   | Progress vs threshold         | Action if Breached              |
| ------------------------------------ | ----------- | ----------------------------- | ------------------------------- |
| Alias generation latency             | < 500ms p95 | **TBD** (not in prod)         | Performance sprint              |
| Call screening decision time         | < 2s p95    | **N/A** (Call Guard not live) | Infra scaling                   |
| False positive rate (call screening) | < 2%        | **N/A**                       | Retrain model, raise thresholds |
| Vault encryption failures            | 0           | **TBD**                       | Incident response, halt deploys |
| Dashboard uptime                     | > 99.5%     | **TBD**                       | Infrastructure redundancy       |
| Extension crash rate                 | < 0.1%      | **TBD**                       | Hotfix release                  |
| User data exposure incidents         | 0           | **0** (target)                | Full incident response          |


