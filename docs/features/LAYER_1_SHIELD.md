# Layer 1 — The Shield (Defensive Privacy)

## Purpose

Table-stakes privacy features that users expect on day one. This layer matches and exceeds Cloaked's offering. It's the foundation everything else builds on.

## Features

### 1.1 Identity Alias Generation

Generate unlimited email addresses, phone numbers, usernames, and passwords. Each alias is a fully functional identity with its own inbox, call routing, and credential storage.

**User Flow (Browser Extension):**
1. User visits any signup/login form
2. Extension detects form fields (email, phone, password, name)
3. Popup offers "Generate Phantom Identity"
4. User clicks → alias generated in <500ms → form autofilled
5. Alias stored in vault with metadata: service name, creation date, category

**Alias Types:**

| Type | Implementation | Example |
|------|---------------|---------|
| Email | Custom domain aliases (@phantom.id, etc.) | `user7xk@phantom.id` |
| Phone | Carrier-grade numbers (tier-1 carrier) | `+1 (555) 234-8901` |
| Username | AI-generated contextual usernames | `shade_buyer_7x` |
| Password | Cryptographically random, configurable | `kT9!mR2@pL5$nW8` |

**Alias Categories:** Shopping, Social Media, Finance, Work, Dating, Newsletters, Temporary. Each category can have its own forwarding rules and retention policy.

**Data Poisoning:** Assign one phone number to multiple users, route based on caller target. Data aggregators see the same number tied to many people, breaking individual targeting.

### 1.2 Virtual Payment Cards

Per-merchant virtual Mastercard/Visa cards. Merchants never see your real card.

- Generate unlimited virtual cards
- Single-use cards (auto-deactivate after one charge)
- Recurring cards (locked to specific merchant)
- Spending limits per card, instant freeze/unfreeze
- Transaction notifications in dashboard
- Auto-close cards for cancelled subscriptions

**Implementation:** Partnership with card issuer (Marqeta, Stripe Issuing, or similar).

### 1.3 Data Broker Removal

Automated scanning and removal from 300+ data broker and people-search sites.

**Process:**
1. **Scan** — Search 300+ brokers for name, phone, email, address variations
2. **Remove** — Automated opt-out requests (API or browser automation)
3. **Verify** — Follow-up scan 7-30 days later
4. **Monitor** — Re-scan every 14 days per broker
5. **Escalate** — CCPA/GDPR violation notices for repeat offenders

### 1.4 Dark Web & SSN Monitoring

24/7 scanning of dark web marketplaces, paste sites, breach databases. Monitors: SSN, emails, phones, credit cards, addresses, ID numbers.

### 1.5 VPN

Built-in encrypted tunnel. Differentiator: exit node automatically changes based on which alias identity is active.

### 1.6 eSIM Profiles

Multiple carrier-grade eSIM phone numbers per device. Use cases: work, personal, dating, travel, shopping.

### 1.7 Password Manager

Generate, store, autofill passwords. Import from 1Password, LastPass, Bitwarden. TOTP/2FA support. Passwords are tied to aliases — when an alias rotates, its password rotates too.

### 1.8 Identity Theft Insurance

Up to $1M coverage for financial losses, legal fees, recovery costs. Included with all paid plans.

## Phase 1 Deliverables (Months 1-6)

- [x] Email alias generation
- [x] Phone alias generation (VoIP bridge initially, carrier-grade Phase 2)
- [x] Password generation and storage
- [x] Data broker scan (free) + removal (paid, 150+ brokers)
- [x] Browser extension with autofill
- [x] Web dashboard alias management
- [ ] Virtual cards → Phase 2
- [ ] VPN → Phase 2
- [ ] eSIM → Phase 3
- [ ] Insurance → Phase 2
