// Loads repo-root `.env` before PrismaClient (same as prisma.config + API entry).
import "../src/loadRootEnv.js";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { BROKER_CATALOG_SEED } from "./brokerCatalogSeed.js";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = "dev@phantom.local";
  const password = "devpassword123";
  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      hashedPassword,
      tier: "free",
    },
    update: {
      hashedPassword,
    },
  });

  for (const b of BROKER_CATALOG_SEED) {
    await prisma.dataBroker.upsert({
      where: { domain: b.domain },
      create: {
        name: b.name,
        domain: b.domain,
        category: b.category,
        removalMethod: b.removalMethod,
        avgRemovalDays: b.avgRemovalDays,
      },
      update: {
        name: b.name,
        category: b.category,
        removalMethod: b.removalMethod,
        avgRemovalDays: b.avgRemovalDays,
      },
    });
  }

  process.stdout.write(`Seed user: ${email} / ${password} (tier: free)\n`);
  process.stdout.write(`Seeded ${String(BROKER_CATALOG_SEED.length)} data brokers\n`);
}

main()
  .catch((e: unknown) => {
    process.stderr.write(String(e) + "\n");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
