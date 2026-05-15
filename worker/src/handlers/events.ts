import { cachedFetch, fetchJson } from "../lib/cache.js";
import { corsHeaders } from "../lib/cors.js";
import type { Env } from "../env.js";

export async function handleEvents(
  req: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 100);
  const offset = Number(url.searchParams.get("offset") ?? "0");
  const activeParam = url.searchParams.get("active");
  const closedParam = url.searchParams.get("closed");
  const tag = url.searchParams.get("tag") ?? "";

  const upstream = new URL(`${env.GAMMA_BASE}/events`);
  upstream.searchParams.set("limit", String(limit));
  upstream.searchParams.set("offset", String(offset));
  upstream.searchParams.set("order", "volume24hr");
  upstream.searchParams.set("ascending", "false");
  if (activeParam) upstream.searchParams.set("active", activeParam);
  if (closedParam) upstream.searchParams.set("closed", closedParam);
  if (tag) upstream.searchParams.set("tag_slug", tag);

  const cacheKey = `events:${limit}:${offset}:${activeParam ?? ""}:${closedParam ?? ""}:${tag}`;

  const result = await cachedFetch<unknown[]>(env, {
    key: cacheKey,
    ttlSeconds: 90,
    fetchUpstream: () => fetchJson(upstream.toString()),
    ctx,
  });

  const cors = corsHeaders(req, env);
  return Response.json(
    {
      data: result.data,
      meta: { cacheStatus: result.cacheStatus, fetchedAt: result.fetchedAt },
    },
    { headers: { ...cors, "X-Cache": result.cacheStatus } },
  );
}
