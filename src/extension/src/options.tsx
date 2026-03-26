import { useCallback, useEffect, useState } from "react";
import {
  EXTENSION_API_BASE_KEY,
  getApiBaseUrl,
  validateApiBaseUrlInput,
} from "./lib/apiClient";
import "./popup.css";

const buildDefault = (
  process.env.PLASMO_PUBLIC_API_URL ?? "http://localhost:8787"
).replace(/\/$/, "");

export default function Options() {
  const [draft, setDraft] = useState("");
  const [effective, setEffective] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const r = await chrome.storage.local.get(EXTENSION_API_BASE_KEY);
        const override = typeof r[EXTENSION_API_BASE_KEY] === "string" ? r[EXTENSION_API_BASE_KEY] : "";
        setDraft(override);
        setEffective(await getApiBaseUrl());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = useCallback(async () => {
    setError(null);
    setSaved(false);
    const t = draft.trim();
    if (t.length === 0) {
      await chrome.storage.local.remove(EXTENSION_API_BASE_KEY);
      setEffective(await getApiBaseUrl());
      setSaved(true);
      return;
    }
    const v = validateApiBaseUrlInput(t);
    if (!v.ok) {
      setError(v.error);
      return;
    }
    await chrome.storage.local.set({ [EXTENSION_API_BASE_KEY]: v.url });
    setEffective(v.url);
    setSaved(true);
  }, [draft]);

  return (
    <div className="popup" style={{ minWidth: 360, maxWidth: 560 }}>
      <div className="popup__brand">Phantom</div>
      <p className="popup__hint">API endpoint (HTTPS in production)</p>
      <p className="popup__mini">
        Build default: <code>{buildDefault}</code>
      </p>
      {loading ? (
        <p className="popup__status" aria-live="polite">
          Loading…
        </p>
      ) : (
        <>
          <label className="popup__field">
            <span className="popup__label">Override API origin</span>
            <input
              className="popup__input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="https://api.example.com"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={error != null}
            />
          </label>
          {error ? (
            <div className="popup__status" role="alert">
              {error}
            </div>
          ) : null}
          <div className="popup__row">
            <button type="button" className="popup__action" onClick={() => void save()}>
              Save
            </button>
          </div>
          {saved ? (
            <p className="popup__mini" aria-live="polite">
              Saved. Effective origin: {effective ?? "—"}
            </p>
          ) : (
            <p className="popup__mini">Effective: {effective ?? "—"}</p>
          )}
          <p className="popup__mini">
            Clear the field and save to use the build default again. Sign in again if you change the API
            URL while logged in.
          </p>
        </>
      )}
    </div>
  );
}
