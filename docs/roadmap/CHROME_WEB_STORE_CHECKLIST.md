# Chrome Web Store — Phase 1 launch checklist

External blockers: developer account, review time, and policy compliance. Use this before submitting the MV3 extension.

## Account & packaging

- [ ] Chrome Web Store developer account registered (one-time fee).
- [ ] Extension built for production (`plasmo build` / CI artifact) with version bumped in `package.json`.
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
