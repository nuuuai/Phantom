# Security Model

## Core Principle: Zero-Knowledge Architecture

Phantom cannot access user data. Even if every Phantom server is breached, attackers get encrypted blobs they cannot decrypt. The encryption keys exist only on the user's devices.

## Encryption Architecture

### Client-Side Encryption (Vault)

```
User's Master Passphrase
  → Argon2id (memory: 64MB, iterations: 3, parallelism: 4)
  → Master Key (256-bit)
      ├── Vault Encryption Key (derived via HKDF)
      │     → Encrypts: identity mappings, passwords, TOTP seeds, card details
      │     → Algorithm: AES-256-GCM with random 96-bit IV per record
      │
      └── Auth Key (derived via HKDF, separate from encryption key)
            → Used only for server authentication (SRP protocol)
            → Server never sees master key or encryption key
```

### Per-Alias Encryption

Each alias within a user's vault has its own encryption envelope:

```
Vault Encryption Key
  → Per-Alias Key (derived via HKDF with alias_id as context)
      → Encrypts all data associated with that alias
      → If one alias key is somehow compromised, others remain secure
```

### Server-Side Encryption (Non-Vault Data)

Data that must exist server-side (broker scan results, threat intel contributions) uses envelope encryption:

```
AWS KMS Customer Master Key (CMK)
  → Per-User Data Encryption Key (DEK)
      → Encrypts: broker scan results, call screening logs, exposure reports
      → DEK rotated every 90 days automatically
```

## Authentication

### User Authentication
- SRP (Secure Remote Password) protocol — server never receives the password
- Passphrase-based, not email/password (stronger, no password reuse risk)
- Optional: hardware key (FIDO2/WebAuthn) as second factor
- Optional: biometric unlock on supported devices (vault key cached securely)

### Extension Authentication
- Session token stored in encrypted extension storage
- Token refresh every 15 minutes (short-lived)
- Device fingerprinting to detect token theft
- Re-authentication required for sensitive actions (viewing real identity, exporting vault)

### API Authentication
- JWT with RS256 signing (asymmetric — server signs, clients verify)
- Token expiry: 15 minutes (access), 7 days (refresh)
- Refresh token rotation (one-time use)
- Rate limiting: 100 req/min per user, 10 req/min for sensitive endpoints

## Data Isolation

### Per-User Database Isolation
- Each user's data lives in an isolated PostgreSQL schema
- Row-level security (RLS) policies prevent cross-user data access
- Database connections use per-user roles with minimal privileges
- Backup encryption uses per-user keys (not shared)

### Threat Intelligence Anonymization
All data entering the threat intelligence store is anonymized:

1. **Phone numbers** → Replaced with carrier + region code only (e.g., "T-Mobile, area 212")
2. **Email addresses** → Replaced with domain only (e.g., "gmail.com")
3. **User IDs** → Not included. Threat patterns are stateless.
4. **Scam transcripts** → AI-summarized to extract tactics, not verbatim storage
5. **Timestamps** → Rounded to nearest hour to prevent correlation attacks

## Threat Model

| Threat | Mitigation |
|--------|-----------|
| Server breach | Zero-knowledge: encrypted blobs only. No plaintext PII on servers. |
| Man-in-the-middle | TLS 1.3 everywhere. Certificate pinning in extension and mobile apps. |
| Extension compromise | Content scripts are minimal. Service worker handles all crypto. CSP prevents injection. |
| Insider threat | Per-user database isolation. No admin tool can bulk-decrypt vaults. Audit logging on all access. |
| Supply chain attack | Dependency pinning. SRI hashes on all CDN resources. npm audit in CI pipeline. |
| Brute force on vault | Argon2id with aggressive parameters. Account lockout after 10 attempts. |
| Phishing for passphrase | Extension warns when phishing sites impersonate Phantom. Domain verification in UI. |
| AI model manipulation | Scammer Engagement Engine never shares real data. All engagement uses fabricated personas. |
| Cross-user correlation | Anonymization at point of collection. No user IDs in threat intel. Differential privacy on aggregates. |

## Compliance

| Standard | Status | Notes |
|----------|--------|-------|
| SOC 2 Type II | Target Phase 2 | Required for enterprise customers |
| GDPR | Built-in | Right to deletion, data portability, consent management |
| CCPA | Built-in | Required for California users (our primary market) |
| HIPAA | Not applicable | Phantom does not process health data |
| PCI DSS | Required Phase 2 | When virtual cards launch (via card issuer partnership) |

## Incident Response

1. **Detection** — Automated monitoring via GuardDuty + custom anomaly detection
2. **Containment** — Automated isolation of affected systems. Per-user DB isolation limits blast radius.
3. **Notification** — Users notified within 72 hours (GDPR requirement). Transparent disclosure.
4. **Recovery** — Re-key affected user databases. Force re-authentication. Rotate all server-side keys.
5. **Post-mortem** — Public transparency report. Root cause analysis. Policy update.
