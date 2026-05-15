// Polymarket Gamma + Data API client.
//
// In dev we route through the Vite proxy (vite.config.js) to dodge CORS.
// In prod we hit the public origins directly — both Gamma and Data API send
// permissive CORS headers as of writing. If a deployment surface ever blocks
// them, flip USE_VERCEL_PROXY to true and the requests will go through
// /api/proxy?url=... (see api/proxy.js).

const USE_VERCEL_PROXY = false;

const ORIGINS = {
  gamma: 'https://gamma-api.polymarket.com',
  data: 'https://data-api.polymarket.com',
};

function endpoint(api, path) {
  if (import.meta.env.DEV) {
    // dev → vite proxy
    return `/api/${api}${path}`;
  }
  if (USE_VERCEL_PROXY) {
    const target = `${ORIGINS[api]}${path}`;
    return `/api/proxy?url=${encodeURIComponent(target)}`;
  }
  return `${ORIGINS[api]}${path}`;
}

// ---------------------------------------------------------------------------
// In-memory TTL cache. 60s default, configurable per call.
// ---------------------------------------------------------------------------
const cache = new Map(); // key -> { value, expires }

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expires < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function cacheSet(key, value, ttlMs) {
  cache.set(key, { value, expires: Date.now() + ttlMs });
}

async function fetchJSON(url, { ttl = 60_000, signal } = {}) {
  const cached = cacheGet(url);
  if (cached) return cached;

  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Polymarket ${res.status} on ${url}`);
  }
  const data = await res.json();
  cacheSet(url, data, ttl);
  return data;
}

function qs(params) {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) v.forEach((item) => search.append(k, String(item)));
    else search.append(k, String(v));
  }
  return search.toString() ? `?${search.toString()}` : '';
}

// ---------------------------------------------------------------------------
// Gamma — markets & events
// ---------------------------------------------------------------------------

/**
 * Fetch active markets ordered by 24h volume.
 * @param {object} opts
 * @param {number} opts.limit defaults to 500
 * @param {string} opts.order defaults to 'volume24hr'
 */
export async function getMarkets(opts = {}) {
  const params = {
    active: true,
    closed: false,
    archived: false,
    limit: opts.limit ?? 500,
    order: opts.order ?? 'volume24hr',
    ascending: false,
    ...opts.extra,
  };
  const data = await fetchJSON(endpoint('gamma', `/markets${qs(params)}`));
  return Array.isArray(data) ? data : data.data || [];
}

/**
 * Fetch all events (used for richer category mapping).
 */
export async function getEvents(opts = {}) {
  const params = {
    active: true,
    closed: false,
    limit: opts.limit ?? 200,
    order: opts.order ?? 'volume24hr',
    ascending: false,
    ...opts.extra,
  };
  const data = await fetchJSON(endpoint('gamma', `/events${qs(params)}`));
  return Array.isArray(data) ? data : data.data || [];
}

/**
 * Single market lookup.
 */
export async function getMarket(id) {
  const data = await fetchJSON(endpoint('gamma', `/markets/${id}`));
  return data;
}

// ---------------------------------------------------------------------------
// Data API — positions & activity
// ---------------------------------------------------------------------------

/**
 * Whale positions. The user param accepts a wallet address.
 */
export async function getPositions(address, opts = {}) {
  if (!address) throw new Error('getPositions requires an address');
  const params = {
    user: address,
    limit: opts.limit ?? 50,
    sortBy: opts.sortBy ?? 'CURRENT',
    sortDirection: 'DESC',
  };
  const data = await fetchJSON(endpoint('data', `/positions${qs(params)}`));
  return Array.isArray(data) ? data : data.data || [];
}

/**
 * Recent trades for a single market — feeds the per-market shark feed.
 * Note: the Data API endpoint is /trades (not /activity), and the market
 * filter key is `market` matching the conditionId.
 */
export async function getMarketTrades(conditionId, opts = {}) {
  if (!conditionId) throw new Error('getMarketTrades requires a conditionId');
  const params = {
    market: conditionId,
    limit: opts.limit ?? 100,
  };
  const data = await fetchJSON(endpoint('data', `/trades${qs(params)}`));
  return Array.isArray(data) ? data : data.data || [];
}

/**
 * Latest trades across the platform. Pass `minSize` (USD) to surface
 * whale-sized fills only — the API supports filterType=CASH + filterAmount.
 */
export async function getRecentTrades({ limit = 100, minSize } = {}) {
  const params = { limit };
  if (minSize) {
    params.filterType = 'CASH';
    params.filterAmount = minSize;
  }
  const data = await fetchJSON(endpoint('data', `/trades${qs(params)}`));
  return Array.isArray(data) ? data : data.data || [];
}

export const _internal = { cache, endpoint };
