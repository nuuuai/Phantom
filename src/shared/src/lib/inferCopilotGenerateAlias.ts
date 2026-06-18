import type { CopilotGenerateAliasParams } from "../types/copilotTools.js";
import { inferAliasCategory } from "./inferAliasCategory.js";

export type { CopilotGenerateAliasParams };

/** Parses natural-language alias creation requests for Copilot tool-use. */
export function inferCopilotGenerateAlias(
  message: string
): CopilotGenerateAliasParams | null {
  const normalized = message.trim().toLowerCase();
  if (!normalized) return null;

  const wantsAlias =
    /\b(create|generate|make|new|add)\b/.test(normalized) &&
    /\b(alias|aliases|email|username|disposable)\b/.test(normalized);

  if (!wantsAlias) return null;

  let type: CopilotGenerateAliasParams["type"] = "email";
  if (/\busername\b/.test(normalized)) type = "username";
  if (/\bphone\b/.test(normalized)) type = "phone";

  let category: CopilotGenerateAliasParams["category"] = "temp";
  if (/amazon|shop|store|shopping|retail|checkout/.test(normalized)) {
    category = "shopping";
  } else if (/bank|finance|paypal|stripe|card/.test(normalized)) {
    category = "finance";
  } else if (/linkedin|facebook|instagram|social|twitter/.test(normalized)) {
    category = "social";
  } else if (/work|slack|github|jira|office/.test(normalized)) {
    category = "work";
  } else if (/dating|tinder|bumble/.test(normalized)) {
    category = "dating";
  } else if (/newsletter|substack|mailing/.test(normalized)) {
    category = "newsletter";
  }

  let serviceName: string | undefined;
  const forMatch = normalized.match(/\bfor\s+([a-z0-9][a-z0-9.-]{1,48})/i);
  if (forMatch?.[1]) {
    serviceName = forMatch[1].replace(/\.$/, "");
    const inferred = inferAliasCategory(`https://${serviceName}.com`);
    if (inferred) category = inferred;
  }

  const serviceUrl = serviceName ? `https://${serviceName}.com` : undefined;

  return { type, category, serviceName, serviceUrl };
}
