import { useEscapeKey } from "@/hooks/useEscapeKey.js";

interface BrokerUpgradeModalProps {
  open: boolean;
  exposureCount: number;
  onClose: () => void;
}

export function BrokerUpgradeModal({
  open,
  exposureCount,
  onClose,
}: BrokerUpgradeModalProps) {
  useEscapeKey(open, onClose);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-ph-border bg-ph-surface p-6 shadow-none">
        <h2
          id="upgrade-title"
          className="font-sans text-lg font-semibold text-ph-text-primary"
        >
          Upgrade to remove your data
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-ph-text-tertiary">
          Your data was found on{" "}
          <span className="font-mono text-ph-text-secondary">
            {exposureCount}
          </span>{" "}
          brokers. Phantom Pro removes it automatically and monitors for
          re-listing.
        </p>
        <div className="mt-5 rounded-lg border border-ph-border bg-ph-raised px-4 py-3">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-ph-text-muted">
            Phantom Pro
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-sans text-2xl font-light text-ph-text-primary">
              $9.99
            </span>
            <span className="font-sans text-sm text-ph-text-tertiary">
              / month
            </span>
          </div>
          <p className="mt-2 font-sans text-xs text-ph-text-muted">
            Unlimited broker removals · Re-listing alerts · Priority support
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-[7px] border border-ph-accent-border bg-[#6C3AED15] px-5 py-2.5 font-sans text-sm font-medium text-ph-accent-light transition-colors duration-150 hover:bg-[#6C3AED25]"
          >
            Start free trial
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[7px] border border-ph-border bg-ph-raised px-4 py-2.5 font-sans text-sm text-ph-text-secondary transition-colors duration-150 hover:border-ph-text-muted"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
