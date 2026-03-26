import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useCallback, useState } from "react";
import type { Alias, AliasCategory, AliasType } from "@phantom/shared";
import {
  ALIAS_CATEGORIES,
  encryptVaultValue,
  generatePassword,
  importKeyHex,
  isValidE164Phone,
} from "@phantom/shared";
import { phantomApi } from "@/lib/api/phantomApi.js";
import {
  aliasDetailAll,
  aliasesAll,
  dashboardOverviewAll,
  queryKeys,
  vaultAll,
} from "@/lib/queryKeys.js";
import { useEscapeKey } from "@/hooks/useEscapeKey.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

const TYPES: { id: AliasType; label: string; hint: string }[] = [
  { id: "email", label: "Email", hint: "Phantom.id address" },
  {
    id: "phone",
    label: "Phone",
    hint: "Dev number + optional E.164 forward",
  },
  { id: "username", label: "Username", hint: "Contextual handle" },
  { id: "password", label: "Password", hint: "20-char random" },
];

interface GenerateAliasModalProps {
  open: boolean;
  onClose: () => void;
}

export function GenerateAliasModal({ open, onClose }: GenerateAliasModalProps) {
  const accessToken = useSessionStore((s) => s.accessToken);
  const vaultKeyHex = useSessionStore((s) => s.vaultKeyHex);
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<AliasType | null>(null);
  const [category, setCategory] = useState<AliasCategory | null>(null);
  const [phoneForward, setPhoneForward] = useState("");
  const [error, setError] = useState<string | null>(null);

  const phoneProviderQuery = useQuery({
    queryKey: queryKeys.phoneProvider(accessToken),
    queryFn: async () => {
      const res = await phantomApi.phone.provider(accessToken);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
    enabled: Boolean(open && accessToken && step === 2 && type === "phone"),
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!type || !category) {
        throw new Error("Select type and category");
      }
      let encryptedValue: string | undefined;
      if (type === "password" && vaultKeyHex) {
        const key = await importKeyHex(vaultKeyHex);
        const plain = generatePassword(20);
        encryptedValue = await encryptVaultValue(key, plain);
      }
      const res = await phantomApi.aliases.generate(accessToken, {
        type,
        category,
        encryptedValue,
        ...(type === "phone" && phoneForward.trim().length > 0
          ? { phoneForwardTo: phoneForward.trim() }
          : {}),
      });
      if (!res.ok) {
        throw new Error(res.error.message);
      }
      return res.data.alias;
    },
    onSuccess: async (alias: Alias) => {
      await queryClient.invalidateQueries({ queryKey: aliasesAll });
      await queryClient.invalidateQueries({ queryKey: aliasDetailAll });
      if (alias.type === "password") {
        await queryClient.invalidateQueries({ queryKey: vaultAll });
      }
      await queryClient.invalidateQueries({
        queryKey: dashboardOverviewAll,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.userMe(accessToken),
      });
      onClose();
      setStep(1);
      setType(null);
      setCategory(null);
      setPhoneForward("");
      setError(null);
    },
    onError: (e: Error) => {
      setError(e.message);
    },
  });

  const handleClose = useCallback(() => {
    if (!generateMutation.isPending) {
      onClose();
      setStep(1);
      setType(null);
      setCategory(null);
      setPhoneForward("");
      setError(null);
    }
  }, [generateMutation.isPending, onClose]);

  useEscapeKey(open, handleClose);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby="generate-alias-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg rounded-xl border border-ph-border bg-ph-surface p-6 shadow-none"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="generate-alias-title"
              className="font-sans text-lg font-semibold text-ph-text-primary"
            >
              Generate alias
            </h2>
            <p className="mt-1 font-sans text-xs text-ph-text-tertiary">
              Step {step} of 2 — Shield layer
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
            className="font-mono text-xs text-ph-text-ghost hover:text-ph-text-secondary"
          >
            Esc
          </button>
        </div>

        {step === 1 ? (
          <div className="mt-6 grid grid-cols-2 gap-2">
            {TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setType(t.id);
                  setStep(2);
                }}
                className={`rounded-lg border px-3 py-4 text-left transition-colors ${
                  type === t.id
                    ? "border-ph-accent bg-[#6C3AED15] text-ph-accent-light"
                    : "border-ph-border bg-ph-bg hover:border-ph-text-ghost"
                }`}
              >
                <div className="font-sans text-sm font-semibold text-ph-text-primary">
                  {t.label}
                </div>
                <div className="mt-1 font-mono text-[10px] text-ph-text-tertiary">
                  {t.hint}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-ph-text-muted">
              Category
            </div>
            <div className="flex flex-wrap gap-2">
              {ALIAS_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`rounded-full border px-3 py-1.5 font-sans text-xs font-medium transition-colors ${
                    category === c.id
                      ? "border-ph-accent bg-[#6C3AED15] text-ph-accent-light"
                      : "border-ph-border text-ph-text-secondary hover:border-ph-text-ghost"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {type === "phone" ? (
              <div className="mt-5 space-y-3">
                {phoneProviderQuery.isPending ? (
                  <p className="font-sans text-[11px] text-ph-text-muted">
                    Checking phone provider…
                  </p>
                ) : phoneProviderQuery.isError ? (
                  <p className="font-sans text-[11px] text-ph-danger">
                    Could not load phone provider status.
                  </p>
                ) : phoneProviderQuery.data ? (
                  <div
                    className={[
                      "rounded-md border px-3 py-2 font-sans text-[11px] leading-snug",
                      phoneProviderQuery.data.ready
                        ? "border-ph-border bg-ph-bg text-ph-text-tertiary"
                        : "border-ph-danger/50 bg-ph-danger/5 text-ph-danger",
                    ].join(" ")}
                  >
                    {phoneProviderQuery.data.message}
                  </div>
                ) : null}

                <div>
                  <label
                    htmlFor="phone-forward-gen"
                    className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-ph-text-muted"
                  >
                    Forward to (optional)
                  </label>
                  <input
                    id="phone-forward-gen"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+15551234567"
                    value={phoneForward}
                    onChange={(e) => setPhoneForward(e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-ph-border bg-ph-bg px-3 py-2 font-mono text-xs text-ph-text-primary placeholder:text-ph-text-muted focus:border-ph-accent-border focus:outline-none"
                  />
                  <p className="mt-1 font-sans text-[10px] text-ph-text-muted">
                    E.164 only if set. Stored for future PSTN routing; not dialed in
                    Phase 1.
                  </p>
                  {phoneForward.trim().length > 0 &&
                  !isValidE164Phone(phoneForward.trim()) ? (
                    <p className="mt-1 font-sans text-[11px] text-ph-danger">
                      Use E.164 format (e.g. +15551234567).
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setType(null);
                  setPhoneForward("");
                }}
                className="rounded-md border border-ph-border bg-ph-surface px-4 py-2 font-sans text-xs text-ph-text-secondary"
              >
                Back
              </button>
              <button
                type="button"
                disabled={
                  !category ||
                  !type ||
                  generateMutation.isPending ||
                  (type === "phone" &&
                    phoneForward.trim().length > 0 &&
                    !isValidE164Phone(phoneForward.trim())) ||
                  (type === "phone" &&
                    (phoneProviderQuery.isPending ||
                      phoneProviderQuery.isError ||
                      phoneProviderQuery.data?.ready === false))
                }
                onClick={() => generateMutation.mutate()}
                className="rounded-md border border-ph-accent-border bg-[#6C3AED15] px-4 py-2 font-sans text-xs font-medium text-ph-accent-light disabled:opacity-40"
              >
                {generateMutation.isPending ? "Generating…" : "Generate"}
              </button>
            </div>
          </div>
        )}

        {error ? (
          <p className="mt-4 font-sans text-xs text-ph-danger">{error}</p>
        ) : null}
      </motion.div>
    </div>
  );
}
