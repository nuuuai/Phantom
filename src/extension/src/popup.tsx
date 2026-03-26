import { useCallback, useState } from "react";
import { MESSAGE_GENERATE_ALIAS } from "./lib/messages";
import "./popup.css";

type GenerateResponse =
  | { ok: true; alias: { label: string; address: string } }
  | { ok: false; error: string };

function maskAddress(address: string): string {
  const at = address.indexOf("@");
  if (at <= 0) return "•••";
  const local = address.slice(0, at);
  const domain = address.slice(at + 1);
  const prefix = local.slice(0, 2);
  return `${prefix}•••@${domain}`;
}

export function Popup() {
  const [status, setStatus] = useState<string>("Ready");
  const [preview, setPreview] = useState<string | null>(null);

  const onGenerate = useCallback(() => {
    setStatus("Generating…");
    setPreview(null);
    void chrome.runtime
      .sendMessage({ type: MESSAGE_GENERATE_ALIAS })
      .then((res: GenerateResponse | undefined) => {
        if (!res) {
          setStatus("No response");
          return;
        }
        if (res.ok) {
          setStatus("Alias ready");
          setPreview(`${res.alias.label} · ${maskAddress(res.alias.address)}`);
        } else {
          setStatus("Could not generate");
        }
      })
      .catch(() => {
        setStatus("Could not generate");
      });
  }, []);

  return (
    <div className="popup">
      <div className="popup__brand">Phantom</div>
      <p className="popup__hint">Shield layer · quick alias</p>
      <button type="button" className="popup__action" onClick={onGenerate}>
        Generate alias
      </button>
      <div className="popup__status" aria-live="polite">
        {status}
      </div>
      {preview ? <div className="popup__preview">{preview}</div> : null}
    </div>
  );
}

export default Popup;
