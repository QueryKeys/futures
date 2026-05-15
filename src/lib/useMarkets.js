// Joint hook — loads active markets and whale trades in parallel, then
// enriches each market with the live whale signal (volume, count,
// isSmartMoney). One stop for every page that needs market data.
import { useEffect, useState, useCallback } from 'react';
import { getMarkets, getWhaleTrades } from './polymarket.js';
import {
  normalizeMarket,
  aggregateWhalesByMarket,
  enrichWithWhales,
} from './enrichers.js';

export function useMarkets({ limit = 500, whaleMin = 10_000, whaleLimit = 500 } = {}) {
  const [data, setData] = useState([]);
  const [whales, setWhales] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      setError(null);
      try {
        // Fire both requests in parallel — the Vite dev proxy and the
        // 60s TTL cache keep this cheap on subsequent navigations.
        const [rawMarkets, rawTrades] = await Promise.all([
          getMarkets({ limit }),
          getWhaleTrades({ minSize: whaleMin, limit: whaleLimit }).catch(() => []),
        ]);
        if (signal?.aborted) return;
        const whaleMap = aggregateWhalesByMarket(rawTrades);
        const normalized = rawMarkets.map(normalizeMarket);
        const enriched = enrichWithWhales(normalized, whaleMap);
        setWhales(whaleMap);
        setData(enriched);
      } catch (e) {
        if (signal?.aborted) return;
        setError(e);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [limit, whaleMin, whaleLimit]
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  return { data, whales, loading, error, refresh: () => load() };
}
