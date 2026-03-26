/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string | undefined;
  readonly VITE_DEV_EMAIL: string | undefined;
  readonly VITE_DEV_PASSWORD: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
