# Email aliases — inbound / forwarding (Phase 1)

Phantom’s API **generates** `@phantom.id` aliases. **Receiving** mail requires DNS + an inbound provider; this repo includes a **signed webhook** and **dashboard inbox** so a worker can POST parsed mail into the API.

**Ops alignment:** SPF / DKIM / DMARC below are **manual DNS steps** (no in-repo verifier). Outbound notification email remains **not implemented** until a real sender exists — **`NOTIFICATIONS_EMAIL_ENABLED`** is documented in **`DEPLOYMENT.md`** and is **not** read by application code today (same honesty as inbound: no fake delivery claims).

## DNS (authoritative for each domain)

| Record | Purpose |
|--------|---------|
| **MX** | Point inbound mail to your provider (e.g. Amazon SES inbound, SendGrid Inbound Parse, Mailgun routes, or self-hosted MTA). |
| **SPF** | `v=spf1 include:_spf.<provider> ~all` (tune to your sender + inbound host). |
| **DKIM** | Provider-supplied TXT selectors for **outbound** signing. |
| **DMARC** | Start with `p=none` at `rua=` for reporting; tighten after metrics. |

**Operator checklist (ops, not automated in repo):** (1) Publish MX to the inbound provider you will use. (2) Add SPF that authorizes that provider’s sending IP / include. (3) Enable DKIM in the provider and add the TXT/CNAME records they give you. (4) Add a DMARC record (start `p=none`, collect `rua` reports, then tighten). Re-verify after any DNS or provider change.

### SPF / DKIM / DMARC — hands-on steps (no fake delivery)

These steps assume you control DNS for the domain that receives mail (e.g. `phantom.id`). Nothing in this repo sends or verifies DNS for you.

1. **MX** — In your DNS host, create **MX** record(s) pointing to the hostname your inbound provider specifies (priority + target). Wait for propagation (often minutes to hours). Confirm with `nslookup -type=MX yourdomain.com` or your provider’s DNS checker.
2. **SPF (TXT at apex or aligned subdomain)** — Publish **`v=spf1`** including mechanisms your **outbound** sending path uses (`include:` for SES/SendGrid/etc.) and your inbound host if it also sends bounces. Avoid multiple SPF TXT records on the same name. Use `~all` or `-all` per your rollout policy; start permissive only if you must, then tighten.
3. **DKIM** — In the outbound provider’s console, enable signing and add the **exact** TXT or CNAME records they show (selector._domainkey). Verify with the provider’s validator or `dig TXT selector._domainkey.yourdomain.com`.
4. **DMARC** — Add **`_dmarc.yourdomain.com`** TXT with `v=DMARC1; p=none; rua=mailto:…` first. Monitor aggregate reports, fix SPF/DKIM alignment issues, then move to `p=quarantine` / `p=reject` when confident. Misaligned mail will still **fail** DMARC once you enforce — fix before tightening.
5. **Re-check after changes** — Any change to mail provider, sending domain, or subdomain can break alignment. Re-run MX + SPF + DKIM checks before marketing the address.

## Inbound webhook (implemented)

- **URL:** `POST /api/webhooks/email-inbound`
- **Auth:** Set `INBOUND_WEBHOOK_SECRET` (≥16 chars). Request body must be **raw JSON** (`Content-Type: application/json` or `application/json; charset=utf-8`). Other media types return **415**.
- **Signature:** `X-Phantom-Signature: sha256=<hex>` where `<hex>` is HMAC-SHA256 of the **raw** body bytes using the same secret. Verification uses **timing-safe** comparison. There is **no** separate timestamp / clock-skew step (this is not a JWT).
- **Failure codes:** **401** `invalid_signature` — missing header, wrong prefix, malformed hex, or HMAC mismatch. **503** `webhook_unconfigured` — secret missing or too short.
- **Limits:** Body max **256kb** (`express.raw`); rate limit **120 requests / minute / IP** (express-rate-limit). **`aliasAddress`** max **254** characters. Response includes **`X-Phantom-Request-Id`** (UUID) on every response for log correlation — **do not** log raw bodies or secrets.
- **JSON body:**

```json
{
  "aliasAddress": "local@phantom.id",
  "subject": "Optional subject",
  "fromAddress": "sender@example.com",
  "snippet": "Plaintext preview / first lines",
  "receivedAt": "2025-01-01T12:00:00.000Z",
  "providerMessageId": "optional-id-for-dedup"
}
```

- **Behavior:** Resolves an active `email` alias by address, stores `AliasInboxMessage`, bumps alias `lastActivityAt`, creates a low-priority **system** notification linking to `/inbox`. Duplicate **`providerMessageId`** returns success with dedupe (`data: { deduped: true }`). If **`providerMessageId` is omitted**, the API computes a deterministic **`phantom:v1:<sha256>`** key from alias + from + subject + `receivedAt` + snippet so worker retries still dedupe without upstream IDs. Concurrent duplicate POSTs that race past the read check are caught via **unique** `providerMessageId` and return **`deduped: true`** (no duplicate inbox rows).

- **503** if `INBOUND_WEBHOOK_SECRET` is unset (forces explicit operator setup).

## Outbound / digest email (not wired)

- **In-app + desktop notifications** use the API + dashboard (`GET/PUT /api/notifications`, `NotificationPref`). There is **no** Phase 1 worker that sends email from those events.
- **Outbound email** (breach digests, removal confirmations, notification digests) is **not** implemented in the API sender path. **`NOTIFICATIONS_EMAIL_ENABLED`** (see **`DEPLOYMENT.md`** / **`.env.example`**) is reserved for a future SES/SMTP sender — keep **`0`** or unset; do not claim delivery without a real mailer.

## Dashboard

- **Alias inbox** route: `/inbox` (lists stored messages).
- **`GET /api/email-inbox`** (authenticated): query params **`limit`** (default 40, clamped **1–100**), **`offset`** (default 0, max **50_000**), **`q`** (search), **`unread=1`** (unread only). Response includes **`data.meta: { limit, offset }`** alongside **`data.items`**.
- **Settings:** optional `forwardToEmail` on the user (`PATCH /api/user/me`) for future SMTP digest / forward (not sent automatically in Phase 1). Validation matches the dashboard client (`@phantom/shared` **`parseForwardToEmailPatchBody`** / **`isValidForwardEmailInput`**).

## Still external / TODO

- MX + worker that receives MIME and calls the webhook.
- Outbound forward to `forwardToEmail` (SES/SendGrid SMTP or API).
- SPF/DKIM/DMARC automation and domain purchase (`phantom.id` production).

## Environment

See repo root `.env.example`: `INBOUND_WEBHOOK_SECRET`.

