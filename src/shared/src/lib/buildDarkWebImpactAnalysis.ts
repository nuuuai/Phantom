import type { DarkWebFindingPublic } from "../types/darkWebFinding.js";
import type { DarkWebImpactAnalysis, DarkWebImpactLink } from "../types/darkWebImpact.js";

export type { DarkWebImpactAnalysis, DarkWebImpactLink };

export interface DarkWebImpactInput {
  finding: DarkWebFindingPublic;
  accountEmail: string;
  aliasEmails: readonly string[];
  passwordAliasCount: number;
  compromisedAliasCount: number;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Match masked HIBP-style display (e.g. `j***@example.com`) to a known email. */
function maskedEmailMatches(display: string, email: string): boolean {
  const norm = normalizeEmail(email);
  const disp = normalizeEmail(display);
  if (disp === norm) return true;

  const at = disp.indexOf("@");
  if (at <= 0) return false;
  const dispLocal = disp.slice(0, at);
  const dispDomain = disp.slice(at + 1);

  const emailAt = norm.indexOf("@");
  if (emailAt <= 0) return false;
  const local = norm.slice(0, emailAt);
  const domain = norm.slice(emailAt + 1);

  if (dispDomain !== domain) return false;
  if (dispLocal.includes("*")) {
    const prefix = dispLocal.replace(/\*+/g, "");
    return prefix.length > 0 && local.startsWith(prefix);
  }
  return false;
}

function identifierLooksLikePassword(type: string, title: string, summary: string): boolean {
  const blob = `${type} ${title} ${summary}`.toLowerCase();
  return (
    blob.includes("password") ||
    blob.includes("credential") ||
    blob.includes("hash")
  );
}

/** Cross-links a breach finding to account email, aliases, and vault posture. */
export function buildDarkWebImpactAnalysis(
  input: DarkWebImpactInput
): DarkWebImpactAnalysis {
  const { finding } = input;
  const links: DarkWebImpactLink[] = [];
  let impactScore = finding.severity === "critical" ? 70 : finding.severity === "high" ? 55 : finding.severity === "medium" ? 40 : 25;

  const accountHit = maskedEmailMatches(finding.identifierDisplay, input.accountEmail);
  if (accountHit) {
    links.push({
      type: "account_email",
      label: "Primary account email",
      detail: "This breach matches your Phantom login email — rotate passwords on services that reuse it.",
      href: "/settings",
    });
    impactScore += 15;
  }

  const matchedAliases = input.aliasEmails.filter((alias) =>
    maskedEmailMatches(finding.identifierDisplay, alias)
  );
  if (matchedAliases.length > 0) {
    links.push({
      type: "alias_email",
      label: "Alias email overlap",
      detail: `${String(matchedAliases.length)} alias email(s) may share this exposure — review alias health and rotate if reused elsewhere.`,
      href: "/aliases",
    });
    impactScore += 12 * Math.min(matchedAliases.length, 3);
  }

  const passwordRisk = identifierLooksLikePassword(
    finding.identifierType,
    finding.title,
    finding.summary
  );
  if (passwordRisk || finding.identifierType.toLowerCase().includes("password")) {
    links.push({
      type: "password_risk",
      label: "Password exposure",
      detail:
        input.passwordAliasCount > 0
          ? "Run a vault breach check — exposed passwords may be reused across saved logins."
          : "Add site passwords to your vault, then run a breach check to measure reuse risk.",
      href: "/vault",
    });
    impactScore += passwordRisk ? 18 : 10;
  }

  if (input.compromisedAliasCount > 0) {
    links.push({
      type: "alias_health",
      label: "Compromised aliases",
      detail: `${String(input.compromisedAliasCount)} alias(es) already in critical state — prioritize rotation alongside breach response.`,
      href: "/aliases",
    });
    impactScore += 8;
  }

  impactScore = Math.min(100, impactScore);

  const headline =
    links.length > 0
      ? `${String(links.length)} linked identity surface(s) affected`
      : "No direct alias overlap detected — still review recommended actions";

  const remediationSteps: string[] = [finding.recommendedAction];
  if (passwordRisk) {
    remediationSteps.push("Unlock vault and run the client-side breach check on saved passwords.");
  }
  if (matchedAliases.length > 0 || accountHit) {
    remediationSteps.push("Rotate affected email aliases and update forward rules on linked services.");
  }
  if (input.compromisedAliasCount > 0) {
    remediationSteps.push("Rotate compromised aliases before dismissing this finding.");
  }
  remediationSteps.push("Dismiss only after passwords are rotated and aliases updated.");

  return {
    findingId: finding.id,
    severity: finding.severity,
    impactScore,
    headline,
    links,
    remediationSteps,
  };
}
