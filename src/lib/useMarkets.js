// Joint hook — loads markets through /api/markets (themoneyradar proxy,
// pre-translated Hebrew) and whale trades from Polymarket Data API in
// parallel, then enriches each market with the live whale signal.
//
// Pages get one stable interface: { data, whales, loading, error, totalMarkets,
// lastUpdated, refresh }. Markets are already normalized + smart-money-flagged.

import { useEffect, useState, useCallback } from 'react';
import { getMarkets, normalizeMoneyRadarMarket } from './moneyradar.js';
import { getWhaleTrades } from './polymarket.js';
import { aggregateWhalesByMarket, enrichWithWhales } from './enrichers.js';

export function useMarkets({
  limit = 6000,
  translate = true,
  whaleMin = 10_000,
  whaleLimit = 500,
} = {}) {
  const [data, setData] = useState([]);
  const [whales, setWhales] = useState(new Map());
  const [totalMarkets, setTotalMarkets] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      setError(null);
      try {
        const [page, rawTrades] = await Promise.all([
          getMarkets({ limit, translate }),
          getWhaleTrades({ minSize: whaleMin, limit: whaleLimit }).catch(() => []),
        ]);
        if (signal?.aborted) return;

        const whaleMap = aggregateWhalesByMarket(rawTrades);
        const normalized = (page.markets ?? []).map(normalizeMoneyRadarMarket);
        const enriched = enrichWithWhales(normalized, whaleMap);

        setWhales(whaleMap);
        setData(enriched);
        setTotalMarkets(page.totalMarkets ?? enriched.length);
        setLastUpdated(page.lastUpdated ?? null);
      } catch (e) {
        if (signal?.aborted) return;
        setError(e);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [limit, translate, whaleMin, whaleLimit]
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  return {
    data,
    whales,
    totalMarkets,
    lastUpdated,
    loading,
    error,
    refresh: () => load(),
  };
}
