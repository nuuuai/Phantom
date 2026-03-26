import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

/**
 * Load the monorepo root `.env` (Phantom/.env) regardless of process cwd.
 * Used by the API entrypoint, Prisma config, and seed so `npm run -w @phantom/api`
 * scripts resolve DATABASE_URL / JWT_SECRET the same way.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..", "..");
config({ path: path.join(repoRoot, ".env") });
