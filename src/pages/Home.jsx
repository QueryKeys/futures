import { useMemo, useState } from 'react';
import { CategoryTabs } from '../components/CategoryTabs.jsx';
import { MarketCard, MarketCardSkeleton } from '../components/MarketCard.jsx';
import { useMarkets } from '../lib/useMarkets.js';
import { useFavorites } from '../lib/useFavorites.js';
import { CATEGORIES } from '../config/categories.js';

export function Home() {
  const [activeCategory, setActiveCategory] = useState('all');
  const { data: markets, loading, error } = useMarkets();
  const { isFavorite, toggle } = useFavorites();

  const counts = useMemo(() => {
    const out = { all: markets.length };
    for (const m of markets) out[m.category] = (out[m.category] ?? 0) + 1;
    return out;
  }, [markets]);

  const visible = useMemo(() => {
    if (activeCategory === 'all') return markets;
    return markets.filter((m) => m.category === activeCategory);
  }, [markets, activeCategory]);

  const openMarket = (m) => {
    if (m.slug) window.open(`https://polymarket.com/market/${m.slug}`, '_blank', 'noopener');
  };

  return (
    <div className="min-h-screen">
      <CategoryTabs active={activeCategory} onChange={setActiveCategory} counts={counts} />

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-6">
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text">
              {CATEGORIES.find((c) => c.slug === activeCategory)?.label ?? 'הכל'}
            </h1>
            <p className="text-sm text-text-muted mt-1">
              <bdi className="num">{visible.length}</bdi> שווקים פעילים, מסודרים לפי נפח 24 שעות
            </p>
          </div>
        </header>

        {error && <ErrorBanner error={error} />}

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 9 }).map((_, i) => <MarketCardSkeleton key={i} />)
            : visible.map((m) => (
                <MarketCard
                  key={m.id}
                  question={m.question}
                  probability={m.probability}
                  daysLeft={m.daysLeft}
                  category={m.category}
                  categoryLabel={m.categoryLabel}
                  side={m.side}
                  isSmartMoney={m.isSmartMoney}
                  liquidity={m.liquidity}
                  volume24={m.volume24}
                  image={m.image}
                  isFavorite={isFavorite(m.id)}
                  onToggleFavorite={() => toggle(m)}
                  onClick={() => openMarket(m)}
                />
              ))}
        </div>

        {!loading && visible.length === 0 && (
          <div className="mt-12 text-center text-text-muted">
            <p>אין שווקים בקטגוריה זו כרגע.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorBanner({ error }) {
  return (
    <div className="mb-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
      <p className="font-semibold">שגיאה בטעינת שווקים</p>
      <p className="text-xs opacity-80">{String(error.message ?? error)}</p>
    </div>
  );
}
