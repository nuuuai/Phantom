import type { DarkWebSeverity } from "@prisma/client";
import { insertDarkWebFindingWithNotification } from "./darkWebIngest.js";

/** HIBP v3 breach object (subset). */
interface HibpBreach {
  Name: string;
  Title: string;
  BreachDate: string;
  Domain: string;
  DataClasses: string[];
}

function severityFromDataClasses(dataClasses: string[] | undefined): DarkWebSeverity {
  const dc = (dataClasses ?? []).map((s) => s.toLowerCase()).join(" ");
  if (dc.includes("password")) return "high";
  if (dc.includes("credit")) return "high";
  if (dc.includes("email")) return "medium";
  if (dc.includes("phone")) return "medium";
  return "low";
}

/** Mask account email for UI — never log the raw address. */
export function maskEmailForDisplay(email: string): string {
  const t = email.trim().toLowerCase();
  const at = t.indexOf("@");
  if (at <= 0) return "***";
  const local = t.slice(0, at);
  const domain = t.slice(at + 1);
  if (!domain) return "***";
  const head = local.slice(0, Math.min(1, local.length));
  return `${head}***@${domain}`;
}

/**
 * Calls Have I Been Pwned v3 for the account email when `DARK_WEB_HIBP_API_KEY` is set.
 * Does not claim marketplace monitoring — this is public breach corpus lookup only.
 */
export async function runHibpDarkWebRefresh(input: {
  userId: string;
  accountEmail: string;
}): Promise<{ inserted: number; skippedNoApiKey: boolean; message: string }> {
  const apiKey = process.env.DARK_WEB_HIBP_API_KEY?.trim();
  if (!apiKey) {
    return {
      inserted: 0,
      skippedNoApiKey: true,
      message:
        "Dark web refresh skipped: set DARK_WEB_HIBP_API_KEY to enable Have I Been Pwned breach lookup (see DEPLOYMENT.md).",
    };
  }

  const url = `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(input.accountEmail)}`;
  const res = await fetch(url, {
    headers: {
      "hibp-api-key": apiKey,
      "user-agent": "Phantom-API-DarkWeb/1",
    },
  });

  if (res.status === 404) {
    return {
      inserted: 0,
      skippedNoApiKey: false,
      message: "Have I Been Pwned: no known breaches for this account email.",
    };
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    return {
      inserted: 0,
      skippedNoApiKey: false,
      message: `Have I Been Pwned request failed (${String(res.status)}). ${errText ? "See API operator logs." : ""}`.trim(),
    };
  }

  const breaches = (await res.json()) as HibpBreach[];
  if (!Array.isArray(breaches) || breaches.length === 0) {
    return {
      inserted: 0,
      skippedNoApiKey: false,
      message: "No breach rows returned.",
    };
  }

  const idDisplay = maskEmailForDisplay(input.accountEmail);
  let inserted = 0;

  for (const b of breaches) {
    const dedupeKey = `hibp:${b.Name}`;
    const sev = severityFromDataClasses(b.DataClasses);
    const title = `Exposure: ${b.Title || b.Name}`;
    const summary = [
      `Source: Have I Been Pwned public breach dataset.`,
      b.BreachDate ? `Breach date: ${b.BreachDate}.` : "",
      b.Domain ? `Reported domain: ${b.Domain}.` : "",
      `Affected identifier (masked): ${idDisplay}.`,
    ]
      .filter(Boolean)
      .join(" ");

    const r = await insertDarkWebFindingWithNotification({
      userId: input.userId,
      severity: sev,
      title,
      summary,
      sourceLabel: "Have I Been Pwned",
      breachName: b.Name,
      identifierType: "email_address",
      identifierDisplay: idDisplay,
      recommendedAction:
        "If you reused passwords on the affected service, rotate them and enable MFA where available. Phantom never stores plaintext passwords for third-party sites.",
      detectedAt: new Date(),
      dedupeKey,
    });
    if (r.created) inserted += 1;
  }

  return {
    inserted,
    skippedNoApiKey: false,
    message: `Processed ${String(breaches.length)} breach record(s) from Have I Been Pwned; ${String(inserted)} new finding(s) stored.`,
  };
}
