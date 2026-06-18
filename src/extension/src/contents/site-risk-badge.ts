import type { PlasmoCSConfig } from "plasmo";
import { matchSiteThreatPatterns } from "@phantom/shared";

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_idle",
};

const PHANTOM_RISK_ATTR = "data-phantom-site-risk";

/** Lightweight Brain badge — domain heuristics + threat intel patterns. */
function scoreDomain(hostname: string): { score: number; label: string } {
  const h = hostname.toLowerCase();
  if (/^(localhost|127\.)/.test(h) || h.endsWith(".phantom.local")) {
    return { score: 5, label: "local" };
  }
  if (/login|signin|account|secure|verify|bank|paypal|wallet/.test(h)) {
    return { score: 72, label: "sensitive" };
  }
  if (/\.(shop|store|buy|deal|discount)$/i.test(h)) {
    return { score: 38, label: "commerce" };
  }
  return { score: 18, label: "standard" };
}

function injectBadge(): void {
  if (document.documentElement.getAttribute(PHANTOM_RISK_ATTR)) return;
  const hostname = window.location.hostname;
  const { score, label } = scoreDomain(hostname);
  const threat = matchSiteThreatPatterns(hostname);

  const effectiveScore = threat
    ? Math.max(score, threat.severity === "critical" ? 85 : 65)
    : score;
  if (effectiveScore < 50 && !threat) return;

  document.documentElement.setAttribute(PHANTOM_RISK_ATTR, String(effectiveScore));

  const el = document.createElement("div");
  el.setAttribute("data-phantom-ui", "site-risk");
  el.textContent = threat
    ? `Phantom · ${threat.severity} threat pattern`
    : `Phantom · ${label} context (${String(score)})`;
  el.title = threat?.summary ?? "Phantom site context score";
  Object.assign(el.style, {
    position: "fixed",
    bottom: "12px",
    right: "12px",
    zIndex: "2147483646",
    maxWidth: "220px",
    padding: "6px 10px",
    borderRadius: "6px",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "10px",
    fontWeight: "600",
    letterSpacing: "0.04em",
    lineHeight: "1.35",
    color: effectiveScore >= 70 ? "#F87171" : "#A78BFA",
    background: "#15151a",
    border: "1px solid #222228",
    pointerEvents: "none",
    opacity: "0.92",
  } as CSSStyleDeclaration);
  document.body.appendChild(el);
}

if (document.body) {
  injectBadge();
} else {
  document.addEventListener("DOMContentLoaded", injectBadge, { once: true });
}
