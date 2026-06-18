import { clientErrorFromApiFailure, getQueryErrorMessage } from "@phantom/shared";
import type { ExposureReport } from "@phantom/shared";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { SessionGateMessage } from "@/components/SessionGateMessage.js";
import { LAYER_STYLES } from "@/lib/layerColors.js";
import { phantomApi } from "@/lib/api/phantomApi.js";
import { queryKeys } from "@/lib/queryKeys.js";
import { STALE } from "@/lib/queryStaleTimes.js";
import { useSessionStore } from "@/stores/useSessionStore.js";

function severityClass(severity: string): string {
  if (severity === "critical" || severity === "high") return "text-ph-danger";
  if (severity === "medium") return "text-ph-warning";
  return "text-ph-success";
}

function downloadReportJson(report: ExposureReport): void {
  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `phantom-exposure-report-${report.generatedAt.slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const autopilot = LAYER_STYLES.autopilot;

  const reportQuery = useQuery({
    queryKey: queryKeys.exposureReport(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.reports.latest(accessToken!, { signal });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data.report;
    },
    enabled: accessToken !== null,
    staleTime: STALE.reports,
  });

  const digestQuery = useQuery({
    queryKey: queryKeys.privacyDigest(accessToken),
    queryFn: async ({ signal }) => {
      const res = await phantomApi.reports.digest(accessToken!, { signal });
      if (!res.ok) throw clientErrorFromApiFailure(res);
      return res.data;
    },
    enabled: accessToken !== null,
    staleTime: STALE.reports,
  });

  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const onCopyDigestEmail = useCallback(async () => {
    if (!accessToken) return;
    const res = await phantomApi.reports.digestEmail(accessToken);
    if (!res.ok) {
      setCopyStatus("Could not build digest email");
      return;
    }
    await navigator.clipboard.writeText(res.data.body);
    setCopyStatus(
      res.data.to
        ? `Copied — forward to ${res.data.to} when SMTP ships`
        : "Digest copied to clipboard"
    );
    setTimeout(() => setCopyStatus(null), 4000);
  }, [accessToken]);

  const onExport = useCallback(() => {
    if (reportQuery.data) downloadReportJson(reportQuery.data);
  }, [reportQuery.data]);

  if (!accessToken) return <SessionGateMessage />;

  return (
    <div className="px-4 py-6 sm:px-8">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span
          className="rounded border px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-wider"
          style={{
            color: autopilot.text,
            backgroundColor: autopilot.bg,
            borderColor: autopilot.border,
          }}
        >
          Autopilot
        </span>
        <h1 className="font-sans text-lg font-semibold text-ph-text-primary">
          Exposure reports
        </h1>
      </div>
      <p className="mt-1 max-w-2xl font-sans text-sm text-ph-text-tertiary">
        AI-generated privacy posture report from your aliases, brokers, and breach
        data. Enable daily digest mode in Settings for condensed email-style summaries.
      </p>

      {digestQuery.data?.digestMode ? (
        <article className="mt-6 rounded-xl border border-ph-accent-border bg-ph-accent-bg/30 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-mono text-[11px] font-semibold uppercase tracking-wide text-ph-accent-light">
                Daily digest preview
              </h2>
              <p className="mt-2 font-sans text-sm font-medium text-ph-text-primary">
                {digestQuery.data.headline}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void onCopyDigestEmail()}
              className="rounded-md border border-ph-border bg-ph-raised px-3 py-1.5 font-sans text-xs text-ph-text-secondary"
            >
              Copy email body
            </button>
          </div>
          {copyStatus ? (
            <p className="mt-2 font-sans text-[11px] text-ph-text-tertiary">{copyStatus}</p>
          ) : null}
          <ul className="mt-3 space-y-1">
            {digestQuery.data.topActions.map((action) => (
              <li key={action} className="font-sans text-xs text-ph-text-secondary">
                → {action}
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      {reportQuery.isPending && (
        <p className="mt-8 font-sans text-sm text-ph-text-tertiary">Generating…</p>
      )}
      {reportQuery.isError && (
        <p className="mt-8 font-sans text-sm text-ph-danger">
          {getQueryErrorMessage(reportQuery.error)}
        </p>
      )}
      {reportQuery.data && (
        <article className="mt-6 rounded-xl border border-ph-border bg-ph-surface p-6">
          <header className="border-b border-ph-borderSubtle pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-sans text-base font-semibold text-ph-text-primary">
                  {reportQuery.data.periodLabel}
                </h2>
                <p className="mt-1 font-mono text-[10px] text-ph-text-muted">
                  Generated {new Date(reportQuery.data.generatedAt).toLocaleString()} ·
                  overall{" "}
                  <span className={severityClass(reportQuery.data.overallSeverity)}>
                    {reportQuery.data.overallSeverity}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={onExport}
                className="rounded-md border border-ph-border bg-ph-raised px-3 py-1.5 font-sans text-xs text-ph-text-secondary"
              >
                Export JSON
              </button>
            </div>
            <p className="mt-3 font-sans text-sm leading-relaxed text-ph-text-secondary">
              {reportQuery.data.narrative}
            </p>
          </header>
          <div className="mt-5 space-y-5">
            {reportQuery.data.sections.map((section) => (
              <section key={section.id}>
                <h3 className="font-sans text-sm font-medium text-ph-text-primary">
                  {section.title}
                </h3>
                <p className="mt-1 font-sans text-xs text-ph-text-tertiary">
                  {section.summary}
                </p>
                {section.actionItems.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {section.actionItems.map((item) => (
                      <li
                        key={item}
                        className="font-sans text-xs text-ph-accent-light"
                      >
                        → {item}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </article>
      )}
    </div>
  );
}
