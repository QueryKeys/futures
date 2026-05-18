import { Crosshair, RefreshCw, Info } from 'lucide-react';
import { TraderCard, TraderCardSkeleton } from '../components/TraderCard.jsx';
import { useSharks } from '../lib/useSharks.js';

export function SharksRadar() {
  const { traders, loading, error, refresh, lastUpdated } = useSharks({
    minSize: 5000,
    n: 18,
  });

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
              סוחרים מובילים לפי פעילות לוויתנים בזמן אמת. רווח מחושב מסכום ה-cashPnl על פוזיציות פתוחות ב-Polymarket. תגיות אוטומטיות מסמנות מהלך פנימי, לוויתן מנצח ומחזיר חזק.
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
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
            {lastUpdated && (
              <>
                {' '}
                · עדכון אחרון:{' '}
                <bdi className="num">{new Date(lastUpdated).toLocaleTimeString('he-IL')}</bdi>
              </>
            )}
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
