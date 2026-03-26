import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useEscapeKey } from "@/hooks/useEscapeKey.js";
import { DASHBOARD_PATHS } from "@/lib/dashboardRoutes.js";
import {
  type UpgradeContext,
  type UpgradeReason,
  upgradeBody,
  upgradeFootnote,
  upgradeTitle,
} from "@/lib/upgradeCopy.js";

export interface UpgradeModalProps {
  open: boolean;
  reason: UpgradeReason;
  context?: UpgradeContext;
  onDismiss: () => void;
  /** Called after navigating to billing (default: navigate + dismiss). */
  onUpgrade?: () => void;
  /** Optional: id for aria-labelledby (unique when multiple modals in tree). */
  titleId?: string;
}

/**
 * Shared conversion modal: one path to **`/billing`** (Stripe Checkout is started from the Billing page).
 */
export function UpgradeModal({
  open,
  reason,
  context = {},
  onDismiss,
  onUpgrade,
  titleId = "phantom-upgrade-title",
}: UpgradeModalProps) {
  const navigate = useNavigate();
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEscapeKey(open, onDismiss);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => primaryRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open, reason]);

  if (!open) return null;

  const title = upgradeTitle(reason);
  const body = upgradeBody(reason, context);
  const footnote = upgradeFootnote(reason);

  const goBilling = () => {
    onUpgrade?.();
    onDismiss();
    void navigate(DASHBOARD_PATHS.billing);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-ph-border bg-ph-surface p-6 shadow-none">
        <h2
          id={titleId}
          className="font-sans text-lg font-semibold text-ph-text-primary"
        >
          {title}
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-ph-text-tertiary">
          {body}
        </p>
        <div className="mt-5 rounded-lg border border-ph-border bg-ph-raised px-4 py-3">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-ph-text-muted">
            Phantom Pro
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-sans text-2xl font-light text-ph-text-primary">
              $9.99
            </span>
            <span className="font-sans text-sm text-ph-text-tertiary">/ month</span>
          </div>
          <p className="mt-2 font-sans text-xs text-ph-text-muted">
            Unlimited aliases · Unlimited scans · Removal queue (simulated in Phase
            1) · Priority support
          </p>
        </div>
        <p className="mt-4 font-sans text-[11px] leading-snug text-ph-text-muted">
          {footnote}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            ref={primaryRef}
            type="button"
            onClick={goBilling}
            aria-label="Open billing page to upgrade to Phantom Pro"
            className="rounded-[7px] border border-ph-accent-border bg-[#6C3AED15] px-5 py-2.5 font-sans text-sm font-medium text-ph-accent-light transition-colors duration-150 hover:bg-[#6C3AED25] focus:outline-none focus-visible:ring-2 focus-visible:ring-ph-accent/50"
          >
            View billing &amp; upgrade
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-[7px] border border-ph-border bg-ph-raised px-4 py-2.5 font-sans text-sm text-ph-text-secondary transition-colors duration-150 hover:border-ph-text-muted"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
