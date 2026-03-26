# Milestones & Success Metrics

## Critical Path Milestones

### Phase 1 (Months 1–6)

| Milestone | Target Date | Definition of Done |
|-----------|------------|-------------------|
| M1: Infrastructure Ready | Month 1 | API server, database, auth system deployed. CI/CD pipeline green. |
| M2: Vault Operational | Month 2 | Client-side encryption working. Extension ↔ dashboard vault sync. |
| M3: Extension MVP | Month 2 | Form detection, alias generation, autofill working on top 20 sites. |
| M4: Dashboard MVP | Month 3 | Login, alias list, alias detail, create/delete alias functional. |
| M5: Phone Aliases | Month 3 | VoIP numbers provisioned. Call/SMS forwarding working. |
| M6: Broker Scanner | Month 4 | 150+ brokers searchable. Scan results display in dashboard. |
| M7: Broker Removal | Month 5 | Automated removal for 50+ brokers. Manual guidance for rest. |
| M8: Free Tier Launch | Month 6 | Public launch. Extension in Chrome Web Store. Marketing begins. |
| M9: Paid Tier Launch | Month 6 | Payment integration. Paid features gated. Subscription management. |

### Phase 2 (Months 6–12)

| Milestone | Target Date | Definition of Done |
|-----------|------------|-------------------|
| M10: Brain v1 | Month 7 | Risk scoring, behavioral baseline, alias health monitoring live. |
| M11: Carrier Numbers | Month 8 | Tier-1 carrier integration. User migration from VoIP. |
| M12: Call Guard Live | Month 9 | AI call screening operational. <2s decision time. Transcripts in dashboard. |
| M13: SEE v1 | Month 9 | 3 personas deployed. Scam engagement working. Transcript viewer live. |
| M14: Threat Intel Network | Month 10 | Cross-user pattern detection. Pre-protection alerts. |
| M15: Virtual Cards | Month 11 | Card generation. Per-merchant cards. Extension autofill at checkout. |
| M16: Firefox/Safari | Month 12 | Extensions published. Cross-browser testing passed. |
| M17: 5K Paid Users | Month 12 | Revenue milestone. Product-market fit signal. |

### Phase 3 (Months 12–18)

| Milestone | Target Date | Definition of Done |
|-----------|------------|-------------------|
| M18: Autopilot Mode | Month 14 | Tiered autonomy. Auto-rotation. Breach auto-response. |
| M19: SEE v2 | Month 15 | 8+ personas. Gamification. Leaderboards. Social sharing. |
| M20: Deepfake Detection | Month 15 | Voice analysis in call pipeline. Confidence scores in transcripts. |
| M21: Family Center | Month 17 | Family accounts. Elder protection. Parental controls. |
| M22: NLI | Month 17 | Conversational interface in dashboard. Tool use for Phantom actions. |
| M23: 25K Paid Users | Month 18 | Scale milestone. Ready for mobile and enterprise. |

### Phase 4 (Months 18–24)

| Milestone | Target Date | Definition of Done |
|-----------|------------|-------------------|
| M24: iOS App | Month 20 | App Store published. Native call integration. Feature parity (core). |
| M25: Android App | Month 20 | Play Store published. Native call integration. Feature parity (core). |
| M26: Kova Integration | Month 21 | Agents deployed via Kova. Agent performance dashboard. |
| M27: VulnIQ Integration | Month 22 | Bidirectional threat intel. Shared dashboard. |
| M28: Enterprise v1 | Month 23 | Admin console. SSO. Bulk provisioning. First enterprise customer. |
| M29: International v1 | Month 24 | UK + Canada live. Localized brokers. Regional compliance. |
| M30: 100K Paid Users | Month 24 | Scale milestone. $5M+ ARR. |

## North Star Metrics

| Metric | What It Measures | Target (Month 24) |
|--------|-----------------|-------------------|
| **Active Aliases** | Product value (more aliases = more protection) | 2,000,000 |
| **Scammer Minutes Wasted** | Sword layer impact (time not spent scamming real people) | 500,000 total |
| **Data Broker Records Removed** | Shield layer effectiveness | 10,000,000 total |
| **Monthly Risk Score Improvement** | Brain layer value (users getting safer over time) | 70% of users improve |
| **Net Promoter Score** | User satisfaction and likelihood to recommend | 60+ |

## Guardrail Metrics (Never Let These Degrade)

| Metric | Threshold | Action if Breached |
|--------|-----------|-------------------|
| Alias generation latency | < 500ms p95 | Performance sprint |
| Call screening decision time | < 2s p95 | Infra scaling |
| False positive rate (call screening) | < 2% | Retrain model, raise thresholds |
| Vault encryption failures | 0 | Incident response, halt deploys |
| Dashboard uptime | > 99.5% | Infrastructure redundancy |
| Extension crash rate | < 0.1% | Hotfix release |
| User data exposure incidents | 0 | Full incident response |
