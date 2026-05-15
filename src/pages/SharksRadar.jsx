import { useEffect, useState } from 'react';
import { Crosshair, RefreshCw, Info } from 'lucide-react';
import { TraderCard, TraderCardSkeleton } from '../components/TraderCard.jsx';
import { getRecentTrades, getPositions } from '../lib/polymarket.js';
import { normalizeTrader } from '../lib/enrichers.js';

const WHALE_MIN_USD = 5_000;
const TOP_N = 18;

export function SharksRadar() {
  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // Step 1: pull whale-sized trades from the platform feed.
        // These are individual fills with the wallet metadata embedded.
        const trades = await getRecentTrades({ limit: 500, minSize: WHALE_MIN_USD });

        // Step 2: collapse trades by wallet, capturing the most recent
        // position metadata for the card body.
        const byUser = new Map();
        const now = Date.now();

        for (const t of trades) {
          const u = t.proxyWallet;
          if (!u) continue;
          const usd = Number(t.size ?? 0) * Number(t.price ?? 0);
          if (usd < WHALE_MIN_USD) continue;
          const tsMs = (Number(t.timestamp) || 0) * 1000;
          const hoursAgo = tsMs ? (now - tsMs) / 3_600_000 : Infinity;

          const cur = byUser.get(u) ?? {
            proxyWallet: u,
            name: t.name || t.pseudonym || null,
            profileImage: t.profileImage || null,
            volume: 0,
            trades: 0,
            recentEntryUsd: 0,
            recentEntryHoursAgo: Infinity,
            lastPositionTitle: null,
            lastPositionSide: null,
            lastEntryPrice: 0,
            lastEntrySize: 0,
          };
          cur.volume += usd;
          cur.trades += 1;
          if (hoursAgo < cur.recentEntryHoursAgo) {
            cur.recentEntryHoursAgo = hoursAgo;
            cur.recentEntryUsd = usd;
            cur.lastPositionTitle = t.title ?? null;
            cur.lastPositionSide = t.outcome === 'Yes' ? 'yes' : 'no';
            cur.lastEntryPrice = Number(t.price ?? 0);
            cur.lastEntrySize = usd;
          }
          byUser.set(u, cur);
        }

        const topWallets = [...byUser.values()]
          .sort((a, b) => b.volume - a.volume)
          .slice(0, TOP_N);

        // Step 3: fetch real PnL for each top wallet via /positions. The
        // sum of cashPnl across open positions is a reasonable 7d proxy.
        const enriched = await Promise.all(
          topWallets.map(async (w) => {
            try {
              const positions = await getPositions(w.proxyWallet, { limit: 50 });
              const pnl = positions.reduce((acc, p) => acc + Number(p.cashPnl ?? 0), 0);
              const initial = positions.reduce(
                (acc, p) => acc + Number(p.initialValue ?? 0),
                0
              );
              const pnlPct = initial > 0 ? pnl / initial : 0;
              return {
                ...w,
                pnl,
                pnlPct,
                lifetimeProfit: pnl, // best available without a separate endpoint
                txCount: w.trades,
              };
            } catch {
              return { ...w, pnl: 0, pnlPct: 0, lifetimeProfit: 0, txCount: w.trades };
            }
          })
        );

        if (cancelled) return;
        setTraders(
          enriched
            .sort((a, b) => b.pnl - a.pnl)
            .map(normalizeTrader)
        );
      } catch (e) {
        if (cancelled) return;
        setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-6">
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crosshair className="h-5 w-5 text-smart" />
              <h1 className="text-2xl md:text-3xl font-bold text-text">ראדאר לוויתנים</h1>
            </div>
            <p className="text-sm text-text-muted">
              סוחרים מובילים לפי הימור גבוה ב-7 ימים האחרונים. תגיות אוטומטיות מסמנות מהלך פנימי, לוויתן מנצח ומחזיר חזק.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="rounded-xl border border-border bg-bg-card p-2.5 text-text-muted hover:text-text transition-colors"
            aria-label="רענן"
          >
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          </button>
        </header>

        <div className="mb-4 flex items-start gap-2 rounded-xl border border-border-subtle bg-bg-card/50 px-4 py-3 text-xs text-text-muted">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-text-dim" />
          <p>
            הנתונים מצטברים מעסקאות שגודלן מעל <bdi className="num">$5,000</bdi>, מועשרים בנתוני פוזיציה אמיתיים מ-Polymarket Data API.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            <p className="font-semibold">לא הצלחנו לטעון את הלוויתנים</p>
            <p className="text-xs opacity-80">{String(error.message ?? error)}</p>
          </div>
        )}

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 9 }).map((_, i) => <TraderCardSkeleton key={i} />)
            : traders.map((t) => <TraderCard key={t.address} trader={t} />)}
        </div>

        {!loading && traders.length === 0 && !error && (
          <div className="mt-12 text-center text-text-muted">
            <p>אין מסחר משמעותי כרגע. חזור מאוחר יותר.</p>
          </div>
        )}
      </div>
    </div>
  );
}
