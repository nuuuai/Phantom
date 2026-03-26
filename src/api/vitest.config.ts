import { defineConfig } from "vitest/config";

/** Matches `prisma.config.ts` placeholder so Prisma schema validation does not warn when `.env` is absent. */
const testDatabaseUrl =
  process.env.DATABASE_URL?.trim() ||
  "postgresql://phantom_placeholder:phantom_placeholder@127.0.0.1:5432/phantom_placeholder";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      DATABASE_URL: testDatabaseUrl,
    },
  },
});
