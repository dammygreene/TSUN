// In memory token bucket rate limiter for API routes. Per key buckets with a
// short window (burst) and an hour window (abuse). Resets on deploy, which is
// acceptable for the MVP; move to Redis/Upstash for multi instance production.

interface Bucket {
  minute: { count: number; resetAt: number };
  hour: { count: number; resetAt: number };
}

const buckets = new Map<string, Bucket>();

export const CHAT_LIMITS = { perMinute: 20, perHour: 200 } as const;

/** Test hook. */
export function __clearRateLimits(): void {
  buckets.clear();
}

export function checkRateLimit(key: string, nowMs = Date.now()): { ok: boolean; retryAfterMs: number } {
  let b = buckets.get(key);
  if (!b) {
    b = { minute: { count: 0, resetAt: nowMs + 60_000 }, hour: { count: 0, resetAt: nowMs + 3_600_000 } };
    buckets.set(key, b);
  }
  if (nowMs >= b.minute.resetAt) b.minute = { count: 0, resetAt: nowMs + 60_000 };
  if (nowMs >= b.hour.resetAt) b.hour = { count: 0, resetAt: nowMs + 3_600_000 };

  if (b.minute.count >= CHAT_LIMITS.perMinute) return { ok: false, retryAfterMs: b.minute.resetAt - nowMs };
  if (b.hour.count >= CHAT_LIMITS.perHour) return { ok: false, retryAfterMs: b.hour.resetAt - nowMs };
  b.minute.count += 1;
  b.hour.count += 1;
  return { ok: true, retryAfterMs: 0 };
}

/** Prune idle buckets so the map cannot grow forever. Call per request. */
export function pruneRateLimits(nowMs = Date.now()): void {
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) {
      if (nowMs >= b.hour.resetAt) buckets.delete(k);
    }
  }
}
