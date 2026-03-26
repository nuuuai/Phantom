# Phone aliases — VoIP / SMS (Phase 1 boundaries)

## Current behavior (codebase)

- **API:** `phone` aliases are generated as **placeholder E.164-style values** (see `src/api/src/lib/aliasGenerators.ts`) with tier limits enforced like email.
- **No live carrier or VoIP** provisioning, call forwarding, or SMS ingestion is connected.

## External provider (when you add one)

Typical options: **Twilio**, **Telnyx**, **Bandwidth**. You will need:

| Concern | Notes |
|---------|--------|
| **Numbers** | Search + purchase numbers per region; store `providerSid` on an `Alias` or side table. |
| **Voice** | Forward inbound calls to the user’s real number via SIP or PSTN `Dial`. |
| **SMS** | Inbound webhook → resolve owning user → dashboard “SMS inbox” or notification. |
| **Compliance** | A2P 10DLC / registration (US), recording consent, retention policy. |

## Suggested env (not wired yet)

```
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
# TWILIO_FROM_NUMBER=
```

## Product note

VoIP numbers are often **rejected by banks and some OTP flows**. Document which services fail; Phase 2 targets carrier-grade numbers per the main roadmap.
