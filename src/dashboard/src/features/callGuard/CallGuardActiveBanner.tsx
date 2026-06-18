import type { CallGuardActiveSession } from "@phantom/shared";
import { clientErrorFromApiFailure } from "@phantom/shared";
import { useQuery } from "@tanstack/react-query";
import { LAYER_STYLES } from "@/lib/layerColors.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { formatRelativeTime } from "@/lib/formatRelative.js";
import { queryKeys } from "@/lib/queryKeys.js";
import { STALE } from "@/lib/queryStaleTimes.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

function phaseLabel(phase: CallGuardActiveSession["phase"]): string {
  if (phase === "ringing") return "Ringing";
  if (phase === "screening") return "AI screening";
  return "Live transcript";
}

export function CallGuardActiveBanner() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const sword = LAYER_STYLES.sword;

  const query = useQuery({
    queryKey: queryKeys.callGuardActiveSession(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.callGuard.activeSession(accessToken!, { signal });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data.session;
    },
    enabled: accessToken !== null,
    staleTime: STALE.callGuardActiveSession,
    refetchInterval: 15_000,
  });

  if (!accessToken || query.isPending || query.isError) return null;
  const session = query.data;
  if (!session) return null;

  return (
    <div
      className="mt-4 rounded-xl border px-4 py-3"
      style={{ borderColor: sword.border, backgroundColor: sword.bg }}
      role="status"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded border px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-wider"
          style={{ color: sword.text, borderColor: sword.border }}
        >
          Live · Sword
        </span>
        <span className="font-sans text-sm font-medium" style={{ color: sword.text }}>
          Active call — {session.callerLabel}
        </span>
      </div>
      <p className="mt-1 font-sans text-xs text-ph-text-tertiary">
        {phaseLabel(session.phase)} · scam confidence{" "}
        <span className="font-mono text-ph-text-secondary">{session.scamConfidence}%</span>
        {" · "}
        started {formatRelativeTime(session.startedAt)}
      </p>
      <p className="mt-1 font-mono text-[10px] text-ph-text-muted">
        Phase 2 preview — deterministic demo until PSTN integration ships.
      </p>
    </div>
  );
}
