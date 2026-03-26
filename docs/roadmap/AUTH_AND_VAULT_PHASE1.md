# Auth & vault — Phase 1 policy

This document fixes roadmap ambiguity between **password-based login**, **JWT sessions**, and **client-side vault encryption**.

## What Phase 1 ships

| Concern | Implementation | Notes |
|--------|----------------|--------|
| **HTTP API auth** | Short-lived **JWT** access tokens + opaque **refresh** tokens | Access JWT (`jwt.ts`): **`sub`** (user id), **`email`**, **`iss`** `phantom-api`, **`iat`/`exp`**; **HS256** when `JWT_SECRET` (≥16 chars); **RS256** when `JWT_PRIVATE_KEY` + `JWT_PUBLIC_KEY` PEM (invalid PEM → **fail fast** at startup via `assertJwtEnvConfigured`). Verify uses **`clockTolerance` 60s** for clock skew. **No** `aud` claim in Phase 1. **Authorization: Bearer** only — do not put access tokens in query strings. **`authenticateJwt`**: missing/invalid token → **401** (`unauthorized` / `invalid_token`). **Resource authorization** (e.g. tier) → **403** where applicable. |
| **Refresh tokens** | Opaque random **hex**; **SHA-256** hash is the Redis key; plaintext refresh never stored | **Redis** required for refresh **rotation** (`POST /api/auth/refresh`) and **logout** revoke. If `REDIS_URL` unset, login/register omit **`refreshToken`**; **`POST /api/auth/refresh`** → **503** `service_unavailable`. TTL **7 days**; old refresh invalidated on successful rotation. |
| **SRP (Secure Remote Password)** | **Out of scope** for Phase 1 | No PAKE for login; email+password over TLS as today. |
| **Vault encryption key** | **PBKDF2-SHA256** (Web Crypto), per-user salt stored server-side | Implemented in `@phantom/shared` (`deriveVaultKey` in `vaultCrypto.ts`). **Argon2id** for vault KDF is a future hardening step, not a Phase 1 blocker. |
| **Argon2id** | **Deferred** | Would replace or complement PBKDF2 for vault-only derivation; does not change JWT design. |
| **E2E vault sync blob** | **`User.vaultSyncCiphertext`** + **`vaultSyncVersion`**; **`GET`/`PUT /api/vault/sync`** | Server stores **opaque** AES-GCM ciphertext only — **no** server-side decryption, **no** vault passphrase on the wire. Clients merge with **`mergeVaultSyncForServer`** / **`executeVaultSyncPush`** in `@phantom/shared`; stale **`clientVersion`** → **409** `sync_conflict` → refetch + merge + retry (`vaultSyncMerge.ts`). |
| **Per-credential encryption** | **AES-256-GCM** for `Alias.encryptedValue` (password-type) | Same Web Crypto stack as the sync blob; ciphertext is opaque to the API. |

## Incremental path (post–Phase 1)

1. Introduce **Argon2id** for new vault salts only (migration for existing users), keeping JWT unchanged.
2. Optionally add **SRP** or WebAuthn for login without sending password hashes to the server — separate from vault KDF.

## References

- `docs/roadmap/PHASE_1_FOUNDATION.md` — deliverable percentages
- `docs/architecture/USER_DATA_SCOPE.md` — tenant boundary
