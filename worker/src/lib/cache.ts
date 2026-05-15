import type { Env } from "../env.js";

/**
 * KV-backed cache with stale-while-revalidate, per-isolate single-flight,
 * and exponential-backoff retries for 429 / 5xx responses from upstream.
 *
 * Cache value shape:
 *   { v: <upstream JSON>, t: <epoch-ms when written>, ttl: <seconds> }
 *
 * Returned `cacheStatus`:
 *   - "HIT"   — fresh value served from KV.
 *   - "STALE" — value served from KV past its TTL while we revalidate (or
 *               because upstream failed and we have a fallback).
 *   - "MISS"  — no cached value; fetched fresh from upstream.
 */

export type CacheStatus = "HIT" | "MISS" | "STALE";

export interface CachedResult<T> {
  data: T;
  cacheStatus: CacheStatus;
  /** Epoch-ms when the cached value was originally fetched from upstream. */
  fetchedAt: number;
  /** Seconds the value is considered fresh. */
  ttl: number;
}

interface CacheEnvelope<T> {
  v: T;
  t: number;
  ttl: number;
}

/** Per-isolate in-flight registry for request coalescing. */
const inFlight = new Map<string, Promise<unknown>>();

export interface CachedFetchOptions {
  /** KV key the value will be stored under. */
  key: string;
  /** Fresh window in seconds. */
  ttlSeconds: number;
  /**
   * How long past `ttlSeconds` a stale value remains in KV and may still be
   * served while a refresh is in flight or if upstream errors. Defaults to
   * 10× `ttlSeconds` (capped at 24h).
   */
  staleSeconds?: number;
  /** Whether to log HIT/MISS/STALE to the Worker console. Defaults to true. */
  log?: boolean;
  /** Upstream fetcher. Must return a parsed JSON value. */
  fetchUpstream: () => Promise<unknown>;
  /**
   * Cloudflare `ExecutionContext` — used to perform stale-while-revalidate
   * refreshes in the background without blocking the response.
   */
  ctx?: ExecutionContext;
}

export async function cachedFetch<T>(
  env: Env,
  opts: CachedFetchOptions,
): Promise<CachedResult<T>> {
  const {
    key,
    ttlSeconds,
    staleSeconds = Math.min(ttlSeconds * 10, 86_400),
    log = true,
    fetchUpstream,
    ctx,
  } = opts;

  const now = Date.now();
  const stored = await env.POLY_CACHE.get<CacheEnvelope<T>>(key, "json");

  if (stored) {
    const ageSec = (now - stored.t) / 1000;
    if (ageSec <= stored.ttl) {
      if (log) console.log(`[cache] HIT  ${key} age=${ageSec.toFixed(1)}s`);
      return {
        data: stored.v,
        cacheStatus: "HIT",
        fetchedAt: stored.t,
        ttl: stored.ttl,
      };
    }

    // Stale: serve immediately, refresh in background.
    if (log)
      console.log(`[cache] STALE ${key} age=${ageSec.toFixed(1)}s (revalidating)`);
    if (ctx) {
      ctx.waitUntil(
        coalesce(key, async () => {
          try {
            const fresh = await fetchWithRetry(fetchUpstream);
            await writeCache<T>(env, key, fresh as T, ttlSeconds, staleSeconds);
          } catch (err) {
            console.warn(`[cache] revalidate failed ${key}:`, err);
          }
        }),
      );
    }
    return {
      data: stored.v,
      cacheStatus: "STALE",
      fetchedAt: stored.t,
      ttl: stored.ttl,
    };
  }

  // Miss: must fetch (coalesced).
  if (log) console.log(`[cache] MISS ${key}`);
  try {
    const fresh = (await coalesce(key, () =>
      fetchWithRetry(fetchUpstream),
    )) as T;
    await writeCache<T>(env, key, fresh, ttlSeconds, staleSeconds);
    return {
      data: fresh,
      cacheStatus: "MISS",
      fetchedAt: Date.now(),
      ttl: ttlSeconds,
    };
  } catch (err) {
    // Last resort: re-check KV (another coalesced request may have populated
    // a stale-but-acceptable value between our initial read and the failure).
    const fallback = await env.POLY_CACHE.get<CacheEnvelope<T>>(key, "json");
    if (fallback) {
      console.warn(
        `[cache] upstream failed for ${key}, serving stale fallback`,
        err,
      );
      return {
        data: fallback.v,
        cacheStatus: "STALE",
        fetchedAt: fallback.t,
        ttl: fallback.ttl,
      };
    }
    throw err;
  }
}

async function writeCache<T>(
  env: Env,
  key: string,
  v: T,
  ttl: number,
  stale: number,
): Promise<void> {
  const envelope: CacheEnvelope<T> = { v, t: Date.now(), ttl };
  // Keep stale data around for `ttl + stale` total seconds.
  await env.POLY_CACHE.put(key, JSON.stringify(envelope), {
    expirationTtl: Math.max(60, ttl + stale),
  });
}

function coalesce<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;
  const p = fn().finally(() => {
    if (inFlight.get(key) === p) inFlight.delete(key);
  });
  inFlight.set(key, p);
  return p;
}

/**
 * Run a JSON-returning upstream fetch with exponential backoff for 429s
 * and transient 5xx responses. Max 3 retries: 1s → 2s → 4s.
 */
export async function fetchWithRetry(
  fn: () => Promise<unknown>,
  maxAttempts = 3,
): Promise<unknown> {
  let attempt = 0;
  let lastErr: unknown;
  while (attempt <= maxAttempts) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = (err as { status?: number } | undefined)?.status;
      const retriable =
        status === 429 || (typeof status === "number" && status >= 500);
      if (!retriable || attempt === maxAttempts) break;
      const wait = 1000 * 2 ** attempt;
      console.warn(
        `[cache] upstream ${status ?? "ERR"} — retry in ${wait}ms (attempt ${attempt + 1}/${maxAttempts})`,
      );
      await sleep(wait);
      attempt++;
    }
  }
  throw lastErr;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Helper for upstream `fetch` calls that should surface HTTP errors as
 * thrown objects carrying `.status` so `fetchWithRetry` can react to them.
 */
export class UpstreamError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string) {
    super(`upstream ${status}`);
    this.status = status;
    this.body = body;
  }
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new UpstreamError(res.status, body.slice(0, 500));
  }
  return (await res.json()) as T;
}
