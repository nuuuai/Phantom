/**
 * Simulated parallel broker scan workers with a small per-item delay (rate / backpressure).
 */

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
