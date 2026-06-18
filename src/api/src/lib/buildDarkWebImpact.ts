import type { DarkWebImpactAnalysis } from "@phantom/shared";
import { buildDarkWebImpactAnalysis } from "@phantom/shared";
import { mapDarkWebFinding } from "./mapDarkWebFinding.js";
import { prisma } from "./prisma.js";

export async function buildDarkWebImpactForUser(
  userId: string
): Promise<DarkWebImpactAnalysis[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) return [];

  const [findings, aliases] = await Promise.all([
    prisma.darkWebFinding.findMany({
      where: { userId, status: "open" },
      orderBy: { detectedAt: "desc" },
      take: 20,
    }),
    prisma.alias.findMany({
      where: { userId, isActive: true },
      select: { type: true, value: true, healthStatus: true },
    }),
  ]);

  const aliasEmails = aliases
    .filter((a) => a.type === "email")
    .map((a) => a.value);
  const passwordAliasCount = aliases.filter((a) => a.type === "password").length;
  const compromisedAliasCount = aliases.filter(
    (a) => a.healthStatus === "compromised" || a.healthStatus === "quarantined"
  ).length;

  return findings.map((row) =>
    buildDarkWebImpactAnalysis({
      finding: mapDarkWebFinding(row),
      accountEmail: user.email,
      aliasEmails,
      passwordAliasCount,
      compromisedAliasCount,
    })
  );
}
