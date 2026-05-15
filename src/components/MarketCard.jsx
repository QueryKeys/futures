import { Bookmark, BookmarkCheck, TrendingUp, TrendingDown, Clock, Droplet } from 'lucide-react';
import { cn } from '../lib/cn.js';
import { fmtPercent, fmtUsd, fmtDays } from '../lib/enrichers.js';
import { CATEGORY_BY_SLUG } from '../config/categories.js';

/**
 * MarketCard — single Polymarket market tile.
 *
 * Props (all derived by lib/enrichers.js#normalizeMarket):
 *  - question:      string  (Hebrew or English; we render as-is)
 *  - probability:   number  in [0, 1]
 *  - daysLeft:      number | null
 *  - category:      slug from config/categories.js
 *  - side:          'yes' | 'no'    — which side is the market leaning toward
 *  - isSmartMoney:  boolean         — pink ribbon when true
 *  - liquidity:     number          — USD
 *  - volume24:      number          — USD
 *  - image:         optional thumb
 *  - onToggleFavorite, isFavorite — supplied by Home page from useFavorites
 *  - onClick — open detail modal / external (optional)
 */
export function MarketCard({
  question,
  probability,
  daysLeft,
  category,
  side = 'yes',
  isSmartMoney = false,
  liquidity,
  volume24,
  image,
  isFavorite = false,
  onToggleFavorite,
  onClick,
}) {
  const cat = CATEGORY_BY_SLUG[category] ?? CATEGORY_BY_SLUG.all;
  const probPct = probability != null ? Math.round(probability * 100) : null;
  const sideIsYes = side === 'yes';

  return (
    <article
      onClick={onClick}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-bg-card p-5',
        'card-hover-ring cursor-pointer animate-fade-in'
      )}
    >
      {isSmartMoney && <span className="smart-ribbon" data-label="כסף חכם" aria-hidden />}

      <header className="flex items-start gap-3">
        {image ? (
          <img
            src={image}
            alt=""
            className="h-11 w-11 shrink-0 rounded-lg object-cover bg-bg-elevated"
            loading="lazy"
          />
        ) : (
          <div className="h-11 w-11 shrink-0 rounded-lg bg-bg-elevated grid place-items-center text-text-dim text-xs">
            PM
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-text-muted px-1.5 py-0.5 rounded bg-bg-elevated">
              {cat.label}
            </span>
            {daysLeft != null && (
              <span className="flex items-center gap-1 text-[11px] text-text-dim">
                <Clock className="h-3 w-3" />
                <bdi className="num">{fmtDays(daysLeft)}</bdi>
              </span>
            )}
          </div>
          <h3 className="text-[15px] leading-snug font-medium text-text line-clamp-3">
            {question}
          </h3>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.();
          }}
          aria-label={isFavorite ? 'הסר מהמועדפים' : 'הוסף למועדפים'}
          className={cn(
            'shrink-0 rounded-lg p-1.5 transition-colors',
            isFavorite ? 'text-cta hover:text-cta-hover' : 'text-text-dim hover:text-text'
          )}
        >
          {isFavorite ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
        </button>
      </header>

      <div className="mt-5 flex items-end gap-3">
        <ProbabilityDial probability={probability} side={side} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
            {sideIsYes ? (
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-danger" />
            )}
            <span>{sideIsYes ? 'נטייה לכן' : 'נטייה ללא'}</span>
          </div>
          <p className="mt-0.5 text-2xl font-bold text-text">
            <bdi className="num">{probPct != null ? `${probPct}%` : '—'}</bdi>
          </p>
        </div>
      </div>

      <footer className="mt-4 pt-4 border-t border-border-subtle grid grid-cols-2 gap-3 text-[11px]">
        <Stat icon={<Droplet className="h-3 w-3" />} label="נזילות">
          <bdi className="num">{fmtUsd(liquidity)}</bdi>
        </Stat>
        <Stat label="נפח 24ש">
          <bdi className="num">{fmtUsd(volume24)}</bdi>
        </Stat>
      </footer>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className="flex-1 rounded-lg bg-primary px-3 py-2 text-[13px] font-semibold text-bg hover:bg-primary-hover transition-colors"
        >
          קנה כן · <bdi className="num">{probPct != null ? `${probPct}¢` : '—'}</bdi>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className="flex-1 rounded-lg bg-bg-elevated px-3 py-2 text-[13px] font-semibold text-text hover:bg-border transition-colors"
        >
          קנה לא · <bdi className="num">{probPct != null ? `${100 - probPct}¢` : '—'}</bdi>
        </button>
      </div>
    </article>
  );
}

function ProbabilityDial({ probability, side }) {
  const pct = probability != null ? Math.round(probability * 100) : 0;
  const angle = (pct / 100) * 360;
  const color = side === 'yes' ? '#00D67E' : '#EF4444';

  return (
    <div
      className="h-14 w-14 shrink-0 rounded-full grid place-items-center"
      style={{
        background: `conic-gradient(${color} ${angle}deg, #2A2A2A ${angle}deg)`,
      }}
      aria-hidden
    >
      <div className="h-11 w-11 rounded-full bg-bg-card grid place-items-center">
        <span className="text-[10px] text-text-muted">{fmtPercent(probability)}</span>
      </div>
    </div>
  );
}

function Stat({ icon, label, children }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-text-dim mb-0.5">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-text font-medium">{children}</div>
    </div>
  );
}

export function MarketCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-bg-card p-5 animate-pulse">
      <div className="flex gap-3">
        <div className="h-11 w-11 rounded-lg shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 rounded shimmer" />
          <div className="h-4 w-full rounded shimmer" />
          <div className="h-4 w-3/4 rounded shimmer" />
        </div>
      </div>
      <div className="mt-6 h-14 w-14 rounded-full shimmer" />
      <div className="mt-4 h-9 rounded-lg shimmer" />
    </div>
  );
}
