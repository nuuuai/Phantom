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

  const user = await prisma.user.upsert({
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

  const notifCount = await prisma.notification.count({
    where: { userId: user.id },
  });
  const seededDemoNotification = notifCount === 0;
  if (seededDemoNotification) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        layer: "shield",
        priority: "low",
        category: "system",
        title: "Welcome to Phantom (seed)",
        body: "Local dev account — open the dashboard to try inbox, broker scan, and vault.",
        linkTo: "/inbox",
      },
    });
  }

  for (const b of BROKER_CATALOG_SEED) {
    await prisma.dataBroker.upsert({
      where: { domain: b.domain },
      create: {
        name: b.name,
        domain: b.domain,
        category: b.category,
        removalMethod: b.removalMethod,
        avgRemovalDays: b.avgRemovalDays,
        removalUrl: b.removalUrl ?? null,
        removalNotes: b.removalNotes ?? null,
      },
      update: {
        name: b.name,
        category: b.category,
        removalMethod: b.removalMethod,
        avgRemovalDays: b.avgRemovalDays,
        removalUrl: b.removalUrl ?? null,
        removalNotes: b.removalNotes ?? null,
      },
    });
  }

  process.stdout.write(`Seed user: ${email} / ${password} (tier: free)\n`);
  process.stdout.write(`Seeded ${String(BROKER_CATALOG_SEED.length)} data brokers\n`);
  if (seededDemoNotification) {
    process.stdout.write("Seeded 1 demo notification (bell)\n");
  }
}

main()
  .catch((e: unknown) => {
    process.stderr.write(String(e) + "\n");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
