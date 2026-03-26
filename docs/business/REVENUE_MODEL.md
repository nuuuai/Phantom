# Revenue Model

## Revenue Streams

### 1. Consumer Subscriptions (Primary — 70% of revenue)

The core revenue engine. Tiered subscription model: Free → Individual → Pro → Family.

**Unit Economics (Target):**
| Metric | Value |
|--------|-------|
| Customer Acquisition Cost (CAC) | $25 |
| Monthly ARPU (blended) | $12 |
| Annual ARPU | $144 |
| Gross margin | 75% |
| Monthly churn | 3% |
| Average lifetime | 33 months |
| LTV | $396 |
| LTV:CAC ratio | 15.8:1 |

**Acquisition Channels:**
- Free exposure scan (viral: "see who's selling your data")
- Scammer engagement transcript sharing (organic social)
- Content marketing (privacy guides, data broker exposés)
- Browser extension store listings (SEO for "privacy extension")
- Word of mouth (NPS target: 60+)
- Referral program ($5 credit per referral)

### 2. Enterprise Licensing (Secondary — 20% of revenue at scale)

Per-seat pricing for companies protecting employee identities and credentials.

**Target customers:** Mid-market companies (100-5000 employees) in regulated industries (finance, healthcare, legal, government).

**Pricing model:** Per-seat per month. Volume discounts at 100, 500, 1000 seats.

**Value proposition:** Employee credentials are a top attack vector. Phantom provides: unique aliases per employee per service, centralized credential management, breach monitoring across the organization, compliance reporting.

**Sales motion:** Product-led growth (individual employees use Phantom personally → introduce to IT/security team). Supplemented by outbound sales to CISOs.

### 3. Threat Intelligence API (Tertiary — 5% of revenue)

Monetized access to anonymized scam intelligence from the Scammer Engagement Engine and cross-user threat network.

**Target customers:**
- Telecom carriers (upstream spam/scam blocking)
- Financial institutions (fraud prevention)
- Law enforcement agencies (investigation support)
- Security vendors (threat feed enrichment)

**Data products:**
- Real-time scam campaign feed (new campaigns detected across user base)
- Scam script database (categorized, searchable)
- Deepfake voice pattern library
- Data broker behavior intelligence (which brokers re-list, sell to whom)
- Phone number reputation scores

**Pricing:** Annual subscription. $50K-$200K depending on data scope and volume.

### 4. Legal Revenue Share (Opportunistic — 5% of revenue)

For coordinated legal actions against data brokers who violate CCPA/GDPR.

**Model:**
1. Identify brokers that repeatedly re-list user data after valid removal requests
2. Aggregate affected users (with consent) for group legal demand
3. Partner with privacy-focused law firm
4. Revenue share on settlements (Phantom takes 15-25%)

**Volume:** As user base grows, the evidence base for legal action strengthens. At 100K users, the aggregate harm is substantial enough for meaningful settlements.

## Cost Structure

### Variable Costs (Scale with Users)

| Cost | Per User/Month | Notes |
|------|---------------|-------|
| Telephony (carrier numbers) | $2.00 | Per active phone alias |
| AI inference (Call Guard + SEE) | $0.50 | LLM API costs per screened call |
| Email forwarding | $0.10 | Per active email alias |
| VPN bandwidth | $0.30 | Per active VPN user |
| Data broker scanning | $0.20 | API fees + compute for scanning |
| Dark web monitoring | $0.15 | Third-party data feeds |
| Virtual card issuing | $0.50 | Per active card (issuer fees) |
| **Total variable** | **$3.75** | |

### Fixed Costs (Monthly)

| Cost | Monthly | Notes |
|------|---------|-------|
| Infrastructure (AWS) | $15,000 | Servers, databases, storage |
| Team (engineering, 10 people) | $150,000 | Average $180K salary loaded |
| Team (operations, 5 people) | $50,000 | Support, compliance, legal |
| Insurance coverage (AIG) | $10,000 | Scales with user base |
| Legal counsel | $10,000 | Privacy law, compliance |
| Tools and services | $5,000 | Monitoring, CI/CD, etc. |
| **Total fixed** | **$240,000** | |

### Margin Analysis

At 25,000 paid users ($12 ARPU):
- Revenue: $300,000/mo
- Variable costs: $93,750/mo (25K × $3.75)
- Fixed costs: $240,000/mo
- **Net: -$33,750/mo** (approaching breakeven)

At 50,000 paid users ($12 ARPU):
- Revenue: $600,000/mo
- Variable costs: $187,500/mo
- Fixed costs: $280,000/mo (some scaling)
- **Net: +$132,500/mo** (profitable)

**Breakeven target:** ~30,000 paid subscribers.

## Fundraising Considerations

If pursuing venture funding:

| Round | Timing | Amount | Use of Funds |
|-------|--------|--------|-------------|
| Pre-seed | Month 0 | $500K-$1M | Team (3-5 engineers), infrastructure, legal setup |
| Seed | Month 6 | $3M-$5M | Team expansion (10-15), carrier partnerships, marketing |
| Series A | Month 18 | $15M-$25M | Enterprise sales, international, mobile apps, team (30+) |

**Comparable:** Cloaked raised $375M at Series B with 350K paying customers. This suggests the market values privacy platforms at high multiples.
