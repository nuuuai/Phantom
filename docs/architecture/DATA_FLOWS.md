# Data Flows

## Core Principle

User data is encrypted client-side before transmission. Phantom's servers never see plaintext PII. All cross-user intelligence is anonymized at the point of collection.

## Flow 1: Alias Generation (Browser Extension)

```
User visits signup form
  → Extension detects form fields (email, phone, password, name)
  → Extension popup offers "Generate Phantom Identity"
  → User clicks generate
  → Extension → API: POST /api/aliases/generate { type: "email", context: "shopping" }
  → API → Brain: Select alias strategy (new domain, existing pool, data poisoning assignment)
  → Brain → Number Provisioner / Email Provisioner: Create alias
  → API → Extension: { alias: "shade7x@phantom.id", phone: "+1-XXX-XXX-XXXX" }
  → Extension autofills form with alias credentials
  → Extension → Vault: Store alias mapping (encrypted client-side)
```

**Latency target:** < 500ms from click to autofill

## Flow 2: Incoming Call Screening

```
Unknown number calls user's Phantom-provisioned number
  → Telephony Infra intercepts call
  → Call Guard AI answers (< 1s)
  → AI engages caller in conversation (2-10 seconds)
  → Brain classifies intent:
      ├── LEGITIMATE (< 50% scam score)
      │     → Forward call to user's real phone
      │     → Dashboard notification: "Screened call from [number], forwarded"
      │
      ├── SUSPICIOUS (50-80% scam score)
      │     → Forward with warning banner
      │     → Dashboard: full transcript, "take over" option
      │
      └── SCAM DETECTED (> 80% scam score)
            → Activate Scammer Engagement Engine
            → Deploy selected AI persona
            → Stream transcript to dashboard in real-time
            → After engagement ends:
                → Anonymize and store transcript in Threat Intel
                → Auto-file FTC complaint
                → Update cross-user threat patterns
```

**Latency target:** < 2s for screening decision

## Flow 3: Data Broker Scan & Removal

```
User initiates exposure scan (or scheduled re-scan triggers)
  → Broker Removal Engine: Queue scan jobs for all 300+ brokers
  → Scanner workers (parallel, rate-limited per broker):
      → Search each broker for: name, phone, email, address variations
      → Record: { broker, found: true/false, data_types_found, scan_date }
  → Results aggregated in dashboard:
      → "Found on 47 of 312 brokers scanned"
      → Breakdown by data type (phone: 38, email: 42, address: 31, etc.)
  → User initiates removal (or autopilot handles automatically):
      → Removal Submitter queues removal requests:
          → API brokers: automated opt-out submission
          → Manual brokers: browser automation submits forms
          → Verify brokers: follow-up verification after 7-30 days
      → Track status: { submitted, confirmed, re-listed }
  → Re-listing Monitor (every 14 days):
      → Re-scan previously removed brokers
      → If re-listed: auto-submit removal again
      → If re-listed 3+ times: escalate to Legal Escalation pipeline
```

## Flow 4: Breach Detection & Auto-Response (Autopilot)

```
Threat Intel Engine detects breach affecting user's alias
  → Source: dark web monitor / breach database / VulnIQ feed
  → Brain receives alert: { alias_id, breach_source, data_exposed }
  → Autopilot decision tree:
      ├── Password exposed:
      │     → Credential Rotation Engine: Change password at source service
      │     → Vault: Update stored credentials
      │     → User notification: "Password changed for [service]"
      │
      ├── Email alias exposed:
      │     → Quarantine alias (stop forwarding, hold messages)
      │     → Generate replacement alias
      │     → If AutoCloak enabled: update credentials at source service
      │     → User notification: "[alias] was compromised. Replaced with [new_alias]"
      │
      └── Phone number exposed:
            → Number Lock: block all non-contact callers on that number
            → Generate replacement number
            → User notification with migration guidance
  → Monthly Exposure Report: Include breach details and actions taken
```

## Flow 5: Ecosystem Data Exchange

```
PHANTOM → VULNIQ:
  → Anonymized scam call transcripts (scripts, social engineering tactics)
  → Phishing URL patterns detected by extension
  → Deepfake voice samples (anonymized audio fingerprints)
  → Data broker behavior patterns (re-listing frequency, data types sold)

VULNIQ → PHANTOM:
  → Vulnerability feeds (which services are likely to be breached)
  → Threat actor profiles (scam operation fingerprints)
  → Breach prediction scores for major services
  → Compliance risk assessments for services using user aliases

KOVA → PHANTOM:
  → Agent deployments (new/updated AI agents for call screening, engagement, etc.)
  → Agent performance benchmarks and optimization recommendations
  → New persona templates for Scammer Engagement Engine

PHANTOM → KOVA:
  → Real-world agent performance data (accuracy, latency, user feedback)
  → Edge cases and failure modes discovered in production
  → User interaction patterns with natural language interface
```

## Data Classification

| Data Type | Classification | Storage | Encryption | Retention |
|-----------|---------------|---------|-----------|-----------|
| Real identity (name, SSN, address) | CRITICAL | Vault only | Client-side AES-256 | Until user deletes |
| Alias mappings | CRITICAL | Vault only | Client-side AES-256 | Until alias retired |
| Passwords/TOTP seeds | CRITICAL | Vault only | Client-side AES-256 | Until credential changed |
| Call transcripts (user's calls) | SENSITIVE | Per-user DB | Server-side AES-256 | 90 days |
| Scam engagement transcripts | INTERNAL | Threat Intel DB | Server-side, anonymized | 90 days |
| Threat patterns | INTERNAL | Threat Intel DB | Server-side | 90 days unless refreshed |
| Broker scan results | STANDARD | Per-user DB | Server-side AES-256 | Until next scan |
| Dashboard preferences | LOW | Extension storage | Unencrypted | Indefinite |
