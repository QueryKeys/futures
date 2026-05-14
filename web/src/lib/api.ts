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
  if (!res.ok) {
    throw new Error(`Worker /api/markets failed: ${res.status}`);
  }
  return (await res.json()) as MarketsResponse;
}
