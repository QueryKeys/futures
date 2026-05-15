// Trader leaderboard hook backed by /api/sharks. The serverless function
// handles the trade aggregation + per-wallet /positions fan-out so the
// browser only makes one round trip.

import { useCallback, useEffect, useState } from 'react';
import { normalizeTrader } from './enrichers.js';

async function fetchSharks({ minSize = 5000, n = 18 } = {}) {
  const res = await fetch(`/api/sharks?min=${minSize}&n=${n}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`sharks ${res.status}`);
  return res.json();
}

export function useSharks({ minSize = 5000, n = 18 } = {}) {
  const [traders, setTraders] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSharks({ minSize, n });
      setTraders((data.traders ?? []).map(normalizeTrader));
      setLastUpdated(data.lastUpdated ?? null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [minSize, n]);

  useEffect(() => {
    load();
  }, [load, tick]);

  return {
    traders,
    lastUpdated,
    loading,
    error,
    refresh: () => setTick((t) => t + 1),
  };
}
