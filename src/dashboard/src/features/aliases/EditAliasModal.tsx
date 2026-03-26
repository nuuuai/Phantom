import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import type { Alias, AliasCategory } from "@phantom/shared";
import { ALIAS_CATEGORIES } from "@phantom/shared";
import { phantomApi } from "@/lib/api/phantomApi.js";
import {
  aliasDetailAll,
  aliasesAll,
  dashboardOverviewAll,
  vaultAll,
} from "@/lib/queryKeys.js";
import { useEscapeKey } from "@/hooks/useEscapeKey.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

interface EditAliasModalProps {
  alias: Alias | null;
  open: boolean;
  onClose: () => void;
}

export function EditAliasModal({ alias, open, onClose }: EditAliasModalProps) {
  const accessToken = useSessionStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<AliasCategory | null>(null);
  const [serviceName, setServiceName] = useState("");

  useEffect(() => {
    if (alias) {
      setCategory(alias.category);
      setServiceName(alias.serviceName ?? "");
    }
  }, [alias]);

  const patchMutation = useMutation({
    mutationFn: async () => {
      if (!alias || !category) throw new Error("Invalid");
      const res = await phantomApi.aliases.patch(accessToken, alias.id, {
        category,
        serviceName: serviceName.length > 0 ? serviceName : null,
      });
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: aliasesAll });
      await queryClient.invalidateQueries({ queryKey: vaultAll });
      await queryClient.invalidateQueries({ queryKey: aliasDetailAll });
      await queryClient.invalidateQueries({
        queryKey: dashboardOverviewAll,
      });
      onClose();
    },
  });

  const handleClose = useCallback(() => {
    if (!patchMutation.isPending) onClose();
  }, [patchMutation.isPending, onClose]);

  useEscapeKey(open && alias != null, handleClose);

  if (!open || !alias) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-alias-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-xl border border-ph-border bg-ph-surface p-6"
      >
        <h2
          id="edit-alias-title"
          className="font-sans text-lg font-semibold text-ph-text-primary"
        >
          Edit alias
        </h2>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="font-mono text-[10px] uppercase text-ph-text-muted">
              Category
            </span>
            <select
              value={category ?? alias.category}
              onChange={(e) =>
                setCategory(e.target.value as AliasCategory)
              }
              className="mt-1 w-full rounded-md border border-ph-border bg-ph-bg px-3 py-2 font-sans text-sm text-ph-text-primary"
            >
              {ALIAS_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase text-ph-text-muted">
              Service name
            </span>
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="mt-1 w-full rounded-md border border-ph-border bg-ph-bg px-3 py-2 font-sans text-sm text-ph-text-primary"
              placeholder="e.g. Acme Checkout"
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-ph-border px-4 py-2 font-sans text-xs text-ph-text-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={patchMutation.isPending}
            onClick={() => patchMutation.mutate()}
            className="rounded-md border border-ph-accent-border bg-[#6C3AED15] px-4 py-2 font-sans text-xs font-medium text-ph-accent-light"
          >
            Save
          </button>
        </div>
      </motion.div>
    </div>
  );
}
