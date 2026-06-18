import { useEscapeKey } from "@/hooks/useEscapeKey.js";
import { CopilotChat } from "@/features/dashboard/CopilotChat.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

interface CopilotDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CopilotDrawer({ open, onClose }: CopilotDrawerProps) {
  const accessToken = useSessionStore((s) => s.accessToken);
  useEscapeKey(open, onClose);

  if (!open || !accessToken) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label="Phantom Copilot"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex h-full w-full max-w-md flex-col border-l border-ph-border bg-ph-surface shadow-none">
        <div className="flex items-center justify-between border-b border-ph-border px-5 py-4">
          <h2 className="font-sans text-sm font-semibold text-ph-text-primary">
            Phantom Copilot
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-ph-border px-2 py-1 font-sans text-xs text-ph-text-secondary hover:bg-ph-raised"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <CopilotChat compact />
        </div>
      </div>
    </div>
  );
}

export function CopilotFab({ onOpen }: { onOpen: () => void }) {
  const accessToken = useSessionStore((s) => s.accessToken);
  if (!accessToken) return null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="fixed bottom-6 right-6 z-40 rounded-full border border-ph-accent-border bg-ph-accent/[0.2] px-4 py-2.5 font-sans text-xs font-medium text-ph-accent-light shadow-[0_0_12px_rgba(108,58,237,0.35)] hover:bg-ph-accent/[0.3]"
      aria-label="Open Phantom Copilot"
    >
      Copilot
    </button>
  );
}
