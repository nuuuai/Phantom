# Browser Extension — Architecture & UX

## Why the Extension Is Primary

The browser extension is Phantom's front door. Users live in browsers. Identity exposure happens at the moment of signup. The extension intercepts that moment and generates protection in real-time.

This is not a secondary companion — it IS the product for most daily interactions.

## Architecture (Manifest V3)

```
Extension Structure:
├── manifest.json          # Manifest V3 configuration
├── service-worker.js      # Background: API calls, encryption, state
├── content-scripts/
│   ├── form-detector.js   # Detects signup/login forms on any page
│   ├── autofill.js        # Fills forms with alias credentials
│   └── tracker-blocker.js # Blocks known tracking scripts
├── popup/
│   ├── Popup.tsx          # Quick alias generation, identity switching
│   └── styles.css         # Popup styling (minimal, <200ms load)
├── dashboard-tab/
│   └── index.html         # Opens full dashboard in new tab
├── shadow-dom/
│   └── injected-ui.tsx    # In-page UI (alias suggestions, warnings)
└── lib/
    ├── crypto.ts          # Client-side encryption (Web Crypto API)
    ├── vault.ts           # Encrypted IndexedDB operations
    └── api.ts             # Phantom API client
```

### Service Worker (Background)

The service worker is the brain of the extension:
- Handles ALL API communication (content scripts never call APIs directly)
- Manages encrypted credential cache in IndexedDB
- Processes messages from content scripts and popup
- Handles authentication token refresh
- Manages alias generation queue

### Content Scripts (Minimal)

Content scripts inject into web pages. They must be as small as possible:
- **Form Detector:** Identifies signup/login forms via heuristic analysis (input types, form structure, labels, button text). Sends detected fields to service worker.
- **Autofill:** Receives alias credentials from service worker, fills form fields. Uses Shadow DOM for any injected UI elements.
- **Tracker Blocker:** Blocks known tracking domains via declarativeNetRequest API.

### Popup UI

Quick-access interface. Must load in <200ms.

**Features:**
- One-click alias generation (email, phone, password)
- Identity context switcher (Shopping, Work, Personal, etc.)
- Current page alias status (is this site using a Phantom alias?)
- Quick risk score glance
- "Open Dashboard" button

**Rules:**
- No heavy frameworks in popup. Preact or vanilla React with minimal bundle.
- Popup state syncs with service worker, not its own API calls.
- No scrolling needed for primary actions.

### Injected UI (Shadow DOM)

When the extension detects a form, it injects a small UI element near the form fields:
- "Shield" icon next to email/phone fields
- Click to generate alias for that specific field
- Tooltip showing which alias is currently assigned to this site
- Warning badges for compromised aliases

**Critical rule:** Use Shadow DOM exclusively. Never inject CSS that could affect the host page.

## User Flows

### Flow 1: First Signup with Phantom

```
1. User installs extension
2. Extension onboarding: create account, set master passphrase
3. User visits any website
4. Navigates to signup form
5. Extension detects form → shows shield icon on email/phone fields
6. User clicks shield icon → popup: "Generate Phantom Identity for [site name]"
7. Selects category (Shopping / Social / etc.)
8. Click "Generate" → alias created → form autofilled
9. User completes signup with alias credentials
10. Extension stores alias in encrypted vault
```

### Flow 2: Returning to a Site

```
1. User visits site they previously signed up for with Phantom
2. Extension detects login form
3. Extension matches site URL to stored alias
4. Auto-fills email/username + password
5. If TOTP is required: auto-fills from stored TOTP seed
```

### Flow 3: Alias Compromise Alert

```
1. Brain detects alias health drop (spam spike / breach)
2. Service worker receives alert via WebSocket
3. Extension shows notification badge (red dot)
4. User clicks → "Your [service] alias may be compromised"
5. Options: "Rotate Now" / "View Details" / "Dismiss"
6. "Rotate Now" → generates new alias → optionally AutoCloaks at service
```

## Performance Targets

| Metric | Target |
|--------|--------|
| Popup load time | < 200ms |
| Alias generation (click to autofill) | < 500ms |
| Form detection | < 100ms after DOM ready |
| Extension memory footprint | < 50MB |
| Extension package size | < 5MB |
| Content script injection | < 50ms |

## Security

- Content scripts have minimal permissions (only form detection and autofill)
- Service worker handles all crypto operations (Web Crypto API)
- No plaintext credentials in content script memory
- CSP headers prevent injection attacks
- Extension requests minimal permissions (activeTab, storage, declarativeNetRequest)
- No access to browsing history, bookmarks, or downloads

## Multi-Browser Support

| Browser | Phase | Framework |
|---------|-------|-----------|
| Chrome | Phase 1 | Plasmo (Manifest V3) |
| Firefox | Phase 2 | Plasmo (Manifest V3 compatibility) |
| Safari | Phase 2 | Plasmo → Safari Web Extension converter |
| Edge | Phase 1 (free) | Chrome extension runs natively |
| Brave | Phase 1 (free) | Chrome extension runs natively |
