# Milestones & Success Metrics

> **Progress %** = estimated completion toward that milestone’s Definition of Done (engineering judgment; align with phase docs).

## Critical Path Milestones

### Phase 1 (Months 1–6)


| Milestone                | Target Date | Progress | Definition of Done                                                                                                                          |
| ------------------------ | ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| M1: Infrastructure Ready | Month 1     | **74%**  | API server, database, auth system deployed. CI/CD pipeline green. **`INFRA_AWS_PHASE1.md`** + **`infra/terraform/`** (`terraform.tf`, `variables.tf`, `outputs.tf`) + **`DEPLOYMENT.md`** health/prod parity, **docker-compose** env table, **X-Request-Id** + structured errors, Redis rate-limit/session policy.                                                                           |
| M2: Vault Operational    | Month 2     | **60%**  | Client-side encryption working. Shared **vault sync wire types**; **LWW** + deterministic ties; extension ↔ dashboard vault sync (**Last synced**, conflict hint, **409** tests, **retry: 2**). Vault page with card grid, strength meter, generate modal, search/filter. |
| M3: Extension MVP        | Month 2     | **68%**  | Form detection + **`fetchAuth`** / **`refreshSession`**: **`network_error`** vs API **503** vs **401**; exponential backoff on refresh (tests). Shared **`@phantom/shared`** **`clientError`** mapping on login / generate. Alias generation, autofill via Shadow DOM shield icon.                 |
| M4: Dashboard MVP        | Month 3     | **72%**  | Login, alias list, overview **Get started** (funnel order: alias → inbox → vault → brokers → billing) + **Quick actions** (incl. **Vault**), broker **first scan** + **status legend** + **429** retry hint + **summary cap** footnote, onboarding **7 steps**, notification center + **prefs** + **errors on PUT prefs**, **inbox** read/unread + filter. **`parseApiResponseJson`** attaches **`httpStatus`**; **`X-Request-Id`** in dev on failures.                                    |
| M5: Phone Aliases        | Month 3     | **58%**  | Env adapter + **`GET /api/phone/provider`** (**`lastError`** for misconfig); **503** when Twilio selected without SID; dashboard forward UX. PSTN/SMS still external.        |
| M6: Broker Scanner       | Month 4     | **72%**  | 150+ brokers searchable. Scan results display in dashboard. **`BROKER_SCAN_WORKER_DELAY_MS`** + **`BROKER_SCAN_CONCURRENCY`**; free-tier **429** includes **`retryAfterSeconds`** in JSON; summary exposes **`canRequestRemoval`** + **`freeTierBrokerScanMaxPer24h`** (parity with quota env). |
| M7: Broker Removal       | Month 5     | **64%**  | Simulated removal for paid tier (doc: no live automation); **`brokerRemovalMethodLabel`** (API vs DIY) + row CTAs + free **Upgrade** copy; results **status legend**; tier-gated queue (**`upgrade_required`**); **`FREE_TIER_BROKER_SCAN_MAX_PER_24H`** on API summary + UI; **`tier_limit`** / **`user/me`** parity for alias caps where relevant. |
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


