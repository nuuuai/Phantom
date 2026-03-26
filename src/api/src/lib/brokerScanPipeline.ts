/**
 * Simulated parallel broker scan workers with a small per-item delay (rate / backpressure).
 */

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
