import type { UserAiPreferences } from "@phantom/shared";
import { clientErrorFromApiFailure, getQueryErrorMessage } from "@phantom/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { queryKeys } from "@/lib/queryKeys.js";

interface AiPreferencesSectionProps {
  accessToken: string;
  preferences: UserAiPreferences;
}

export function AiPreferencesSection({
  accessToken,
  preferences,
}: AiPreferencesSectionProps) {
  const qc = useQueryClient();
  const [local, setLocal] = useState(preferences);
  const [saveError, setSaveError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async (patch: Partial<UserAiPreferences>) => {
      const res = await phantomApi.user.patchPreferences(accessToken, patch);
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    onSuccess: (data) => {
      setLocal(data);
      setSaveError(null);
      void qc.invalidateQueries({ queryKey: queryKeys.userMe(accessToken) });
    },
    onError: (err) => setSaveError(getQueryErrorMessage(err)),
  });

  const toggle = (key: keyof UserAiPreferences, value: boolean) => {
    const next = { ...local, [key]: value };
    setLocal(next);
    saveMutation.mutate({ [key]: value });
  };

  return (
    <section className="rounded-xl border border-ph-border bg-ph-surface p-5">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-ph-text-muted">
        Autopilot & Brain
      </div>
      <p className="mt-2 font-sans text-xs text-ph-text-tertiary">
        Control autonomous actions and AI sensitivity. Autopilot actions always
        respect your confirmation settings in Phase 1.
      </p>
      <ul className="mt-4 space-y-3">
        {(
          [
            ["autopilotAutoRotate", "Auto-rotate compromised aliases"],
            ["autopilotAutoQuarantine", "Auto-quarantine high-risk inbox mail"],
            ["autopilotAutoComplaint", "Auto-file FTC complaints from SEE"],
            ["autopilotAutoRemoval", "Auto-submit broker opt-outs (Pro)"],
            ["notificationDigestMode", "Daily digest instead of per-event alerts"],
          ] as const
        ).map(([key, label]) => (
          <li key={key}>
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span className="font-sans text-sm text-ph-text-secondary">{label}</span>
              <input
                type="checkbox"
                checked={local[key]}
                disabled={saveMutation.isPending}
                onChange={(e) => toggle(key, e.target.checked)}
                className="rounded border-ph-border"
              />
            </label>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <label
          htmlFor="ai-sensitivity"
          className="mb-1 block font-sans text-sm text-ph-text-secondary"
        >
          AI sensitivity ({local.aiSensitivity})
        </label>
        <input
          id="ai-sensitivity"
          type="range"
          min={0}
          max={100}
          value={local.aiSensitivity}
          disabled={saveMutation.isPending}
          onChange={(e) =>
            setLocal((p) => ({ ...p, aiSensitivity: Number(e.target.value) }))
          }
          onMouseUp={() => saveMutation.mutate({ aiSensitivity: local.aiSensitivity })}
          onTouchEnd={() => saveMutation.mutate({ aiSensitivity: local.aiSensitivity })}
          className="w-full"
        />
        <div className="mt-1 flex justify-between font-mono text-[10px] text-ph-text-muted">
          <span>Conservative</span>
          <span>Aggressive</span>
        </div>
      </div>
      {saveError ? (
        <p className="mt-3 font-sans text-xs text-ph-danger">{saveError}</p>
      ) : null}
    </section>
  );
}
