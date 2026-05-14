import type { Env } from "../env.js";

/**
 * Simple per-IP rate limit using KV counters bucketed by minute.
 *
 * Default budget: 60 requests / minute / IP across all `/api/*` endpoints.
 * KV write latency is ~ms; we intentionally don't await the increment on the
 * hot path beyond the first check — `ctx.waitUntil` is used by callers.
 *
 * This is a best-effort soft limit (KV is eventually consistent across colos),
 * not a hard security boundary.
 */
export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetSeconds: number;
  count: number;
  limit: number;
}

export async function checkIpRateLimit(
  env: Env,
  ip: string,
  limit = 60,
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(now / 60);
  const key = `rl:ip:${ip}:${bucket}`;

  const raw = await env.POLY_CACHE.get(key);
  const current = raw ? Number.parseInt(raw, 10) || 0 : 0;
  const next = current + 1;

  // 70s TTL > 60s bucket so the key is auto-cleaned shortly after rollover.
  await env.POLY_CACHE.put(key, String(next), { expirationTtl: 70 });

  const resetSeconds = (bucket + 1) * 60 - now;
  return {
    ok: next <= limit,
    remaining: Math.max(0, limit - next),
    resetSeconds,
    count: next,
    limit,
  };
}

export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(r.limit),
    "X-RateLimit-Remaining": String(r.remaining),
    "X-RateLimit-Reset": String(r.resetSeconds),
  };
}
