/**
 * Simulated parallel broker scan workers with a small per-item delay (rate / backpressure).
 */

/**
 * Validates env before `POST /broker-scan/start`. Invalid values fail fast (503) so operators
 * fix config instead of silently falling back to defaults.
 */
export function validateBrokerScanRuntimeConfig():
  | { ok: true }
  | { ok: false; message: string } {
  const rawC = process.env.BROKER_SCAN_CONCURRENCY?.trim();
  if (rawC) {
    if (!/^\d+$/.test(rawC)) {
      return {
        ok: false,
        message: `BROKER_SCAN_CONCURRENCY must be an integer 1–32 (invalid: ${rawC})`,
      };
    }
    const n = Number.parseInt(rawC, 10);
    if (n < 1 || n > 32) {
      return {
        ok: false,
        message: `BROKER_SCAN_CONCURRENCY must be between 1 and 32 (got ${String(n)})`,
      };
    }
  }

  const rawD = process.env.BROKER_SCAN_WORKER_DELAY_MS?.trim();
  if (rawD) {
    if (!rawD.includes("-")) {
      return {
        ok: false,
        message:
          "BROKER_SCAN_WORKER_DELAY_MS must be a range min-max in milliseconds (e.g. 5-25)",
      };
    }
    const segments = rawD.split("-");
    if (segments.length !== 2) {
      return {
        ok: false,
        message:
          "BROKER_SCAN_WORKER_DELAY_MS must contain exactly one hyphen: min-max",
      };
    }
    const min = Number(segments[0]!.trim());
    const max = Number(segments[1]!.trim());
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return {
        ok: false,
        message:
          "BROKER_SCAN_WORKER_DELAY_MS min and max must be finite numbers",
      };
    }
    if (min < 0 || max < 0) {
      return {
        ok: false,
        message:
          "BROKER_SCAN_WORKER_DELAY_MS min and max must be non-negative",
      };
    }
    if (min > max) {
      return {
        ok: false,
        message: "BROKER_SCAN_WORKER_DELAY_MS min must be <= max",
      };
    }
    if (max > 120_000) {
      return {
        ok: false,
        message: "BROKER_SCAN_WORKER_DELAY_MS max must be <= 120000 (2 minutes)",
      };
    }
  }

  return { ok: true };
}

/** Default `min-max` milliseconds between per-broker worker steps. Override with `BROKER_SCAN_WORKER_DELAY_MS`. */
export function getBrokerScanWorkerDelayMs(): { min: number; max: number } {
  const raw = process.env.BROKER_SCAN_WORKER_DELAY_MS?.trim();
  if (raw?.includes("-")) {
    const parts = raw.split("-").map((s) => Number(s.trim()));
    if (
      parts.length === 2 &&
      Number.isFinite(parts[0]) &&
      Number.isFinite(parts[1]) &&
      parts[0]! >= 0 &&
      parts[1]! >= parts[0]!
    ) {
      return { min: parts[0]!, max: parts[1]! };
    }
  }
  return { min: 5, max: 25 };
}

export function randomDelayInRange(min: number, max: number): number {
  if (max < min) return min;
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Parallel workers for `/broker-scan/start`. Override with `BROKER_SCAN_CONCURRENCY` (1–32). */
export function getBrokerScanConcurrency(): number {
  const raw = process.env.BROKER_SCAN_CONCURRENCY?.trim();
  if (!raw) return 8;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return 8;
  return Math.max(1, Math.min(32, n));
}

export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const n = items.length;
  if (n === 0) return [];
  const results: R[] = new Array(n);
  let next = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const i = next++;
      if (i >= n) return;
      const item = items[i];
      if (item === undefined) return;
      results[i] = await fn(item, i);
    }
  }

  const workers = Math.max(1, Math.min(concurrency, n));
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}

export function delayMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
