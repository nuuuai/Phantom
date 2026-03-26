# Phone aliases — VoIP / SMS (Phase 1 boundaries)

## What shipped (Phase 1)

### Provider adapter (env-driven)

- **Code layout:** `src/api/src/lib/phone/`
  - `phoneConfig.ts` — reads `PHONE_PROVIDER`, `TWILIO_ACCOUNT_SID`; exposes `getPhoneProviderPublicStatus()` for the API.
  - `phoneAdapter.ts` — `provisionPhoneAlias()`; **mock** vs **twilio** stub paths.
  - `validateForward.ts` — E.164 validation for `phoneForwardTo` (generate, rotate, PATCH).
- **`POST /api/aliases/generate`** (phone): validates forward target; returns **503** with `phone_provider_unavailable` if `PHONE_PROVIDER=twilio` but `TWILIO_ACCOUNT_SID` is unset.
- **`POST /api/aliases/:id/rotate`** (phone): same provision + validation rules.
- **`PATCH /api/aliases/:id`**: `phoneForwardTo` validated when present.
- **`GET /api/phone/provider`** (authenticated): public **dashboard** status — no secrets.

### Shared + dashboard

- **`@phantom/shared`:** `isValidE164Phone()`, `PhoneProviderStatus` type.
- **Generate alias modal:** when type is **Phone**, loads provider status, optional forward field, blocks generate while provider is loading or **unavailable** (Twilio misconfigured).
- **Alias detail (phone):** adapter status banner, **editable** forward field with Save (PATCH).

### Still provider-specific / not in Phase 1

| Area | Status |
|------|--------|
| Twilio Number API (search, purchase) | **TODO** — today only `twilio_stub_*` SIDs when SID is set. |
| Inbound voice (PSTN → forward) | **Not wired** — `phoneForwardTo` is stored only. |
| SMS → dashboard inbox | **Not wired** — see main roadmap. |
| Telnyx / Bandwidth / other carriers | **Not implemented** — extend `phoneAdapter` + `PHONE_PROVIDER` when needed. |
| `TWILIO_AUTH_TOKEN` for REST calls | Required only when implementing real provisioning. |

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `PHONE_PROVIDER` | No | `mock` (default) or `twilio`. |
| `TWILIO_ACCOUNT_SID` | If `PHONE_PROVIDER=twilio` | Must be non-empty for provisioning to succeed (stub mode). |
| `TWILIO_AUTH_TOKEN` | Future | Twilio REST API calls. |
| `TWILIO_FROM_NUMBER` | Future | SMS / outbound caller ID. |

## Product note

VoIP numbers are often **rejected by banks and some OTP flows**. Document which services fail; Phase 2 targets carrier-grade numbers per the main roadmap.
