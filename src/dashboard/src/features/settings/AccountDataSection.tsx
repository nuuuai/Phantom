import {
  clientErrorFromApiFailure,
  getQueryErrorMessage,
} from "@phantom/shared";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { setSkipDevBootstrap } from "@/lib/devBootstrap.js";
import { queryClient } from "@/lib/queryClient.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

interface AccountDataSectionProps {
  accessToken: string;
}

export function AccountDataSection({ accessToken }: AccountDataSectionProps) {
  const navigate = useNavigate();
  const clearSession = useSessionStore((s) => s.clearSession);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await phantomApi.user.deleteAccount(accessToken, {
        password: deletePassword,
        confirmPhrase: "DELETE",
      });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    onSuccess: () => {
      setSkipDevBootstrap();
      queryClient.clear();
      clearSession();
      void navigate("/login", { replace: true });
    },
  });

  const onExport = async () => {
    setExportBusy(true);
    setExportError(null);
    try {
      const res = await phantomApi.user.exportAccount(accessToken);
      if (!res.ok) {
        setExportError(res.error.message);
        return;
      }
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `phantom-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportError(getQueryErrorMessage(e));
    } finally {
      setExportBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-ph-border bg-ph-surface p-5">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-ph-text-muted">
        Data & privacy
      </div>
      <p className="mt-2 font-sans text-xs text-ph-text-tertiary">
        Export account metadata, alias records, and your encrypted vault blob.
        Plaintext vault passwords never leave your device.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={exportBusy}
          onClick={() => void onExport()}
          className="rounded-md border border-ph-border bg-ph-raised px-4 py-2 font-sans text-xs font-medium text-ph-text-primary hover:bg-ph-border/40 disabled:opacity-50"
        >
          {exportBusy ? "Preparing export…" : "Download JSON export"}
        </button>
      </div>
      {exportError ? (
        <p className="mt-2 font-sans text-xs text-ph-danger" role="alert">
          {exportError}
        </p>
      ) : null}

      <div className="mt-6 border-t border-ph-border-subtle pt-5">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-ph-danger">
          Delete account
        </div>
        <p className="mt-2 font-sans text-xs text-ph-text-tertiary">
          Permanently removes your account, aliases, scans, and vault sync blob.
          This cannot be undone.
        </p>

        {!deleteOpen ? (
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="mt-4 rounded-md border border-ph-danger/40 bg-ph-danger/10 px-4 py-2 font-sans text-xs font-medium text-ph-danger hover:bg-ph-danger/15"
          >
            Delete my account…
          </button>
        ) : (
          <div className="mt-4 max-w-md space-y-3">
            <label className="block">
              <span className="font-sans text-xs text-ph-text-tertiary">
                Confirm password
              </span>
              <input
                type="password"
                autoComplete="current-password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-ph-border bg-ph-bg px-3 py-2 font-sans text-sm text-ph-text-primary"
              />
            </label>
            <label className="block">
              <span className="font-sans text-xs text-ph-text-tertiary">
                Type <span className="font-mono">DELETE</span> to confirm
              </span>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="mt-1 w-full rounded-md border border-ph-border bg-ph-bg px-3 py-2 font-mono text-sm text-ph-text-primary"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={
                  deleteMutation.isPending ||
                  deleteConfirm !== "DELETE" ||
                  deletePassword.length < 1
                }
                onClick={() => deleteMutation.mutate()}
                className="rounded-md border border-ph-danger/50 bg-ph-danger/15 px-4 py-2 font-sans text-xs font-medium text-ph-danger disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting…" : "Permanently delete"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteOpen(false);
                  setDeletePassword("");
                  setDeleteConfirm("");
                }}
                className="rounded-md border border-ph-border px-4 py-2 font-sans text-xs text-ph-text-secondary"
              >
                Cancel
              </button>
            </div>
            {deleteMutation.isError ? (
              <p className="font-sans text-xs text-ph-danger" role="alert">
                {getQueryErrorMessage(deleteMutation.error)}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
