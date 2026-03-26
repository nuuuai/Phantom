import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEscapeKey } from "@/hooks/useEscapeKey.js";

const STORAGE_KEY = "phantom_onboarding_complete";

const STEPS = [
  {
    title: "Welcome to Phantom",
    body: "Your privacy command center. Phantom shields your real identity across the web with disposable aliases, encrypted credential storage, and automated data broker removal.",
    cta: "Get started",
  },
  {
    title: "Generate your first alias",
    body: "Head to the Aliases page and create a disposable email, username, or phone alias. Use it for any signup instead of your real info.",
    cta: "Next",
    link: "/aliases",
  },
  {
    title: "Secure your passwords",
    body: "The Vault generates strong passwords and encrypts them on your device before storing. The server never sees your plaintext credentials.",
    cta: "Next",
    link: "/vault",
  },
  {
    title: "Scan for data brokers",
    body: "Run an exposure scan to discover which data brokers are selling your personal information — then remove yourself.",
    cta: "Next",
    link: "/brokers",
  },
  {
    title: "Phantom Pro (optional)",
    body: "Free tier includes exposure scans and DIY opt-out links. Upgrade for automated removal queue, unlimited aliases, and billing in one place.",
    cta: "Next",
    link: "/billing",
  },
  {
    title: "Install the extension",
    body: "The Phantom Chrome extension detects signup forms and auto-fills aliases and encrypted passwords directly in the browser.",
    cta: "Done",
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

  useEscapeKey(open, close);

  if (!open) return null;

  const current = STEPS[step];
  if (!current) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="onboarding-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
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
          className="w-full max-w-md rounded-xl border border-ph-border bg-ph-surface p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between">
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
          <h2
            id="phantom-onboarding-title"
            className="mt-4 font-sans text-base font-semibold text-ph-text-primary"
          >
            {current.title}
          </h2>
          <p className="mt-2 font-sans text-[13px] leading-relaxed text-ph-text-tertiary">
            {current.body}
          </p>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex gap-1.5">
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
            <button
              type="button"
              onClick={advance}
              className="cursor-pointer rounded-md border border-ph-accent-border bg-ph-accent px-5 py-2 font-sans text-xs font-medium text-white"
            >
              {current.cta}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
