import { cachedFetch, fetchJson } from "../lib/cache.js";
import { corsHeaders } from "../lib/cors.js";
import type { Env } from "../env.js";

export async function handleSharks(
  req: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "30"), 100);
  const minSize = Number(url.searchParams.get("minSize") ?? "5000");

  // Fetch more than needed so we can filter by size client-side.
  const upstream = new URL(`${env.DATA_BASE}/activity`);
  upstream.searchParams.set("limit", String(Math.min(limit * 5, 500)));

  const cacheKey = `sharks:${minSize}`;

  const result = await cachedFetch<unknown[]>(env, {
    key: cacheKey,
    ttlSeconds: 30,
    fetchUpstream: () => fetchJson(upstream.toString()),
    ctx,
  });

  const raw = Array.isArray(result.data) ? result.data : [];
  const filtered = raw
    .filter((t): t is Record<string, unknown> => !!t && typeof t === "object")
    .filter((t) => {
      const size = Number(
        t["usdcSize"] ?? t["size"] ?? t["amount"] ?? 0,
      );
      return size >= minSize;
    })
    .slice(0, limit);

  const cors = corsHeaders(req, env);
  return Response.json(
    {
      data: filtered,
      meta: {
        cacheStatus: result.cacheStatus,
        fetchedAt: result.fetchedAt,
        total: filtered.length,
      },
    },
    { headers: { ...cors, "X-Cache": result.cacheStatus } },
  );
}
