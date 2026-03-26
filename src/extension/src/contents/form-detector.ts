import type { PlasmoCSConfig } from "plasmo";
import {
  MESSAGE_FIELD_SCAN,
  MESSAGE_GENERATE_ALIAS,
  type BackgroundMessage,
} from "../lib/messages";

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_idle",
};

interface DetectedField {
  element: HTMLInputElement;
  kind: "email" | "password" | "username";
}

const PHANTOM_ATTR = "data-phantom-shielded";

const EMAIL_SELECTORS = [
  'input[type="email"]',
  'input[autocomplete="email"]',
  'input[autocomplete="username"]',
  'input[name*="email" i]',
  'input[id*="email" i]',
  'input[placeholder*="email" i]',
];

const PASSWORD_SELECTORS = [
  'input[type="password"]',
  'input[autocomplete="current-password"]',
  'input[autocomplete="new-password"]',
];

const USERNAME_SELECTORS = [
  'input[name*="user" i]:not([type="hidden"]):not([type="email"])',
  'input[id*="user" i]:not([type="hidden"]):not([type="email"])',
  'input[autocomplete="username"]:not([type="email"])',
  'input[name*="login" i]:not([type="hidden"])',
];

function labelTextFor(el: HTMLInputElement): string {
  if (el.id) {
    const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (label) return (label.textContent ?? "").toLowerCase().trim();
  }
  const parent = el.closest("label");
  if (parent) return (parent.textContent ?? "").toLowerCase().trim();
  return "";
}

function classifyByLabel(el: HTMLInputElement): "email" | "username" | null {
  const text = labelTextFor(el);
  if (!text) return null;
  if (/e[\-_]?mail/i.test(text)) return "email";
  if (/user\s?name|login/i.test(text)) return "username";
  return null;
}

function collectFields(): DetectedField[] {
  const seen = new Set<Element>();
  const fields: DetectedField[] = [];

  function add(el: Element, kind: DetectedField["kind"]) {
    if (seen.has(el) || !(el instanceof HTMLInputElement)) return;
    if (el.type === "hidden" || el.offsetParent === null) return;
    seen.add(el);
    fields.push({ element: el, kind });
  }

  for (const sel of EMAIL_SELECTORS) {
    document.querySelectorAll(sel).forEach((n) => add(n, "email"));
  }
  for (const sel of PASSWORD_SELECTORS) {
    document.querySelectorAll(sel).forEach((n) => add(n, "password"));
  }
  for (const sel of USERNAME_SELECTORS) {
    document.querySelectorAll(sel).forEach((n) => add(n, "username"));
  }

  document
    .querySelectorAll('input[type="text"]:not([data-phantom-shielded])')
    .forEach((el) => {
      if (seen.has(el) || !(el instanceof HTMLInputElement)) return;
      if (el.offsetParent === null) return;
      const kind = classifyByLabel(el);
      if (kind) add(el, kind);
    });

  return fields;
}

function createShieldIcon(field: DetectedField): HTMLDivElement {
  const host = document.createElement("div");
  host.setAttribute(PHANTOM_ATTR, "true");
  host.style.cssText =
    "position:absolute;z-index:2147483647;pointer-events:auto;";

  const shadow = host.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = `
    :host { display:block; }
    .ph-shield {
      width:22px; height:22px; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      border-radius:4px; background:rgba(108,58,237,0.15);
      border:1px solid rgba(108,58,237,0.3);
      transition: background 150ms, border-color 150ms;
    }
    .ph-shield:hover {
      background:rgba(108,58,237,0.3);
      border-color:rgba(108,58,237,0.5);
    }
    .ph-shield svg { width:12px; height:12px; }
  `;
  shadow.appendChild(style);

  const btn = document.createElement("div");
  btn.className = "ph-shield";
  btn.title = `Phantom: generate ${field.kind} alias`;
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const payload: BackgroundMessage = { type: MESSAGE_GENERATE_ALIAS };
    void chrome.runtime.sendMessage(payload).then((res: unknown) => {
      const result = res as
        | { ok: true; alias: { type: string; value: string } }
        | { ok: false; error: string }
        | undefined;
      if (!result?.ok) return;
      if (!result) return;
      field.element.value = result.alias.value;
      field.element.dispatchEvent(new Event("input", { bubbles: true }));
      field.element.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });

  shadow.appendChild(btn);
  return host;
}

function positionShield(host: HTMLDivElement, input: HTMLInputElement) {
  const rect = input.getBoundingClientRect();
  host.style.top = `${window.scrollY + rect.top + (rect.height - 22) / 2}px`;
  host.style.left = `${window.scrollX + rect.right - 28}px`;
}

const shieldHosts = new Map<HTMLInputElement, HTMLDivElement>();

function attachShields() {
  const fields = collectFields();

  for (const [input, host] of shieldHosts) {
    if (!document.contains(input) || input.offsetParent === null) {
      host.remove();
      shieldHosts.delete(input);
    }
  }

  for (const f of fields) {
    if (shieldHosts.has(f.element)) {
      positionShield(shieldHosts.get(f.element)!, f.element);
      continue;
    }
    const host = createShieldIcon(f);
    document.body.appendChild(host);
    positionShield(host, f.element);
    shieldHosts.set(f.element, host);
    f.element.setAttribute(PHANTOM_ATTR, "true");
  }
}

function notifyFieldCounts(): void {
  const fields = collectFields();
  const emailFields = fields.filter(
    (f) => f.kind === "email" || f.kind === "username"
  ).length;
  const passwordFields = fields.filter((f) => f.kind === "password").length;

  if (emailFields === 0 && passwordFields === 0) return;

  const payload: BackgroundMessage = {
    type: MESSAGE_FIELD_SCAN,
    emailFields,
    passwordFields,
  };
  void chrome.runtime.sendMessage(payload);
}

function scanAndDecorate() {
  notifyFieldCounts();
  attachShields();
}

const observer = new MutationObserver(() => {
  scanAndDecorate();
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

window.addEventListener("resize", () => {
  for (const [input, host] of shieldHosts) {
    positionShield(host, input);
  }
});

scanAndDecorate();
