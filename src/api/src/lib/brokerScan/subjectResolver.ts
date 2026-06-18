import { prisma } from "../prisma.js";
import type { BrokerScanSubject } from "./brokerScanTypes.js";

function deriveSearchQueryFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const cleaned = local.replace(/[+._-]/g, " ").trim();
  if (cleaned.length >= 2) return cleaned;
  return "phantom user";
}

export async function resolveBrokerScanSubject(
  userId: string
): Promise<BrokerScanSubject> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, forwardToEmail: true },
  });
  if (!user) {
    return { searchQuery: "phantom user", hasEmail: false };
  }
  const email = user.forwardToEmail?.trim() || user.email;
  return {
    searchQuery: deriveSearchQueryFromEmail(email),
    hasEmail: email.includes("@"),
  };
}
