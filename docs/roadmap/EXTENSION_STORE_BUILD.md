# Extension — store-ready build (Phase 1 / M8)

## User funnel (why this build matters)

Phantom’s Phase 1 journey is **alias → inbox → vault → broker scan → upgrade**; the extension closes the loop on **forms** (alias + password autofill). Ship the store zip only after dashboard onboarding and broker **first scan** flows are validated in staging (`QA_MANUAL.md`).

## Production build

From the **repository root** (so workspace dependencies resolve):

```bash
npm run build:extension:store
```

Equivalent to:

```bash
npm run build -w @phantom/shared
npm run build -w @phantom/extension
```

Plasmo writes the MV3 bundle under:

`src/extension/build/chrome-mv3-prod/`

(Dev builds use `chrome-mv3-dev/` — do not upload those to the store.)

**Verify output:** after a successful prod build, `manifest.json` must exist at:

`src/extension/build/chrome-mv3-prod/manifest.json`

**Artifact layout:** `chrome-mv3-prod/` also contains the service worker (`static/background/…`), popup/options HTML, and icons under `assets/` — zip **only** this folder’s contents for upload.

Store review expects the **zipped folder** to list `manifest.json` at the **root** of the archive (not nested under another directory).

## Background service worker (MV3)

- **Messaging:** `chrome.runtime.onMessage` handles login, logout, and alias generation; handlers return promptly (no long blocking loops).
- **Install / update:** `chrome.runtime.onInstalled` clears an invalid **`phantom_api_base_url`** override after **update** (safe migration).
- **Auth:** **`fetchAuth`** / **`refreshSession`** (see `src/extension/src/lib/apiClient.ts`) — offline → synthetic **`network_error`**; API **503** passed through; exponential backoff on **503/429** during refresh. Effective API base = optional **`chrome.storage.local`** override or build-time **`PLASMO_PUBLIC_API_URL`**.
- **Vault:** After login + vault unlock, **`pushVaultSyncFromExtension`** runs **best-effort** (IndexedDB ciphertext + session DEK per `vaultStorage`); failures are dev-logged only, never plaintext secrets.

## Production parity (extension)

| Check | Notes |
|-------|--------|
| `NODE_ENV` | CI/build usually sets production implicitly for `plasmo build`; local store builds should use production API URL in `PLASMO_PUBLIC_API_URL`. |
| API URL | Must be **HTTPS** in production. Set **`PLASMO_PUBLIC_API_URL`** at build time; users may override in **extension options** (stored in `chrome.storage.local`). Dashboard still uses **`CORS_ORIGIN`** for browser-origin requests. |
| Version | `version` in `src/extension/package.json` — increment for each CWS upload. |
| Full monorepo build | Root `npm run build` also builds shared + api + dashboard + extension; **store-only:** `npm run build:extension:store` (see root `package.json`). |

### Packaging for Chrome Web Store

Zip the **contents** of `chrome-mv3-prod` (the folder that contains `manifest.json` at its root), not the monorepo root.

**PowerShell (Windows):**

```powershell
Compress-Archive -Path "src/extension/build/chrome-mv3-prod/*" -DestinationPath "phantom-extension.zip" -Force
```

**Bash:**

```bash
(cd src/extension/build/chrome-mv3-prod && zip -r ../../../../phantom-extension.zip .)
```

Upload `phantom-extension.zip` in the Chrome Web Store Developer Dashboard.

## Required environment

Set in repo-root `.env` or CI secrets **before** `plasmo build`:

| Variable | Purpose |
|----------|---------|
| `PLASMO_PUBLIC_API_URL` | **HTTPS** origin of the Phantom API in production (e.g. `https://api.phantom.example`). Must match `CORS_ORIGIN` on the API. |

## Version

Bump `version` in `src/extension/package.json` before each store submission (Chrome Web Store requires monotonically increasing versions).

## Run 12 status (CWS packaging sprint)

| Status | Items |
|--------|--------|
| **Shipped (repo)** | Root **`npm run build:extension:store`** → **`src/extension/build/chrome-mv3-prod/`**; MV3 **`permissions`**: `storage`, `scripting` only; **`host_permissions`** documented in checklist; **options** page for API origin + validation; **`onInstalled`** clears bad override on update; **`0.1.0`** extension version. |
| **Blocked (external)** | Chrome Web Store developer account, **hosted privacy policy URL**, listing screenshots, final marketing copy. |
| **Next sprint** | Optional: stricter content-script **`matches`** if product adds an allowlist; optional Playwright smoke; strip **`http://localhost:8787/*`** from a production-only manifest variant if required by policy. |

## Pre-submit checks

- [ ] `manifest` permissions match [CHROME_WEB_STORE_CHECKLIST.md](./CHROME_WEB_STORE_CHECKLIST.md)
- [ ] Version bumped in `src/extension/package.json`
- [ ] Production API URL in `PLASMO_PUBLIC_API_URL` (not `http://localhost:8787` alone)
- [ ] Smoke test: login, generate alias, autofill on a known site
- [ ] Privacy policy URL ready for the listing

## Notes

- **Dev** `host_permissions` may include `http://localhost:8787/*` in `package.json` manifest overrides — for store review, use a production API URL and remove dev-only hosts if policy requires.
- See also root `run.ps1` for local dev orchestration (not used for store uploads).
