import {
  deriveVaultKey,
  exportKeyHex,
} from "@phantom/shared";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

async function deriveAndStore(
  pw: string,
  accessToken: string | null,
  setVaultKeyHex: (h: string | null) => void,
): Promise<void> {
  const saltRes = await phantomApi.vault.getSalt(accessToken);
  if (!saltRes.ok) throw new Error("Failed to fetch vault salt");

  let salt = saltRes.data.vaultSalt;
  if (!salt) {
    const initRes = await phantomApi.vault.init(accessToken);
    if (!initRes.ok) throw new Error("Failed to initialize vault");
    salt = initRes.data.vaultSalt;
  }

  const key = await deriveVaultKey(pw, salt);
  setVaultKeyHex(await exportKeyHex(key));
}

export function VaultUnlockGate({ children }: { children: React.ReactNode }) {
  const accessToken = useSessionStore((s) => s.accessToken);
  const vaultKeyHex = useSessionStore((s) => s.vaultKeyHex);
  const loginPassword = useSessionStore((s) => s.loginPassword);
  const setVaultKeyHex = useSessionStore((s) => s.setVaultKeyHex);
  const setLoginPassword = useSessionStore((s) => s.setLoginPassword);

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const autoUnlockAttempted = useRef(false);

  useEffect(() => {
    if (vaultKeyHex || !loginPassword || !accessToken) return;
    if (autoUnlockAttempted.current) return;
    autoUnlockAttempted.current = true;

    void deriveAndStore(loginPassword, accessToken, setVaultKeyHex).catch(
      () => setLoginPassword(null),
    );
  }, [loginPassword, vaultKeyHex, accessToken, setVaultKeyHex, setLoginPassword]);

  const unlockMutation = useMutation({
    mutationFn: async (pw: string) => {
      if (!accessToken) {
        throw new Error("Session required");
      }
      await deriveAndStore(pw, accessToken, setVaultKeyHex);
      setLoginPassword(pw);
    },
    onError: (err: Error) => setError(err.message),
  });

  if (vaultKeyHex) {
    return <>{children}</>;
  }

  if (loginPassword && !vaultKeyHex) {
    return (
      <div className="flex items-center justify-center px-8 py-20">
        <p className="font-sans text-sm text-ph-text-tertiary">
          Deriving vault key…
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center px-8 py-20">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-xl border border-ph-border bg-ph-surface p-6 shadow-lg"
      >
        <h2 className="font-sans text-base font-semibold text-ph-text-primary">
          Unlock vault
        </h2>
        <p className="mt-1 font-sans text-[12px] text-ph-text-tertiary">
          Enter your account password to decrypt vault entries. Your password
          never leaves this device.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (password.length === 0) return;
            setError(null);
            unlockMutation.mutate(password);
          }}
          className="mt-5 space-y-4"
        >
          <input
            type="password"
            placeholder="Account password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-ph-border bg-ph-bg px-3 py-2 font-sans text-xs text-ph-text-primary placeholder:text-ph-text-ghost focus:border-ph-accent-border focus:outline-none"
          />
          {error && (
            <p className="font-sans text-[11px] text-ph-danger">{error}</p>
          )}
          <button
            type="submit"
            disabled={unlockMutation.isPending || password.length === 0}
            className="w-full cursor-pointer rounded-md border border-ph-accent-border bg-ph-accent px-4 py-2 font-sans text-xs font-medium text-white disabled:opacity-50"
          >
            {unlockMutation.isPending ? "Unlocking…" : "Unlock"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
