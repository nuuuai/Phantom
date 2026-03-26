import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEscapeKey } from "@/hooks/useEscapeKey.js";
import { useRestoreFocusToMainOnClose } from "@/hooks/useRestoreFocusToMainOnClose.js";
import {
  DASHBOARD_PATHS,
  chromeWebStoreHref,
} from "@/lib/dashboardRoutes.js";

const STORAGE_KEY = "phantom_onboarding_complete";

const STEPS = [
  {
    title: "Welcome to Phantom",
    body: "Your privacy command center. Phantom shields your real identity across the web with disposable aliases, encrypted credential storage, and automated data broker removal.",
    cta: "Get started",
  },
  {
    title: "Install the Chrome extension",
    body: "Add Phantom to your browser first so shields and autofill work on real signup forms. Use the store listing when live, or load an unpacked build from this repo for development.",
    cta: "Next",
  },
  {
    title: "Sign in to Phantom",
    body: "Open the extension popup (puzzle icon → find Phantom → Pin so it stays next to the address bar in Chrome), then sign in with your Phantom account. Manifest V3: the popup is the primary UI — there is no separate background page for login.",
    cta: "Next",
  },
  {
    title: "Generate your first alias",
    body: "With a signed-in session, use the extension on a form field or open the Aliases page in this dashboard. Create a disposable email, username, or phone alias — use it for signups instead of your real info.",
    cta: "Next",
    link: DASHBOARD_PATHS.aliases,
  },
  {
    title: "Check your alias inbox",
    body: "When inbound mail is wired (DNS/MX + worker), forwarded mail appears in the Phantom inbox. Open it from the sidebar or when a notification links there.",
    cta: "Next",
    link: DASHBOARD_PATHS.inbox,
  },
  {
    title: "Secure your passwords",
    body: "The Vault generates strong passwords and encrypts them on your device before storing. The server never sees your plaintext credentials.",
    cta: "Next",
    link: DASHBOARD_PATHS.vault,
  },
  {
    title: "Scan for data brokers",
    body: "Run an exposure scan to discover which data brokers are selling your personal information — then remove yourself.",
    cta: "Next",
    link: DASHBOARD_PATHS.brokers,
  },
  {
    title: "Phantom Pro (optional)",
    body: "Free tier includes exposure scans and DIY opt-out links. Upgrade for simulated removal queue, unlimited aliases, dark web breach checks (HIBP when your operator configures the API key), and billing in one place.",
    cta: "Done",
    link: DASHBOARD_PATHS.billing,
  },
] as const;

function isOnboardingComplete(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function markOnboardingComplete(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // storage not available
  }
}

export function OnboardingModal() {
  const [open, setOpen] = useState(() => !isOnboardingComplete());
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const primaryRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    markOnboardingComplete();
    setOpen(false);
  }, []);

  const advance = useCallback(() => {
    const s = STEPS[step] as (typeof STEPS)[number] & { link?: string };
    if (s?.link) void navigate(s.link);
    if (step >= STEPS.length - 1) {
      close();
    } else {
      setStep((prev) => prev + 1);
    }
  }, [step, close, navigate]);

  const goBack = useCallback(() => {
    setStep((prev) => Math.max(0, prev - 1));
  }, []);

  useEscapeKey(open, close);
  useRestoreFocusToMainOnClose(open);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => {
      primaryRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [open, step]);

  if (!open) return null;

  const current = STEPS[step];
  if (!current) return null;

  const cwsUrl = chromeWebStoreHref();
  const installStepIndex = 1;
  const billingStepIndex = STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        key="onboarding-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <motion.div
          key={step}
          role="dialog"
          aria-modal="true"
          aria-labelledby="phantom-onboarding-title"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 24, stiffness: 300 }}
          className="flex w-full max-w-md flex-col rounded-xl border border-ph-border bg-ph-surface shadow-2xl"
        >
          <div className="flex max-h-[min(90vh,620px)] min-h-0 flex-col p-6">
            <div className="flex shrink-0 items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-ph-accent-light">
                Step {step + 1} of {STEPS.length}
              </span>
              <button
                type="button"
                onClick={close}
                className="cursor-pointer font-sans text-xs text-ph-text-ghost hover:text-ph-text-tertiary"
              >
                Skip
              </button>
            </div>
            <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
              <h2
                id="phantom-onboarding-title"
                className="font-sans text-base font-semibold text-ph-text-primary"
              >
                {current.title}
              </h2>
              <p className="mt-2 font-sans text-[13px] leading-relaxed text-ph-text-tertiary">
                {current.body}
              </p>
              {step === billingStepIndex ? (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      void navigate(DASHBOARD_PATHS.billing);
                      close();
                    }}
                    className="w-full rounded-md border border-ph-accent-border bg-[#6C3AED15] px-4 py-2.5 font-sans text-xs font-medium text-ph-accent-light hover:bg-[#6C3AED25] focus:outline-none focus-visible:ring-2 focus-visible:ring-ph-accent/50"
                  >
                    Open billing (same as upgrade elsewhere)
                  </button>
                  <p className="mt-2 font-sans text-[11px] text-ph-text-muted">
                    Complete Checkout on the Billing page when Stripe keys are
                    configured. Removal queue remains simulated in Phase 1.
                  </p>
                </div>
              ) : null}
              {step === installStepIndex ? (
                <div className="mt-4 space-y-3 rounded-lg border border-ph-border bg-ph-raised/50 px-3 py-3 font-sans text-[12px] leading-relaxed text-ph-text-tertiary">
                  <p>
                    <span className="font-medium text-ph-text-secondary">
                      Store:
                    </span>{" "}
                    When the listing is live, install from the{" "}
                    <a
                      href={cwsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ph-accent-light underline hover:text-ph-accent"
                    >
                      Chrome Web Store
                    </a>
                    . Until then, use your team&apos;s published link or search
                    the store for Phantom.
                  </p>
                  <p>
                    <span className="font-medium text-ph-text-secondary">
                      Dev:
                    </span>{" "}
                    Run{" "}
                    <code className="rounded bg-ph-bg px-1 font-mono text-[11px]">
                      npm run build:extension:store
                    </code>{" "}
                    and load the unpacked output from{" "}
                    <code className="rounded bg-ph-bg px-1 font-mono text-[11px]">
                      chrome://extensions
                    </code>{" "}
                    (see{" "}
                    <span className="font-mono text-[11px]">
                      docs/roadmap/EXTENSION_STORE_BUILD.md
                    </span>
                    ).
                  </p>
                  <p className="text-[11px] text-ph-text-muted">
                    This dashboard runs on <span className="font-mono">https</span>
                    — browsers block linking to{" "}
                    <span className="font-mono">chrome-extension://…</span> from web
                    pages. Open the extension from the toolbar (or{" "}
                    <span className="font-mono">chrome://extensions</span> →
                    Details) — never expect a deep link from the dashboard.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-6 shrink-0 border-t border-ph-border pt-4">
              <div className="mb-4 flex justify-center gap-1.5">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={[
                      "h-1.5 rounded-full transition-all",
                      i === step
                        ? "w-6 bg-ph-accent"
                        : i < step
                          ? "w-1.5 bg-ph-accent/50"
                          : "w-1.5 bg-ph-border",
                    ].join(" ")}
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={step === 0}
                  className="cursor-pointer rounded-md border border-ph-border bg-ph-bg px-4 py-2 font-sans text-xs text-ph-text-secondary hover:bg-ph-raised disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous step"
                >
                  Back
                </button>
                <button
                  ref={primaryRef}
                  type="button"
                  onClick={advance}
                  className="cursor-pointer rounded-md border border-ph-accent-border bg-ph-accent px-5 py-2 font-sans text-xs font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ph-accent/70"
                >
                  {current.cta}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
