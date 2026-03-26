# Tech Stack

## Decision: Desktop-First Implications

Every technology choice optimizes for web dashboard + browser extension as the primary platform. Mobile-specific technologies are deferred to Phase 4.

## Frontend

| Technology | Purpose | Rationale |
|-----------|---------|-----------|
| React 18+ | UI framework | Component model, ecosystem, team familiarity |
| TypeScript (strict) | Type safety | Privacy product demands correctness — no `any` types |
| Vite | Build tool | Fast dev server, optimized builds, good plugin ecosystem |
| TailwindCSS | Styling | Utility-first, consistent design system, small bundle |
| React Router v6 | Routing | Dashboard needs client-side routing |
| Zustand | State management | Lightweight, TypeScript-friendly, no boilerplate |
| React Query (TanStack) | Server state | Caching, background refetching, optimistic updates |
| Recharts | Data visualization | Exposure reports, risk scoring charts, threat maps |
| Framer Motion | Animations | Polished UI transitions (dashboard, threat alerts) |

## Browser Extension

| Technology | Purpose | Rationale |
|-----------|---------|-----------|
| Manifest V3 | Extension platform | Required by Chrome, future-proof |
| Plasmo | Extension framework | Simplifies MV3 development, hot reload, multi-browser |
| Shadow DOM | Injected UI isolation | Never interfere with host page styles |
| chrome.storage API | Non-sensitive prefs | Extension-native, syncs across devices |
| IndexedDB + Web Crypto | Credential cache | Encrypted local store for autofill performance |

## Backend

| Technology | Purpose | Rationale |
|-----------|---------|-----------|
| Node.js + Express | API server | Fast development, TypeScript shared with frontend |
| PostgreSQL 16 | Primary database | ACID compliance, JSON support, row-level security |
| Redis 7 | Cache + sessions | Sub-ms reads for threat scores, session management |
| Elasticsearch 8 | Threat intelligence | Full-text search across scam transcripts, broker registry |
| Bull/BullMQ | Job queues | Async processing: broker scans, removal submissions, report generation |
| Socket.io | WebSockets | Real-time threat alerts, call screening updates to dashboard |

## AI / ML

| Technology | Purpose | Rationale |
|-----------|---------|-----------|
| Anthropic Claude API | Primary LLM | Scammer engagement personas, natural language interface, report generation |
| OpenAI Whisper | Speech-to-text | Call transcription for Call Guard |
| Custom PyTorch models | Scam detection | Fine-tuned on scam call patterns, deepfake voice detection |
| Python + FastAPI | ML service | Separate service for AI inference, GPU-optimized |
| Hugging Face Transformers | NLP pipeline | Intent classification, scam script analysis |
| scikit-learn | Pattern recognition | Cross-user threat pattern clustering |

## Telephony

| Technology | Purpose | Rationale |
|-----------|---------|-----------|
| Tier-1 carrier API | Number provisioning | Real carrier-grade numbers, not VoIP |
| Oztag SIP/RTP stack | Call routing | Real-time call interception and forwarding |
| WebRTC | Browser call integration | Dashboard-based call monitoring/takeover |
| Custom call router | AI screening pipeline | Routes calls through Brain before reaching user |

## Security / Encryption

| Technology | Purpose | Rationale |
|-----------|---------|-----------|
| Web Crypto API | Client-side encryption | Browser-native, zero-knowledge vault |
| AES-256-GCM | Data encryption | Industry standard for data at rest |
| Argon2id | Key derivation | Memory-hard, resistant to GPU attacks |
| TLS 1.3 | Transport encryption | All API communication |
| AWS KMS | Server-side key management | Envelope encryption for per-user databases |
| CSP headers | XSS prevention | Strict Content-Security-Policy on all pages |

## Infrastructure

| Technology | Purpose | Rationale |
|-----------|---------|-----------|
| AWS | Cloud platform | Mature, compliant (SOC2, HIPAA-eligible), global reach |
| Docker | Containerization | Consistent environments, easy scaling |
| Terraform | Infrastructure as code | Reproducible, version-controlled infrastructure |
| GitHub Actions | CI/CD | Integrated with repo, good for extension builds |
| Datadog | Monitoring + APM | Full-stack observability |
| Sentry | Error tracking | Client + server error capture |

## Development

| Tool | Purpose |
|------|---------|
| Cursor AI | Primary IDE (with .cursorrules) |
| ESLint + Prettier | Code formatting and linting |
| Vitest | Unit + integration testing |
| Playwright | E2E testing (dashboard + extension) |
| Storybook | Component development and documentation |

## What We Explicitly DON'T Use

| Technology | Why Not |
|-----------|---------|
| Twilio | Need real carrier numbers, not VoIP |
| Firebase | Not suitable for zero-knowledge architecture |
| MongoDB | Need ACID transactions for financial data |
| Next.js | Dashboard is a pure SPA, no SSR needed |
| React Native (Phase 1-3) | Mobile is Phase 4 |
| Electron | Web dashboard in browser is sufficient |
