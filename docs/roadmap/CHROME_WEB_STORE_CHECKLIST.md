# Chrome Web Store — Phase 1 launch checklist

External blockers: developer account, review time, policy compliance, and **legal/DNS** items outside the repo. Use this before submitting the MV3 extension.

## External blockers (explicit)

| Blocker | Owner | Status in repo |
|---------|--------|----------------|
| Chrome Web Store **developer account** (one-time fee) | Product | Not included — register at [Chrome Web Store Developer Program](https://chrome.google.com/webstore/devconsole) |
| **Privacy policy** hosted at a stable HTTPS URL | Legal / ops | Must match extension data practices; linked from listing |
| **Terms of service** (if required for your jurisdiction) | Legal | Not in repo — add when launching publicly |
| **Production API + dashboard** on HTTPS with valid TLS | Infra | See [DEPLOYMENT.md](./DEPLOYMENT.md) |
| **DNS** for API and dashboard origins | Infra | Configure before `PLASMO_PUBLIC_API_URL` / `VITE_API_URL` |

## Account & packaging

- [ ] Chrome Web Store developer account registered (one-time fee).
- [ ] Extension built for production per [EXTENSION_STORE_BUILD.md](./EXTENSION_STORE_BUILD.md) (`chrome-mv3-prod`) with version bumped in `src/extension/package.json`.
- [ ] Icons and store listing assets (128×128 minimum; screenshots of core flows).
- [ ] Privacy policy URL hosted and referenced in the listing (must match data practices).

## Permissions & manifest

- [ ] `host_permissions` / `permissions` are minimal for current features (API origin + form detection).
- [ ] Justify any broad patterns (e.g. `https://*/*`) in the listing if retained.
- [ ] MV3 service worker lifecycle: no long-lived blocking work; background messaging documented.

## Privacy & security

- [ ] No collection of page content beyond what the privacy policy discloses.
- [ ] Tokens: refresh/access storage behavior documented (session vs local).
- [ ] Vault: client-side encryption story accurate for store text.

## QA before submit

- [ ] Smoke test on top sites (alias generate + autofill).
- [ ] API base URL configurable for staging vs prod (`PLASMO_PUBLIC_API_URL`).

Review can still reject for policy updates; plan a buffer after submission.
