import {
  normalizeGammaMarket,
  type GammaMarketRaw,
  type Market,
} from "@poly-il/shared/types/polymarket";
import type { Env } from "../env.js";
import { cachedFetch, fetchJson } from "../lib/cache.js";

const MARKETS_TTL_SECONDS = 60;

interface MarketsQuery {
  limit: number;
  active: boolean;
  closed: boolean;
}

function parseQuery(url: URL): MarketsQuery {
  const limitRaw = url.searchParams.get("limit");
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(limitRaw ?? "20", 10) || 20),
  );

  const active = (url.searchParams.get("active") ?? "true") !== "false";
  const closed = (url.searchParams.get("closed") ?? "false") === "true";

  return { limit, active, closed };
}

function buildUpstreamUrl(env: Env, q: MarketsQuery): string {
  const u = new URL(`${env.GAMMA_BASE}/markets`);
  u.searchParams.set("active", String(q.active));
  u.searchParams.set("closed", String(q.closed));
  u.searchParams.set("limit", String(q.limit));
  return u.toString();
}

function cacheKey(q: MarketsQuery): string {
  return `markets:v1:active=${q.active}:closed=${q.closed}:limit=${q.limit}`;
}

export async function handleMarkets(
  req: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const url = new URL(req.url);
  const q = parseQuery(url);
  const upstream = buildUpstreamUrl(env, q);

  const result = await cachedFetch<GammaMarketRaw[]>(env, {
    key: cacheKey(q),
    ttlSeconds: MARKETS_TTL_SECONDS,
    ctx,
    fetchUpstream: () =>
      fetchJson<GammaMarketRaw[]>(upstream, {
        headers: { Accept: "application/json" },
      }),
  });

  const markets: Market[] = result.data.map(normalizeGammaMarket);

  const body = {
    markets,
    query: q,
    generatedAt: new Date(result.fetchedAt).toISOString(),
    cache: result.cacheStatus,
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${Math.min(MARKETS_TTL_SECONDS, 30)}`,
      "X-Cache": result.cacheStatus,
      "X-Cache-Age":
        result.cacheStatus === "MISS"
          ? "0"
          : String(Math.floor((Date.now() - result.fetchedAt) / 1000)),
    },
  });
}
