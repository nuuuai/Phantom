# Auth & vault — Phase 1 policy

This document fixes roadmap ambiguity between **password-based login**, **JWT sessions**, and **client-side vault encryption**.

## What Phase 1 ships

| Concern | Implementation | Notes |
|--------|----------------|--------|
| **HTTP API auth** | Short-lived **JWT** access tokens + opaque **refresh** tokens | Access: **HS256** when `JWT_SECRET` is set, or **RS256** when `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` are set (`src/api/src/lib/jwt.ts`). Refresh tokens require **Redis** (`REDIS_URL`) for rotation/revocation. |
| **SRP (Secure Remote Password)** | **Out of scope** for Phase 1 | No PAKE for login; email+password over TLS as today. |
| **Vault encryption key** | **PBKDF2-SHA256** (Web Crypto), per-user salt stored server-side | Implemented in `@phantom/shared` (`deriveVaultKey` in `vaultCrypto.ts`). **Argon2id** for vault KDF is a future hardening step, not a Phase 1 blocker. |
| **Argon2id** | **Deferred** | Would replace or complement PBKDF2 for vault-only derivation; does not change JWT design. |

## Incremental path (post–Phase 1)

1. Introduce **Argon2id** for new vault salts only (migration for existing users), keeping JWT unchanged.
2. Optionally add **SRP** or WebAuthn for login without sending password hashes to the server — separate from vault KDF.

## References

- `docs/roadmap/PHASE_1_FOUNDATION.md` — deliverable percentages
- `docs/architecture/USER_DATA_SCOPE.md` — tenant boundary
