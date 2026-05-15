import { useMemo, useState } from 'react';
import { StrategyCard } from '../components/StrategyCard.jsx';
import { MarketCard, MarketCardSkeleton } from '../components/MarketCard.jsx';
import { useMarkets } from '../lib/useMarkets.js';
import { useFavorites } from '../lib/useFavorites.js';
import { STRATEGIES, applyStrategy, fmtPercent } from '../lib/enrichers.js';

export function MarketScanner() {
  const [active, setActive] = useState('smart_money');
  const { data: markets, loading, error } = useMarkets();
  const { isFavorite, toggle } = useFavorites();

  const counts = useMemo(() => {
    const out = {};
    for (const slug of Object.keys(STRATEGIES)) {
      out[slug] = applyStrategy(markets, slug).length;
    }
    return out;
  }, [markets]);

  const filtered = useMemo(() => applyStrategy(markets, active).slice(0, 36), [markets, active]);
  const strat = STRATEGIES[active];

  const openMarket = (m) => {
    if (m.slug) window.open(`https://polymarket.com/market/${m.slug}`, '_blank', 'noopener');
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-6">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-text">סורק שווקים</h1>
          <p className="text-sm text-text-muted mt-1">
            שלוש אסטרטגיות מוכנות. בחר טייל לסינון השווקים.
          </p>
        </header>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-8">
          {Object.values(STRATEGIES).map((s) => (
            <StrategyCard
              key={s.slug}
              strategy={s}
              count={counts[s.slug]}
              selected={active === s.slug}
              onSelect={() => setActive(s.slug)}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            שגיאה: {String(error.message ?? error)}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-bg-card/50 p-5 mb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-text-muted">תוצאות עבור</p>
              <h2 className="text-xl font-bold text-text">{strat.label}</h2>
            </div>
            <div className="text-end">
              <p className="text-sm text-text-muted">
                <bdi className="num">{filtered.length}</bdi> שווקים תואמים
              </p>
              {active === 'smart_money' && filtered.length > 0 && (
                <p className="text-xs text-smart mt-1">
                  תשואה שנתית ממוצעת:{' '}
                  <bdi className="num">
                    {fmtPercent(
                      filtered
                        .filter((m) => m.annualized != null)
                        .reduce((a, m) => a + m.annualized, 0) /
                        Math.max(
                          1,
                          filtered.filter((m) => m.annualized != null).length
                        )
                    )}
                  </bdi>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <MarketCardSkeleton key={i} />)
            : filtered.map((m) => (
                <MarketCard
                  key={m.id}
                  question={m.question}
                  probability={m.probability}
                  daysLeft={m.daysLeft}
                  category={m.category}
                  side={m.side}
                  isSmartMoney={active === 'smart_money'}
                  liquidity={m.liquidity}
                  volume24={m.volume24}
                  image={m.image}
                  isFavorite={isFavorite(m.id)}
                  onToggleFavorite={() => toggle(m)}
                  onClick={() => openMarket(m)}
                />
              ))}
        </div>

        {!loading && filtered.length === 0 && (
          <div className="mt-12 text-center text-text-muted">
            <p>אין שווקים תואמים כרגע. נסה אסטרטגיה אחרת.</p>
          </div>
        )}
      </div>
    </div>
  );
}
