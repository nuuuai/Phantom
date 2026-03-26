# Extension — store-ready build (Phase 1 / M8)

## Production build

From the **repository root** (so workspace dependencies resolve):

```bash
npm run build -w @phantom/shared
npm run build -w @phantom/extension
```

Plasmo writes the MV3 bundle under:

`src/extension/build/chrome-mv3-prod/`

(Dev builds use `chrome-mv3-dev/` — do not upload those to the store.)

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

## Pre-submit checks

- [ ] `manifest` permissions match [CHROME_WEB_STORE_CHECKLIST.md](./CHROME_WEB_STORE_CHECKLIST.md)
- [ ] Version bumped in `src/extension/package.json`
- [ ] Production API URL in `PLASMO_PUBLIC_API_URL` (not `http://localhost:8787` alone)
- [ ] Smoke test: login, generate alias, autofill on a known site
- [ ] Privacy policy URL ready for the listing

## Notes

- **Dev** `host_permissions` may include `http://localhost:8787/*` in `package.json` manifest overrides — for store review, use a production API URL and remove dev-only hosts if policy requires.
- See also root `run.ps1` for local dev orchestration (not used for store uploads).
