# Extension — store-ready build (Phase 1 / M8)

## Production build

From the repository root:

```bash
npm run build -w @phantom/shared
npm run build -w @phantom/extension
```

Plasmo outputs under `src/extension/build/chrome-mv3-prod/` (exact folder name may vary by Plasmo version). Use the generated bundle as the Chrome Web Store upload artifact (zip the **extension** directory contents, not the repo root).

## Required environment

| Variable | Purpose |
|----------|---------|
| `PLASMO_PUBLIC_API_URL` | **HTTPS** origin of the Phantom API in production (e.g. `https://api.phantom.example`). Must match CORS on the API. |

Set in `.env` at repo root or CI secrets before `plasmo build`.

## Pre-submit checks

- [ ] `manifest` permissions match [CHROME_WEB_STORE_CHECKLIST.md](./CHROME_WEB_STORE_CHECKLIST.md)
- [ ] Version bumped in `src/extension/package.json`
- [ ] Smoke test: login, generate alias, autofill on a known site
- [ ] Privacy policy URL ready for the listing

## Notes

- **Dev** builds may include `http://localhost:8787` in `host_permissions`; for store submission use a production API URL and trim dev-only hosts if policy requires.
