import type { CopilotToolIntent } from "../types/copilotTools.js";

export function detectCopilotToolIntent(message: string): CopilotToolIntent | null {
  const normalized = message.trim().toLowerCase();
  if (!normalized) return null;

  if (
    /\b(run|start|trigger|launch)\b/.test(normalized) &&
    /\b(broker|brokers)\b/.test(normalized) &&
    /\bscan\b/.test(normalized)
  ) {
    return { toolId: "start_broker_scan" };
  }

  if (
    /\bbroker scan\b/.test(normalized) &&
    /\b(run|start|do|trigger)\b/.test(normalized)
  ) {
    return { toolId: "start_broker_scan" };
  }

  if (
    /\b(remove all|submit removals|request removals|opt out)\b/.test(normalized) &&
    /\bbroker/.test(normalized)
  ) {
    return { toolId: "request_broker_removals" };
  }

  if (/\brotate\b/.test(normalized) && /\b(alias|aliases)\b/.test(normalized)) {
    return { toolId: "rotate_alias" };
  }

  if (
    normalized.includes("rotate my") ||
    normalized.includes("rotation") ||
    (normalized.includes("rotate") &&
      (normalized.includes("compromised") || normalized.includes("warning")))
  ) {
    return { toolId: "rotate_alias" };
  }

  return null;
}
