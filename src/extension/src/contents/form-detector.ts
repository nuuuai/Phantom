import type { PlasmoCSConfig } from "plasmo";
import {
  MESSAGE_FIELD_SCAN,
  type BackgroundMessage,
} from "../lib/messages";

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_idle",
};

function countRelevantFields(): { emailFields: number; passwordFields: number } {
  const emailSelectors = [
    'input[type="email"]',
    'input[autocomplete="email"]',
    'input[autocomplete="username"]',
  ];
  const passwordSelectors = [
    'input[type="password"]',
    'input[autocomplete="current-password"]',
    'input[autocomplete="new-password"]',
  ];

  const emailSet = new Set<Element>();
  const passwordSet = new Set<Element>();

  for (const selector of emailSelectors) {
    document.querySelectorAll(selector).forEach((node) => emailSet.add(node));
  }
  for (const selector of passwordSelectors) {
    document
      .querySelectorAll(selector)
      .forEach((node) => passwordSet.add(node));
  }

  return {
    emailFields: emailSet.size,
    passwordFields: passwordSet.size,
  };
}

function notifyFieldCounts(): void {
  const counts = countRelevantFields();
  if (counts.emailFields === 0 && counts.passwordFields === 0) {
    return;
  }
  const payload: BackgroundMessage = {
    type: MESSAGE_FIELD_SCAN,
    emailFields: counts.emailFields,
    passwordFields: counts.passwordFields,
  };
  void chrome.runtime.sendMessage(payload);
}

const observer = new MutationObserver(() => {
  notifyFieldCounts();
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

notifyFieldCounts();
