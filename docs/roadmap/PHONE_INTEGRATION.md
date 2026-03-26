# Phone aliases — VoIP / SMS (Phase 1 boundaries)

## Current behavior (codebase)

- **API:** `phone` aliases use `provisionPhoneAlias()` (`src/api/src/lib/phone/provisionPhone.ts`):
  - **Default (`PHONE_PROVIDER` unset or `mock`):** same **+1-555-…** placeholder as before, plus `phoneProviderSid` `mock_*` and optional **`phoneForwardTo`** from `GenerateAliasRequest.phoneForwardTo` or `PATCH` `phoneForwardTo`.
  - **`PHONE_PROVIDER=twilio` + `TWILIO_ACCOUNT_SID`:** stub SID `twilio_stub_*` (real Number API calls are still TODO).
- **Dashboard:** alias detail shows **Phone routing** (provider, forward target, SID) when `type === "phone"`.
- **No live carrier PSTN/SMS** yet — adapter boundary is in place for Twilio-style wiring.

## External provider (when you add one)

Typical options: **Twilio**, **Telnyx**, **Bandwidth**. You will need:

| Concern | Notes |
|---------|--------|
| **Numbers** | Search + purchase numbers per region; store `providerSid` on an `Alias` or side table. |
| **Voice** | Forward inbound calls to the user’s real number via SIP or PSTN `Dial`. |
| **SMS** | Inbound webhook → resolve owning user → dashboard “SMS inbox” or notification. |
| **Compliance** | A2P 10DLC / registration (US), recording consent, retention policy. |

## Suggested env

```
# mock (default) or twilio for stub branch
# PHONE_PROVIDER=mock

# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
# TWILIO_FROM_NUMBER=
```

When Twilio is wired, implement number search/purchase in `provisionPhone.ts` and store the purchased resource SID in `phoneProviderSid`.

## Product note

VoIP numbers are often **rejected by banks and some OTP flows**. Document which services fail; Phase 2 targets carrier-grade numbers per the main roadmap.
