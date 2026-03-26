# Ecosystem Overview: Kova · VulnIQ · Phantom

## The Three Pillars

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│     KOVA     │     │   VULNIQ     │     │   PHANTOM    │
│              │     │              │     │              │
│  Agent       │◄───►│  Security    │◄───►│  Personal    │
│  Factory     │     │  Intelligence│     │  Bodyguard   │
│              │     │              │     │              │
│  Builds and  │     │  Code audit, │     │  Protects    │
│  deploys AI  │     │  attack sim, │     │  individuals │
│  agents      │     │  compliance  │     │  and families │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │
                   ┌────────┴────────┐
                   │  SHARED LAYER   │
                   │                 │
                   │  • SSO/Auth     │
                   │  • Billing      │
                   │  • Threat Intel │
                   │  • Agent Store  │
                   └─────────────────┘
```

## How They Connect

### Kova → Phantom
**Kova is the factory. Phantom is the customer.**

Kova builds and deploys the AI agents that power Phantom:
- **Call Screening Agent** — Answers unknown calls, classifies intent
- **Scammer Engagement Agent** — Deploys personas, manages extended conversations
- **Alias Manager Agent** — Handles autonomous rotation, health monitoring
- **Breach Response Agent** — Detects breaches, executes containment and recovery
- **Report Generator Agent** — Creates monthly exposure reports
- **NLI Agent** — Processes natural language commands from users

Each agent is a modular unit that can be versioned, updated, rolled back, or replaced independently through Kova's deployment pipeline.

**Future:** Kova's agent marketplace could let power users customize Phantom's behavior — tweak engagement persona scripts, adjust screening sensitivity, create custom automation workflows.

### Phantom → Kova
**Phantom is the proving ground.**

Phantom generates massive real-world performance data for Kova-built agents:
- Agent accuracy metrics (true positive, false positive, false negative rates)
- Latency distributions per agent type
- User satisfaction signals (did user override agent decision?)
- Edge cases and failure modes discovered in production
- Conversation quality scores for engagement agents

This data feeds back into Kova's agent optimization pipeline, making every Kova-built agent better — not just for Phantom, but for all Kova customers.

### VulnIQ → Phantom
**VulnIQ is the intelligence analyst. Phantom is the field operative.**

VulnIQ provides Phantom with:
- **Vulnerability feeds** — Which services/platforms are most likely to be breached? Phantom uses this to adjust alias health scores proactively. If VulnIQ detects a critical vulnerability in Service X, Phantom can pre-warn users with aliases on Service X.
- **Threat actor profiles** — Scam operation fingerprints, social engineering playbooks, known attack patterns. Phantom's Call Guard uses these to improve scam detection.
- **Breach prediction scores** — Probability that a given service will be breached in the next 30 days. Phantom can preemptively rotate aliases on high-risk services.
- **Compliance risk assessments** — Which services have poor security practices? Phantom can warn users when they create aliases for risky services.

### Phantom → VulnIQ
**Phantom sees attacks in the wild. VulnIQ sees attacks in the lab.**

Phantom provides VulnIQ with real-world intelligence:
- **Scam call transcripts** (anonymized) — Social engineering scripts, manipulation techniques, psychological tactics used by real scammers
- **Phishing URL patterns** — URLs detected and blocked by the browser extension
- **Deepfake voice samples** — Audio fingerprints of synthetic speech detected by Call Guard
- **Data broker behaviors** — Which brokers re-list data, how quickly, what data types they sell
- **Attack volume and trends** — Real-time view of scam campaign scale and evolution

VulnIQ can use this data to:
- Build more realistic social engineering simulations for their clients
- Train better detection models using real attack samples
- Provide advisory reports on emerging threat trends
- Validate their vulnerability predictions against real-world breach data

## Shared Infrastructure

### Single Sign-On
One account across all three products. Users authenticate once and navigate between products seamlessly.

### Unified Billing
One subscription covers access to any combination of products. Bundle discounts for using multiple products.

### Shared Threat Intelligence Store
A common data layer that all three products read from and write to:
- Kova writes: agent performance baselines, optimization targets
- VulnIQ writes: vulnerability feeds, threat actor profiles, breach predictions
- Phantom writes: scam patterns, phishing URLs, deepfake signatures, broker behaviors

### Agent Store
Kova-built agents are available to all ecosystem products:
- Phantom uses: screening agents, engagement agents, management agents
- VulnIQ could use: scanning agents, analysis agents, reporting agents
- Custom agents built by users are shareable across products

## Integration Timeline

| Phase | Integration Level |
|-------|------------------|
| Phase 1 (M1-6) | **None** — Phantom built standalone. API contracts designed for future integration. |
| Phase 2 (M6-12) | **Minimal** — VulnIQ threat feed API (read-only). Phantom sends anonymized scam data. |
| Phase 3 (M12-18) | **Moderate** — Kova deploys Phantom agents. VulnIQ bidirectional. Shared threat store. |
| Phase 4 (M18-24) | **Full** — SSO, unified billing, agent marketplace, shared dashboards. |

## Business Synergies

### Cross-Sell
- VulnIQ enterprise customer → introduce Phantom for employee identity protection
- Phantom family user → introduce Kova for custom automation
- Kova developer → builds agents that run on Phantom's infrastructure

### Data Flywheel
More Phantom users → more threat data → better VulnIQ intelligence → better Phantom protection → more users. This is a compounding advantage that single-product competitors (Cloaked, Incogni, Aura) cannot replicate.

### Brand Positioning
The ecosystem positions the company as a comprehensive AI security platform, not just a privacy tool. This is a stronger narrative for enterprise sales, investor conversations, and media coverage.
