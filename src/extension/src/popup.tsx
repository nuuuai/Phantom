import { useCallback, useState } from "react";
import { MESSAGE_GENERATE_ALIAS, MESSAGE_LOGIN } from "./lib/messages";
import "./popup.css";

type GenerateResponse =
  | { ok: true; alias: { type: string; value: string } }
  | { ok: false; error: string };

type LoginResponse = { ok: true } | { ok: false; error: string };

function maskValue(type: string, value: string): string {
  if (type === "password") return "•".repeat(12);
  if (type === "email") {
    const at = value.indexOf("@");
    if (at <= 0) return "•••";
    return `${value.slice(0, 2)}•••@${value.slice(at + 1)}`;
  }
  return value.slice(0, 8) + "…";
}

export function Popup() {
  const [email, setEmail] = useState("dev@phantom.local");
  const [password, setPassword] = useState("devpassword123");
  const [authStatus, setAuthStatus] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [preview, setPreview] = useState<string | null>(null);

  const onLogin = useCallback(() => {
    setAuthStatus("Signing in…");
    void chrome.runtime
      .sendMessage({
        type: MESSAGE_LOGIN,
        email,
        password,
      })
      .then((res: LoginResponse | undefined) => {
        if (!res) {
          setAuthStatus("No response");
          return;
        }
        if (res.ok) {
          setAuthStatus("Signed in");
        } else {
          setAuthStatus("Sign-in failed");
        }
      })
      .catch(() => {
        setAuthStatus("Sign-in failed");
      });
  }, [email, password]);

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
          setPreview(
            `${res.alias.type} · ${maskValue(res.alias.type, res.alias.value)}`
          );
        } else {
          setStatus(res.error);
        }
      })
      .catch(() => {
        setStatus("Could not generate");
      });
  }, []);

  return (
    <div className="popup">
      <div className="popup__brand">Phantom</div>
      <p className="popup__hint">Shield · extension session</p>
      <label className="popup__field">
        <span className="popup__label">Email</span>
        <input
          className="popup__input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
        />
      </label>
      <label className="popup__field">
        <span className="popup__label">Password</span>
        <input
          className="popup__input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </label>
      <button type="button" className="popup__secondary" onClick={onLogin}>
        Sign in
      </button>
      <div className="popup__mini" aria-live="polite">
        {authStatus}
      </div>
      <hr className="popup__hr" />
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
