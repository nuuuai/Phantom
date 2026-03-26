import "./src/loadRootEnv.js";
import { defineConfig } from "prisma/config";

/**
 * Env: repo root `.env` via `./src/loadRootEnv.js` (same as API + seed).
 * `prisma generate` must succeed without a real DB (e.g. CI install); placeholder below if unset.
 */
if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL =
    "postgresql://phantom_placeholder:phantom_placeholder@127.0.0.1:5432/phantom_placeholder";
}

/**
 * Prisma 6: connection URL stays in `prisma/schema.prisma` (`env("DATABASE_URL")`).
 * This file replaces deprecated `package.json#prisma` for schema path, migrations, and seed.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
