import type { MarketsResponse } from "@poly-il/shared";

const WORKER_BASE =
  process.env.NEXT_PUBLIC_WORKER_BASE_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8787";

export interface FetchMarketsParams {
  limit?: number;
  active?: boolean;
  closed?: boolean;
}

export async function fetchMarkets(
  params: FetchMarketsParams = {},
  signal?: AbortSignal,
): Promise<MarketsResponse> {
  const u = new URL(`${WORKER_BASE}/api/markets`);
  if (params.limit) u.searchParams.set("limit", String(params.limit));
  if (params.active !== undefined)
    u.searchParams.set("active", String(params.active));
  if (params.closed !== undefined)
    u.searchParams.set("closed", String(params.closed));

  const res = await fetch(u.toString(), { signal });
  if (!res.ok) throw new Error(`Worker /api/markets failed: ${res.status}`);
  return (await res.json()) as MarketsResponse;
}

export interface FetchEventsParams {
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
  tag?: string;
}

export async function fetchEvents(
  params: FetchEventsParams = {},
  signal?: AbortSignal,
): Promise<{ data: unknown[]; meta: { cacheStatus: string; fetchedAt: number } }> {
  const u = new URL(`${WORKER_BASE}/api/events`);
  if (params.limit) u.searchParams.set("limit", String(params.limit));
  if (params.offset) u.searchParams.set("offset", String(params.offset));
  if (params.active !== undefined)
    u.searchParams.set("active", String(params.active));
  if (params.closed !== undefined)
    u.searchParams.set("closed", String(params.closed));
  if (params.tag) u.searchParams.set("tag", params.tag);

  const res = await fetch(u.toString(), { signal });
  if (!res.ok) throw new Error(`Worker /api/events failed: ${res.status}`);
  return (await res.json()) as { data: unknown[]; meta: { cacheStatus: string; fetchedAt: number } };
}

export interface FetchSharksParams {
  limit?: number;
  minSize?: number;
}

export async function fetchSharks(
  params: FetchSharksParams = {},
  signal?: AbortSignal,
): Promise<{ data: unknown[]; meta: { cacheStatus: string; fetchedAt: number; total: number } }> {
  const u = new URL(`${WORKER_BASE}/api/sharks`);
  if (params.limit) u.searchParams.set("limit", String(params.limit));
  if (params.minSize !== undefined)
    u.searchParams.set("minSize", String(params.minSize));

  const res = await fetch(u.toString(), { signal });
  if (!res.ok) throw new Error(`Worker /api/sharks failed: ${res.status}`);
  return (await res.json()) as { data: unknown[]; meta: { cacheStatus: string; fetchedAt: number; total: number } };
}
