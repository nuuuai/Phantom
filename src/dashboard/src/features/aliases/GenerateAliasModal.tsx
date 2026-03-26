import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useCallback, useState } from "react";
import type { AliasCategory, AliasType } from "@phantom/shared";
import { ALIAS_CATEGORIES } from "@phantom/shared";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

const TYPES: { id: AliasType; label: string; hint: string }[] = [
  { id: "email", label: "Email", hint: "Phantom.id address" },
  { id: "phone", label: "Phone", hint: "+1-555 placeholder" },
  { id: "username", label: "Username", hint: "Contextual handle" },
  { id: "password", label: "Password", hint: "20-char random" },
];

interface GenerateAliasModalProps {
  open: boolean;
  onClose: () => void;
}

export function GenerateAliasModal({ open, onClose }: GenerateAliasModalProps) {
  const accessToken = useSessionStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<AliasType | null>(null);
  const [category, setCategory] = useState<AliasCategory | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!type || !category) {
        throw new Error("Select type and category");
      }
      const res = await phantomApi.aliases.generate(accessToken, {
        type,
        category,
      });
      if (!res.ok) {
        throw new Error(res.error.message);
      }
      return res.data.alias;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["aliases"] });
      onClose();
      setStep(1);
      setType(null);
      setCategory(null);
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
      setError(null);
    }
  }, [generateMutation.isPending, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby="generate-alias-title"
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
            <div className="mt-6 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setType(null);
                }}
                className="rounded-md border border-ph-border bg-ph-surface px-4 py-2 font-sans text-xs text-ph-text-secondary"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!category || !type || generateMutation.isPending}
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
