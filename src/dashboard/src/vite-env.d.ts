/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string | undefined;
  readonly VITE_DEV_EMAIL: string | undefined;
  readonly VITE_DEV_PASSWORD: string | undefined;
  /** Optional public URL for the Chrome Web Store listing (defaults to the Web Store home). */
  readonly VITE_CWS_LISTING_URL: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
