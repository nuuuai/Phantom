# Chrome Web Store — Phase 1 launch checklist

External blockers: developer account, review time, policy compliance, and **legal/DNS** items outside the repo. Use this before submitting the MV3 extension.

**Run 10 verification (repo):** `src/extension/package.json` → Plasmo **`manifest`** merges to **`src/extension/build/chrome-mv3-prod/manifest.json`** after **`npm run build:extension:store`**. Last pass: **`manifest_version` 3**; **`permissions`**: `storage`, `scripting` only; **`host_permissions`**: `https://*/*`, `http://localhost:8787/*`; **`content_scripts`**: `matches` **`<all_urls>`**, **`run_at`**: `document_idle`; **`background.service_worker`** present. No **`tabs`** / **`activeTab`**. Store listing must justify **`https://*/*`** (autofill on arbitrary HTTPS origins).

## External blockers (explicit)

| Blocker | Owner | Status in repo |
|---------|--------|----------------|
| Chrome Web Store **developer account** (one-time fee) | Product | Not included — register at [Chrome Web Store Developer Program](https://chrome.google.com/webstore/devconsole) |
| **Privacy policy** hosted at a stable HTTPS URL | Legal / ops | Must match extension data practices; linked from listing |
| **Terms of service** (if required for your jurisdiction) | Legal | Not in repo — add when launching publicly |
| **Production API + dashboard** on HTTPS with valid TLS | Infra | See [DEPLOYMENT.md](./DEPLOYMENT.md) and [INFRA_AWS_PHASE1.md](./INFRA_AWS_PHASE1.md) |
| **DNS** for API and dashboard origins | Infra | Configure before `PLASMO_PUBLIC_API_URL` / `VITE_API_URL` |

## Account & packaging

- [ ] Chrome Web Store developer account registered (one-time fee).
- [ ] Extension built for production per [EXTENSION_STORE_BUILD.md](./EXTENSION_STORE_BUILD.md): from repo root run **`npm run build:extension:store`** (see root `package.json` — builds shared + extension only). Output: **`src/extension/build/chrome-mv3-prod/`** with version bumped in `src/extension/package.json`.
- [ ] Confirm `src/extension/build/chrome-mv3-prod/manifest.json` exists after build; zip **contents** of that folder (not the repo root).
- [ ] Icons and store listing assets (128×128 minimum; screenshots of core flows).
- [ ] Privacy policy URL hosted and referenced in the listing (must match data practices).

## Permissions & manifest

- [ ] `host_permissions` / `permissions` are minimal for current features (API origin + form detection).
- [ ] Justify any broad patterns (e.g. `https://*/*`) in the listing if retained.
- [ ] MV3 service worker lifecycle: no long-lived blocking work; background messaging documented.

### Permissions justification (repo)

Declared in `src/extension/package.json` under Plasmo `manifest` (merged into `build/chrome-mv3-prod/manifest.json`).

| Entry | Why it stays |
|-------|----------------|
| **`storage`** | Session tokens (`chrome.storage.local`), optional API base URL override (`phantom_api_base_url`), vault-related keys per `storage.ts` / `vaultStorage`. |
| **`scripting`** | Inject / manage content scripts for form detection and the shield UI (`src/extension/src/contents/`). |
| **`host_permissions`: `https://*/*`** | **HTTPS** pages where the user may generate aliases and autofill; required for content scripts and `fetch` to arbitrary HTTPS APIs the user configures (prod API host). Narrowing to a single production API origin only would break autofill on third-party sites — keep and justify in the store listing. |
| **`host_permissions`: `http://localhost:8787/*`** | Local development against the default API; omit from a strictly production-only build if policy requires (then use staging HTTPS only). |

**Removed:** `tabs` — not used by the codebase (MV3 review: least privilege).

**Not used:** `activeTab` — product uses persistent content injection on form pages; `activeTab` alone is insufficient for that model.

**Content scripts:** Plasmo emits **`matches`: `<all_urls>`** for `form-detector` (see prod `manifest.json`). Only the **bundled** script runs (no remote code). Narrowing to a site allowlist would break “generate alias on any signup form” — justify in the listing or add an optional future allowlist mode.

### Shadow DOM / iframe limits (known)

The shield UI uses a closed Shadow DOM on detected inputs. **No extra timeboxed fixes** in this sprint: nested **cross-origin iframes**, **closed** shadow trees above the field, or sites that block scripting may prevent detection or fill. Document for support; full matrix is Phase 2+ hardening.

## Privacy & security

- [ ] No collection of page content beyond what the privacy policy discloses.
- [ ] Tokens: refresh/access storage behavior documented (session vs local).
- [ ] Vault: client-side encryption story accurate for store text.

## QA before submit

- [ ] Repo CI green: use the **exact step order** in [`DEPLOYMENT.md`](./DEPLOYMENT.md) **§ CI** — `npm ci` → migrate → **seed** → **`npm run lint`** → **`npm run test`** → **`npm run build`** — matches [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) so integration tests that need **`DataBroker`** rows run in CI.
- [ ] Smoke test on top sites (alias generate + autofill).
- [ ] API base URL configurable for staging vs prod (`PLASMO_PUBLIC_API_URL` and/or extension Options).

## Store listing copy (paste into CWS; privacy policy URL is external)

**Short description (example):** Phantom generates privacy-friendly email aliases and helps you autofill them on sign-up forms — with optional vault-backed passwords. Connects to your Phantom account over HTTPS.

**Long description (one paragraph):** Phantom is the Shield layer for Phantom accounts: sign in with your Phantom email and password, generate aliases from the toolbar or inline on forms, and sync your encrypted vault when unlocked. The extension only talks to the API origin you configure (build-time default or Options). It does not execute remote code, load third-party scripts into pages beyond the bundled content script, or send page HTML to Phantom unless you use features that explicitly require server interaction (e.g. alias generation). Review the hosted privacy policy for full data practices.

Review can still reject for policy updates; plan a buffer after submission.
