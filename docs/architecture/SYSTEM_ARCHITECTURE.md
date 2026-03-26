# System Architecture

## High-Level Architecture

Phantom follows a hub-and-spoke model with the AI Orchestration Layer (The Brain) at the center, connecting six subsystems.

```
┌─────────────────────────────────────────────────────────┐
│   CLIENT LAYER (Desktop-First)                          │
│   Browser Extension · Web Dashboard · (Mobile Phase 4)  │
└──────────────────────────┬──────────────────────────────┘
                           │
                  ┌────────┴─────────┐
                  │   THE BRAIN      │
                  │  AI Orchestration │
                  └──┬───┬───┬───┬───┘
               ┌────┘ ┌─┘   └─┐ └────┐
         ┌─────┴──┐ ┌─┴───┐ ┌─┴───┐ ┌┴───────┐
         │Telephony│ │Vault │ │Threat│ │Broker  │
         │  Infra  │ │      │ │Intel │ │Removal │
         └─────────┘ └──────┘ └──┬───┘ └────────┘
                                 │
                      ┌──────────┴──────────┐
                      │  ECOSYSTEM BRIDGE   │
                      │  Kova  ·  VulnIQ    │
                      └─────────────────────┘
```

## Component Details

### A. Client Layer

**Browser Extension (PRIMARY — Phase 1)**
- Chrome Extension Manifest V3
- Content scripts for form detection and alias autofill
- Service worker for API communication and background processing
- Popup UI for quick alias generation and identity switching
- Shadow DOM for injected UI (never override host page styles)
- Extension storage for non-sensitive preferences
- Encrypted IndexedDB for credential cache

**Web Dashboard (PRIMARY — Phase 1)**
- React + TypeScript + Vite SPA
- Full management console: aliases, threats, exposure reports, family admin
- Real-time WebSocket updates for threat alerts and call screening
- Scammer Engagement Engine transcript viewer
- Responsive but optimized for desktop (1280px+ viewport)

**Mobile Apps (FINAL — Phase 4)**
- React Native (code sharing with web dashboard)
- Native call integration for on-device Call Guard
- Push notifications for breach alerts
- Biometric authentication for vault access

### B. AI Orchestration Layer (The Brain)

The Brain is the central coordinator. It routes requests, manages agent lifecycle, and maintains per-user behavioral models.

**Components:**
- **Agent Router** — Determines which AI agent handles a request (call screening, alias management, breach response, scammer engagement)
- **Behavioral Model Store** — Per-user models tracking communication patterns, login habits, alias usage, risk profile
- **Decision Engine** — Takes inputs from all subsystems and decides actions (block call, rotate alias, file complaint, etc.)
- **Natural Language Interface** — Processes user commands ("Phantom, create a shopping identity")
- **Cross-User Aggregator** — Anonymizes and aggregates threat patterns across all users

**Deployment:**
- Cloud-based for heavy processing (AWS Lambda / ECS)
- Edge inference for latency-critical decisions (call screening must resolve <2s)
- Agent framework powered by Kova — each agent is a modular unit

### C. Telephony Infrastructure

**Not VoIP.** Phantom partners with tier-1 carriers for real phone numbers.

**Components:**
- **Number Provisioning Service** — Provisions real carrier-grade phone numbers
- **Call Routing Engine** — Routes incoming calls through AI screening before reaching user
- **SIP/RTP Gateway** — Handles real-time call audio for screening and engagement
- **SMS/MMS Router** — Dedicated SMS infrastructure (not Twilio)
- **eSIM Provisioner** — Manages multiple eSIM profiles per device
- **Data Poisoning Engine** — Assigns numbers to multiple users to confuse data aggregators

**Call Flow:**
```
Incoming Call → Phantom Telephony → Call Guard AI (< 2s decision)
  ├── Known Contact → Ring through immediately
  ├── Unknown, Low Risk → Screen, provide transcript, let through
  ├── Unknown, Medium Risk → Screen, warn user, offer takeover
  └── Scam Detected (>80% confidence) → Engage Scammer Engagement Engine
```

### D. Identity & Credential Vault

**Zero-knowledge architecture.** Phantom cannot access user data, even if servers are breached.

**Design:**
- Client-side encryption using AES-256-GCM before any data leaves the device
- Per-user isolated databases (not shared tables)
- Per-alias encryption within each user's database
- Master key derived from user's passphrase via Argon2id (never transmitted)
- Key rotation on password change without re-encrypting entire vault

**What's in the Vault:**
- Real identity details (name, SSN, address) — encrypted, never exposed
- Alias-to-real-identity mappings
- Passwords, TOTP seeds, recovery codes
- Virtual card details
- Alias health scores and metadata

### E. Threat Intelligence Engine

**Components:**
- **Ingest Pipeline** — Collects data from: Scammer Engagement Engine transcripts, dark web monitors, data broker scans, user reports, VulnIQ feeds
- **Pattern Recognizer** — ML model that identifies emerging scam campaigns, breach patterns, broker behaviors across the anonymized user network
- **Threat Score Calculator** — Assigns risk scores to phone numbers, email domains, IP ranges, and scam campaigns
- **Alert Dispatcher** — Sends real-time alerts to affected users when new threats are identified
- **VulnIQ Bridge** — API endpoint for bidirectional threat intelligence exchange

**Data Retention:**
- Threat patterns expire after 90 days unless refreshed
- Raw data is anonymized within 24 hours of collection
- No PII in the threat intelligence store — ever

### F. Data Broker Removal Engine

**Components:**
- **Broker Registry** — Database of 300+ data brokers with: API endpoints, manual submission URLs, opt-out procedures, typical response times, re-listing frequency
- **Scanner** — Searches broker sites for user data (name, phone, email, address variations)
- **Removal Submitter** — Automated submission of opt-out/removal requests (APIs where available, browser automation where not)
- **Re-listing Monitor** — Re-scans each broker every 14 days to detect re-listed data
- **Legal Escalator** — Generates CCPA/GDPR violation notices for repeat offenders
- **Honeypot Manager** — Creates and monitors bait identities seeded into broker networks

## Infrastructure

### Cloud Architecture
- **Primary:** AWS (us-east-1, us-west-2)
- **Compute:** ECS Fargate (API), Lambda (event processing), EC2 (telephony)
- **Storage:** RDS PostgreSQL (primary), ElastiCache Redis (sessions/cache), S3 (encrypted backups)
- **Search:** Elasticsearch (threat intelligence, broker registry)
- **Queue:** SQS (async processing), EventBridge (event routing)
- **CDN:** CloudFront (dashboard, extension updates)

### Scaling Strategy
- Stateless API servers behind ALB — horizontal scaling
- Telephony infrastructure scales independently (dedicated EC2 fleet)
- AI inference scales with GPU instances (p3/g4 for custom models)
- Database read replicas for dashboard queries
- Redis cluster for session management and real-time threat cache

### Monitoring
- Application: Datadog APM
- Infrastructure: CloudWatch + custom dashboards
- Security: AWS GuardDuty + custom anomaly detection
- Uptime: 99.9% SLA target for core services (alias generation, call routing)
