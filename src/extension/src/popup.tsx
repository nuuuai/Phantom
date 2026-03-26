import { useCallback, useState } from "react";
import {
  MESSAGE_GENERATE_ALIAS,
  MESSAGE_LOGIN,
  MESSAGE_LOGOUT,
} from "./lib/messages";
import type { FieldKind } from "./lib/messages";
import "./popup.css";

type GenerateResponse =
  | {
      ok: true;
      alias: { type: string; value: string };
      /** Present when vault decrypted server-stored ciphertext (password aliases). */
      plainValue?: string;
    }
  | { ok: false; error: string };

type LoginResponse = { ok: true } | { ok: false; error: string };

type LogoutResponse = { ok: true } | { ok: false; error: string };

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
  /** Popup generate: email vs password (matches page field kinds; uses vault for encrypted password when signed in). */
  const [generateKind, setGenerateKind] = useState<FieldKind>("email");

  const onLogout = useCallback(() => {
    setAuthStatus("Signing out…");
    void chrome.runtime
      .sendMessage({ type: MESSAGE_LOGOUT })
      .then((res: LogoutResponse | undefined) => {
        if (res?.ok) {
          setAuthStatus("Signed out");
        } else {
          setAuthStatus(res?.error ?? "Sign-out failed");
        }
      })
      .catch(() => {
        setAuthStatus("Sign-out failed");
      });
  }, []);

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
          setAuthStatus(res.error);
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
      .sendMessage({
        type: MESSAGE_GENERATE_ALIAS,
        fieldKind: generateKind,
      })
      .then((res: GenerateResponse | undefined) => {
        if (!res) {
          setStatus("No response");
          return;
        }
        if (res.ok) {
          setStatus("Alias ready");
          const previewValue =
            res.plainValue ??
            res.alias.value;
          setPreview(
            `${res.alias.type} · ${maskValue(res.alias.type, previewValue)}`
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
      <div className="popup__row">
        <button
          type="button"
          className="popup__secondary"
          onClick={onLogin}
          aria-busy={authStatus === "Signing in…"}
          disabled={authStatus === "Signing in…" || authStatus === "Signing out…"}
        >
          Sign in
        </button>
        <button
          type="button"
          className="popup__secondary"
          onClick={onLogout}
          aria-busy={authStatus === "Signing out…"}
          disabled={authStatus === "Signing in…" || authStatus === "Signing out…"}
        >
          Sign out
        </button>
      </div>
      <div
        className="popup__mini"
        aria-live="polite"
        role={
          authStatus &&
          authStatus !== "Signed in" &&
          authStatus !== "Signing in…" &&
          authStatus !== "Signing out…"
            ? "alert"
            : "status"
        }
      >
        {authStatus}
      </div>
      <p className="popup__mini">
        <button
          type="button"
          className="popup__secondary"
          onClick={() => void chrome.runtime.openOptionsPage()}
        >
          API settings
        </button>
      </p>
      <hr className="popup__hr" />
      <p className="popup__mini">Generate type</p>
      <div className="popup__row">
        <button
          type="button"
          className={
            generateKind === "email" ? "popup__action" : "popup__secondary"
          }
          onClick={() => setGenerateKind("email")}
        >
          Email
        </button>
        <button
          type="button"
          className={
            generateKind === "password" ? "popup__action" : "popup__secondary"
          }
          onClick={() => setGenerateKind("password")}
        >
          Password
        </button>
      </div>
      <button
        type="button"
        className="popup__action"
        onClick={onGenerate}
        aria-busy={status === "Generating…"}
        disabled={status === "Generating…"}
      >
        Generate alias
      </button>
      <div
        className="popup__status"
        aria-live="polite"
        role={
          status === "Generating…" || status === "Alias ready" || status === ""
            ? "status"
            : "alert"
        }
      >
        {status}
      </div>
      {preview ? <div className="popup__preview">{preview}</div> : null}
    </div>
  );
}

export default Popup;
