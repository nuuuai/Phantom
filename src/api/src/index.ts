import "./loadRootEnv.js";
import { createApp } from "./app.js";

const port = Number(process.env.API_PORT ?? "8787");

async function assertDatabaseReachable(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    process.stderr.write(
      "phantom-api: DATABASE_URL is not set. Copy .env.example to the repo root .env and configure PostgreSQL, or start docker-compose for Postgres.\n"
    );
    process.exit(1);
  }
  try {
    const { prisma } = await import("./lib/prisma.js");
    await prisma.$connect();
  } catch (err) {
    process.stderr.write(
      `phantom-api: could not connect to the database (${err instanceof Error ? err.message : String(err)}). Check DATABASE_URL and that PostgreSQL is running.\n`
    );
    process.exit(1);
  }
}

const app = createApp();

void assertDatabaseReachable().then(() => {
  app.listen(port, () => {
    process.stdout.write(`phantom-api listening on ${port}\n`);
  });
});
