import type { CopilotChatResponse, CopilotConfirmResponse } from "@phantom/shared";
import { useCallback, useState } from "react";

interface CopilotMiniProps {
  chatType: string;
  confirmType: string;
}

type CopilotChatMessageResponse =
  | { ok: true; data: CopilotChatResponse }
  | { ok: false; error: string };

type CopilotConfirmMessageResponse =
  | { ok: true; data: CopilotConfirmResponse }
  | { ok: false; error: string };

const PROMPTS = [
  "Why is my risk score what it is?",
  "What should I do next?",
  "Run a broker scan for me",
] as const;

export function CopilotMini({ chatType, confirmType }: CopilotMiniProps) {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [pending, setPending] = useState<
    CopilotChatResponse["pendingAction"] | null
  >(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setBusy(true);
      setError(null);
      setPending(null);
      setInput(trimmed);
      try {
        const res = (await chrome.runtime.sendMessage({
          type: chatType,
          message: trimmed,
        })) as CopilotChatMessageResponse | undefined;
        if (!res?.ok) {
          setError(res?.error ?? "Copilot unavailable");
          return;
        }
        setReply(res.data.reply);
        setPending(res.data.pendingAction ?? null);
      } catch {
        setError("Could not reach Copilot");
      } finally {
        setBusy(false);
      }
    },
    [chatType]
  );

  const confirm = useCallback(async () => {
    if (!pending) return;
    setBusy(true);
    setError(null);
    try {
      const res = (await chrome.runtime.sendMessage({
        type: confirmType,
        toolId: pending.toolId,
        params: pending.params,
      })) as CopilotConfirmMessageResponse | undefined;
      if (!res?.ok) {
        setError(res?.error ?? "Action failed");
        return;
      }
      setPending(null);
      setReply((prev) =>
        prev ? `${prev}\n\n✓ ${res.data.message}` : res.data.message
      );
    } catch {
      setError("Action failed");
    } finally {
      setBusy(false);
    }
  }, [confirmType, pending]);

  return (
    <section className="popup__copilot" aria-label="Phantom Copilot">
      <div className="popup__label">Copilot · Brain</div>
      <div className="popup__chips">
        {PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            className="popup__chip"
            disabled={busy}
            onClick={() => void ask(p)}
          >
            {p.length > 28 ? `${p.slice(0, 26)}…` : p}
          </button>
        ))}
      </div>
      <div className="popup__row">
        <input
          className="popup__input popup__input--flex"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Phantom…"
          disabled={busy}
          onKeyDown={(e) => {
            if (e.key === "Enter") void ask(input);
          }}
        />
        <button
          type="button"
          className="popup__action popup__action--inline"
          disabled={busy || !input.trim()}
          onClick={() => void ask(input)}
        >
          Ask
        </button>
      </div>
      {error ? (
        <p className="popup__mini popup__mini--danger" role="alert">
          {error}
        </p>
      ) : null}
      {pending ? (
        <div className="popup__pending">
          <p className="popup__mini">{pending.title}</p>
          <button
            type="button"
            className="popup__action"
            disabled={busy}
            onClick={() => void confirm()}
          >
            Confirm
          </button>
        </div>
      ) : null}
      {reply ? <div className="popup__preview popup__reply">{reply}</div> : null}
    </section>
  );
}
