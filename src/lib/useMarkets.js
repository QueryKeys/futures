// Centralized markets fetching hook. Pulls the active set once, normalizes,
// and exposes loading / error / refresh.
import { useEffect, useState, useCallback } from 'react';
import { getMarkets } from './polymarket.js';
import { normalizeMarket } from './enrichers.js';

export function useMarkets({ limit = 500 } = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      setError(null);
      try {
        const raw = await getMarkets({ limit });
        if (signal?.aborted) return;
        setData(raw.map(normalizeMarket));
      } catch (e) {
        if (signal?.aborted) return;
        setError(e);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  return { data, loading, error, refresh: () => load() };
}
