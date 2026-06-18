import type { PlasmoCSConfig } from "plasmo";
import { syncNativeInputAfterValueChange } from "../lib/nativeInputValue.js";
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
  if (/e[-_]?mail/i.test(text)) return "email";
  if (/user\s?name|login/i.test(text)) return "username";
  return null;
}

function collectFieldsInRoot(
  root: Document | ShadowRoot,
  seen: Set<Element>
): DetectedField[] {
  const fields: DetectedField[] = [];

  function add(el: Element, kind: DetectedField["kind"]) {
    if (seen.has(el) || !(el instanceof HTMLInputElement)) return;
    if (el.type === "hidden" || el.offsetParent === null) return;
    seen.add(el);
    fields.push({ element: el, kind });
  }

  for (const sel of EMAIL_SELECTORS) {
    root.querySelectorAll(sel).forEach((n) => add(n, "email"));
  }
  for (const sel of PASSWORD_SELECTORS) {
    root.querySelectorAll(sel).forEach((n) => add(n, "password"));
  }
  for (const sel of USERNAME_SELECTORS) {
    root.querySelectorAll(sel).forEach((n) => add(n, "username"));
  }

  root
    .querySelectorAll('input[type="text"]:not([data-phantom-shielded])')
    .forEach((el) => {
      if (seen.has(el) || !(el instanceof HTMLInputElement)) return;
      if (el.offsetParent === null) return;
      const kind = classifyByLabel(el);
      if (kind) add(el, kind);
    });

  return fields;
}

function collectOpenShadowRoots(root: ParentNode): ShadowRoot[] {
  const out: ShadowRoot[] = [];
  function walk(node: ParentNode) {
    node.querySelectorAll("*").forEach((el) => {
      if (el.shadowRoot) {
        out.push(el.shadowRoot);
        walk(el.shadowRoot);
      }
    });
  }
  walk(root);
  return out;
}

function collectFields(): DetectedField[] {
  const seen = new Set<Element>();
  const roots: (Document | ShadowRoot)[] = [document];
  collectOpenShadowRoots(document.documentElement).forEach((s) => {
    roots.push(s);
  });

  const byInput = new Map<HTMLInputElement, DetectedField>();
  for (const r of roots) {
    for (const f of collectFieldsInRoot(r, seen)) {
      byInput.set(f.element, f);
    }
  }
  return Array.from(byInput.values());
}

function createShieldIcon(field: DetectedField): HTMLDivElement {
  const host = document.createElement("div");
  host.setAttribute(PHANTOM_ATTR, "true");
  host.style.cssText = "pointer-events:auto;";

  const shadow = host.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = `
    :host { display:block; }
    .ph-shield-wrap { display:flex; flex-direction:column; align-items:flex-end; gap:4px; }
    .ph-shield {
      width:22px; height:22px; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      border-radius:4px; background:rgba(108,58,237,0.15);
      border:1px solid rgba(108,58,237,0.3);
      transition: background 150ms, border-color 150ms;
      margin:0; padding:0; font:inherit; color:inherit;
    }
    .ph-shield:hover {
      background:rgba(108,58,237,0.3);
      border-color:rgba(108,58,237,0.5);
    }
    .ph-shield[aria-busy="true"] { opacity:0.5; pointer-events:none; }
    .ph-shield svg { width:12px; height:12px; }
    .ph-shield-error {
      max-width:160px; font:11px/1.35 system-ui,sans-serif;
      color:#f87171; text-align:right;
    }
  `;
  shadow.appendChild(style);

  const errEl = document.createElement("div");
  errEl.className = "ph-shield-error";
  errEl.setAttribute("role", "status");
  errEl.setAttribute("aria-live", "polite");

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "ph-shield";
  btn.title = `Phantom: generate ${field.kind} alias`;
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;

  function showError(message: string): void {
    errEl.textContent = message;
    window.setTimeout(() => {
      errEl.textContent = "";
    }, 6000);
  }

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    errEl.textContent = "";
    btn.setAttribute("aria-busy", "true");
    const payload: BackgroundMessage = {
      type: MESSAGE_GENERATE_ALIAS,
      fieldKind: field.kind,
      siteHostname: window.location.hostname,
    };
    void chrome.runtime.sendMessage(payload).then((res: unknown) => {
      btn.removeAttribute("aria-busy");
      const result = res as
        | {
            ok: true;
            alias: {
              type: string;
              value: string;
              encryptedValue?: string | null;
            };
            plainValue?: string;
          }
        | { ok: false; error: string }
        | undefined;
      if (!result) {
        showError("No response from Phantom");
        return;
      }
      if (!result.ok) {
        showError(result.error);
        return;
      }
      if (
        field.kind === "password" &&
        result.alias.encryptedValue &&
        !result.plainValue
      ) {
        showError(
          "Unlock your vault (sign in with the same password) to autofill passwords."
        );
        return;
      }
      const fillValue = result.plainValue ?? result.alias.value;
      syncNativeInputAfterValueChange(field.element, fillValue);
    });
  });

  const wrap = document.createElement("div");
  wrap.className = "ph-shield-wrap";
  wrap.appendChild(btn);
  wrap.appendChild(errEl);
  shadow.appendChild(wrap);
  return host;
}

function positionShield(host: HTMLDivElement, input: HTMLInputElement) {
  const rect = input.getBoundingClientRect();
  host.style.position = "fixed";
  host.style.top = `${rect.top + (rect.height - 22) / 2}px`;
  host.style.left = `${rect.right - 28}px`;
  host.style.zIndex = "2147483647";
}

function repositionAllShields(): void {
  for (const [input, host] of shieldHosts) {
    if (document.contains(input) && input.offsetParent !== null) {
      positionShield(host, input);
    }
  }
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
  repositionAllShields();
});
window.addEventListener("scroll", () => {
  repositionAllShields();
}, true);

scanAndDecorate();
