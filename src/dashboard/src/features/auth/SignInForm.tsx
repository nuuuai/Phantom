import {
  clientErrorFromApiFailure,
  deriveVaultKey,
  exportKeyHex,
} from "@phantom/shared";
import { useState } from "react";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

interface SignInFormProps {
  onSuccess?: () => void;
  compact?: boolean;
}

export function SignInForm({ onSuccess, compact = false }: SignInFormProps) {
  const [email, setEmail] = useState(
    import.meta.env.VITE_DEV_EMAIL ?? "dev@phantom.local"
  );
  const [password, setPassword] = useState(
    import.meta.env.VITE_DEV_PASSWORD ?? "devpassword123"
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const setAccessToken = useSessionStore((s) => s.setAccessToken);
  const setRefreshToken = useSessionStore((s) => s.setRefreshToken);
  const setUser = useSessionStore((s) => s.setUser);
  const setLoginPassword = useSessionStore((s) => s.setLoginPassword);
  const setVaultKeyHex = useSessionStore((s) => s.setVaultKeyHex);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await phantomApi.auth.login(email.trim(), password);
      if (!res.ok) {
        setError(clientErrorFromApiFailure(res).message);
        return;
      }
      setAccessToken(res.data.accessToken);
      setRefreshToken(res.data.refreshToken ?? null);
      setUser(res.data.user);
      setLoginPassword(password);

      const saltRes = await phantomApi.vault.getSalt(res.data.accessToken);
      if (saltRes.ok && saltRes.data.vaultSalt) {
        const key = await deriveVaultKey(password, saltRes.data.vaultSalt);
        setVaultKeyHex(await exportKeyHex(key));
      }
      onSuccess?.();
    } catch {
      setError("Could not reach the API. Check that it is running on port 8787.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      {!compact && (
        <p className="font-sans text-sm text-ph-text-tertiary">
          Sign in with your Phantom account. Credentials are sent over HTTPS only.
        </p>
      )}
      <div>
        <label
          htmlFor="signin-email"
          className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-wide text-ph-text-muted"
        >
          Email
        </label>
        <input
          id="signin-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-ph-border bg-ph-raised px-3 py-2 font-sans text-sm text-ph-text-primary outline-none focus:ring-2 focus:ring-ph-accent/30"
        />
      </div>
      <div>
        <label
          htmlFor="signin-password"
          className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-wide text-ph-text-muted"
        >
          Password
        </label>
        <input
          id="signin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-ph-border bg-ph-raised px-3 py-2 font-sans text-sm text-ph-text-primary outline-none focus:ring-2 focus:ring-ph-accent/30"
        />
      </div>
      {error ? (
        <p className="font-sans text-sm text-ph-danger" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        aria-busy={busy}
        className="w-full rounded-md border border-ph-accent-border bg-ph-accent/[0.15] px-4 py-2.5 font-sans text-sm font-medium text-ph-accent-light hover:bg-ph-accent/[0.25] disabled:opacity-50"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
