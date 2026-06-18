import type { Alias } from "@phantom/shared";
import {
  checkPasswordPwned,
  detectPasswordReuse,
  rankVaultPasswordsForRotation,
  buildVaultCompromisePlaybook,
} from "@phantom/shared";
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";

interface VaultAuditPanelProps {
  aliases: readonly Alias[];
  resolveValue: (item: Alias) => string;
}

interface BreachRow {
  entryIds: string[];
  labels: string[];
  breachCount: number;
}

export function VaultAuditPanel({ aliases, resolveValue }: VaultAuditPanelProps) {
  const [breachRows, setBreachRows] = useState<BreachRow[] | null>(null);
  const [breachBusy, setBreachBusy] = useState(false);
  const [breachError, setBreachError] = useState<string | null>(null);

  const entries = useMemo(
    () =>
      aliases
        .filter((a) => a.encryptedValue && a.isActive)
        .map((a) => ({
          id: a.id,
          label: a.serviceName ?? a.id,
          password: resolveValue(a),
        }))
        .filter(
          (e) =>
            e.password.length > 0 &&
            e.password !== "\u2026" &&
            !e.password.startsWith("[")
        ),
    [aliases, resolveValue]
  );

  const groups = detectPasswordReuse(entries);
  const uniquePasswords = new Set(entries.map((e) => e.password)).size;

  const rotationCandidates = useMemo(() => {
    if (breachRows === null) return [];

    const breachedIds = new Set(breachRows.flatMap((r) => r.entryIds));
    const breachCountById = new Map<string, number>();
    for (const row of breachRows) {
      for (const id of row.entryIds) {
        breachCountById.set(id, row.breachCount);
      }
    }

    const reuseCountById = new Map<string, number>();
    for (const g of groups) {
      for (const id of g.entryIds) {
        reuseCountById.set(id, g.entryIds.length);
      }
    }

    return rankVaultPasswordsForRotation(
      entries.map((e) => ({
        id: e.id,
        label: e.label,
        isBreached: breachedIds.has(e.id),
        breachCount: breachCountById.get(e.id) ?? 0,
        reuseCount: reuseCountById.get(e.id) ?? 1,
      }))
    );
  }, [breachRows, entries, groups]);

  const playbookSteps = useMemo(() => {
    if (breachRows === null) return [];
    const breachedCount = breachRows.reduce((n, r) => n + r.entryIds.length, 0);
    return buildVaultCompromisePlaybook({
      breachedEntryCount: breachedCount,
      reuseGroupCount: groups.length,
      topRotationLabels: rotationCandidates.map((c) => c.label),
    });
  }, [breachRows, groups.length, rotationCandidates]);

  const checkBreaches = useCallback(async () => {
    if (entries.length === 0) return;
    setBreachBusy(true);
    setBreachError(null);
    setBreachRows(null);

    const byPassword = new Map<
      string,
      { entryIds: string[]; labels: string[] }
    >();
    for (const e of entries) {
      const existing = byPassword.get(e.password);
      if (existing) {
        existing.entryIds.push(e.id);
        existing.labels.push(e.label);
      } else {
        byPassword.set(e.password, {
          entryIds: [e.id],
          labels: [e.label],
        });
      }
    }

    const breached: BreachRow[] = [];
    try {
      for (const [, group] of byPassword) {
        const sample = entries.find((e) => e.id === group.entryIds[0]);
        if (!sample) continue;
        const result = await checkPasswordPwned(sample.password);
        if (result.breached) {
          breached.push({
            entryIds: group.entryIds,
            labels: group.labels,
            breachCount: result.breachCount,
          });
        }
        await new Promise((r) => setTimeout(r, 350));
      }
      setBreachRows(breached);
    } catch {
      setBreachError(
        "Breach check unavailable. HIBP may be rate-limited or offline."
      );
    } finally {
      setBreachBusy(false);
    }
  }, [entries]);

  if (entries.length === 0) {
    return (
      <section className="mb-6 rounded-xl border border-ph-border bg-ph-surface p-5">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-wide text-ph-text-muted">
          Password audit · Brain
        </div>
        <p className="mt-2 font-sans text-sm text-ph-text-tertiary">
          Unlock the vault to run reuse detection and rotation recommendations.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-6 rounded-xl border border-ph-border bg-ph-surface p-5">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-wide text-ph-text-muted">
        Password audit · Brain
      </div>
      <p className="mt-2 font-sans text-xs text-ph-text-tertiary">
        {uniquePasswords} unique passwords across {entries.length} vault entries.
      </p>
      {groups.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {groups.map((g) => (
            <li
              key={g.passwordFingerprint}
              className="rounded-lg border border-ph-warning/30 bg-ph-warning/5 px-3 py-2"
            >
              <span className="font-sans text-xs font-medium text-ph-warning">
                Reused on {g.entryIds.length} services
              </span>
              <ul className="mt-1 space-y-0.5">
                {g.labels.map((name) => (
                  <li key={name} className="font-sans text-[11px] text-ph-text-tertiary">
                    · {name}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 font-sans text-sm text-ph-success">
          No password reuse detected in unlocked entries.
        </p>
      )}

      <div className="mt-5 border-t border-ph-borderSubtle pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wide text-ph-text-muted">
              Breach check · Shield
            </p>
            <p className="mt-1 font-sans text-[11px] text-ph-text-tertiary">
              k-anonymity lookup via HIBP — password never leaves this device.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void checkBreaches()}
            disabled={breachBusy}
            aria-busy={breachBusy}
            className="rounded-md border border-ph-accent-border bg-ph-accent/[0.12] px-3 py-1.5 font-sans text-xs font-medium text-ph-accent-light hover:bg-ph-accent/[0.2] disabled:opacity-50"
          >
            {breachBusy ? "Checking…" : "Check breaches"}
          </button>
        </div>

        {breachError ? (
          <p className="mt-3 font-sans text-xs text-ph-danger" role="alert">
            {breachError}
          </p>
        ) : null}

        {breachRows !== null && !breachBusy ? (
          breachRows.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {breachRows.map((row) => (
                <li
                  key={row.entryIds.join("-")}
                  className="rounded-lg border border-ph-danger/30 bg-ph-danger/5 px-3 py-2"
                >
                  <span className="font-sans text-xs font-medium text-ph-danger">
                    Found in {row.breachCount.toLocaleString()} known breaches
                  </span>
                  <ul className="mt-1 space-y-0.5">
                    {row.labels.map((name) => (
                      <li
                        key={name}
                        className="font-sans text-[11px] text-ph-text-tertiary"
                      >
                        · {name}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 font-sans text-sm text-ph-success">
              No known breaches for unlocked vault passwords.
            </p>
          )
        ) : null}
      </div>

      {rotationCandidates.length > 0 ? (
        <div className="mt-5 border-t border-ph-borderSubtle pt-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-wide text-ph-text-muted">
            Rotate these first · Autopilot
          </p>
          <ul className="mt-3 space-y-2">
            {rotationCandidates.map((c) => (
              <li
                key={c.entryId}
                className="rounded-lg border border-ph-borderSubtle bg-ph-bg-base px-3 py-2"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-sans text-xs font-medium text-ph-text-primary">
                    #{c.priorityRank} {c.label}
                  </span>
                  <span className="font-mono text-[10px] text-ph-warning">
                    priority {c.score}
                  </span>
                </div>
                <p className="mt-1 font-sans text-[11px] text-ph-text-tertiary">
                  {c.reason}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {playbookSteps.length > 0 ? (
        <div className="mt-5 border-t border-ph-borderSubtle pt-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-wide text-ph-text-muted">
            Compromise response playbook · Autopilot
          </p>
          <ol className="mt-3 space-y-2">
            {playbookSteps.map((step) => (
              <li
                key={step.id}
                className="rounded-lg border border-ph-borderSubtle bg-ph-bg-base px-3 py-2"
              >
                <span className="font-sans text-xs font-medium text-ph-text-primary">
                  {step.priority}. {step.title}
                </span>
                <p className="mt-1 font-sans text-[11px] text-ph-text-tertiary">
                  {step.description}
                </p>
                {step.id === "enable_autopilot" ? (
                  <Link
                    to="/settings"
                    className="mt-1 inline-block font-sans text-[11px] text-ph-accent-light hover:underline"
                  >
                    Open Settings
                  </Link>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
