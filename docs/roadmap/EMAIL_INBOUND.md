# Email aliases — inbound / forwarding (Phase 1)

Phantom’s API **generates** `@phantom.id` aliases. **Receiving** mail requires DNS + an inbound provider; this repo includes a **signed webhook** and **dashboard inbox** so a worker can POST parsed mail into the API.

## DNS (authoritative for each domain)

| Record | Purpose |
|--------|---------|
| **MX** | Point inbound mail to your provider (e.g. Amazon SES inbound, SendGrid Inbound Parse, Mailgun routes, or self-hosted MTA). |
| **SPF** | `v=spf1 include:_spf.<provider> ~all` (tune to your sender + inbound host). |
| **DKIM** | Provider-supplied TXT selectors for **outbound** signing. |
| **DMARC** | Start with `p=none` at `rua=` for reporting; tighten after metrics. |

## Inbound webhook (implemented)

- **URL:** `POST /api/webhooks/email-inbound`
- **Auth:** Set `INBOUND_WEBHOOK_SECRET` (≥16 chars). Request body must be **raw JSON** (`Content-Type: application/json` or `application/json; charset=utf-8`). Other media types return **415**.
- **Signature:** `X-Phantom-Signature: sha256=<hex>` where `<hex>` is HMAC-SHA256 of the **raw** body bytes using the same secret.
- **Limits:** Body max **256kb**; rate limit **120 requests / minute / IP** (express-rate-limit). Response includes `X-Phantom-Request-Id` for log correlation.
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

- **Behavior:** Resolves an active `email` alias by address, stores `AliasInboxMessage`, bumps alias `lastActivityAt`, creates a low-priority **system** notification linking to `/inbox`. Duplicate **`providerMessageId`** returns success with dedupe (`data: { deduped: true }`). If **`providerMessageId` is omitted**, the API computes a deterministic **`phantom:v1:<sha256>`** key from alias + from + subject + `receivedAt` + snippet so worker retries still dedupe without upstream IDs.

- **503** if `INBOUND_WEBHOOK_SECRET` is unset (forces explicit operator setup).

## Dashboard

- **Alias inbox** route: `/inbox` (lists stored messages).
- **Settings:** optional `forwardToEmail` on the user (`PATCH /api/user/me`) for future SMTP digest / forward (not sent automatically in Phase 1).

## Still external / TODO

- MX + worker that receives MIME and calls the webhook.
- Outbound forward to `forwardToEmail` (SES/SendGrid SMTP or API).
- SPF/DKIM/DMARC automation and domain purchase (`phantom.id` production).

## Environment

See repo root `.env.example`: `INBOUND_WEBHOOK_SECRET`.
