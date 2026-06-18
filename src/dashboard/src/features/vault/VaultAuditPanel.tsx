import type { Alias } from "@phantom/shared";
import { checkPasswordPwned, detectPasswordReuse } from "@phantom/shared";
import { useCallback, useMemo, useState } from "react";

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
    </section>
  );
}
