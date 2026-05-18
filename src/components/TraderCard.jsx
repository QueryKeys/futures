import { TrendingUp, TrendingDown, Clock, Activity, Wallet } from 'lucide-react';
import { cn } from '../lib/cn.js';
import { fmtUsd, fmtInt, fmtPercent } from '../lib/enrichers.js';

const TAG_COLOR = {
  cta: 'bg-cta/15 text-cta border-cta/40',
  primary: 'bg-primary/15 text-primary border-primary/40',
  smart: 'bg-smart/15 text-smart border-smart/40',
};

export function TraderCard({ trader }) {
  const pnlPositive = trader.pnl >= 0;
  const sideIsYes = trader.side === 'yes' || String(trader.side).toLowerCase() === 'yes';

  return (
    <article className="rounded-2xl border border-border bg-bg-card p-5 card-hover-ring animate-fade-in">
      <header className="flex items-center gap-3 mb-4">
        {trader.avatar ? (
          <img
            src={trader.avatar}
            alt=""
            className="h-12 w-12 rounded-full bg-bg-elevated object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-bg-elevated grid place-items-center text-text-dim">
            <Wallet className="h-5 w-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text truncate">{trader.username}</p>
          <p className="text-[11px] text-text-dim font-mono truncate">
            <bdi className="num">{trader.address.slice(0, 6)}…{trader.address.slice(-4)}</bdi>
          </p>
        </div>
        <div className="text-end">
          <div
            className={cn(
              'flex items-center gap-1 text-sm font-bold tabular-nums',
              pnlPositive ? 'text-primary' : 'text-danger'
            )}
          >
            {pnlPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <bdi className="num">{fmtUsd(trader.pnl)}</bdi>
          </div>
          <p className="text-[10px] text-text-dim">רווח פוזיציות פתוחות</p>
        </div>
      </header>

      {trader.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {trader.tags.map((tag) => (
            <span
              key={tag.slug}
              className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', TAG_COLOR[tag.color])}
            >
              {tag.label}
            </span>
          ))}
        </div>
      )}

      {trader.position && (
        <div className="rounded-xl bg-bg-elevated p-3 mb-3">
          <p className="text-[11px] text-text-dim mb-1">פוזיציה אחרונה</p>
          <p className="text-sm text-text font-medium line-clamp-2">{trader.position}</p>
          <div className="mt-2 flex items-center gap-2 text-[11px]">
            <span
              className={cn(
                'px-1.5 py-0.5 rounded font-bold uppercase',
                sideIsYes ? 'bg-primary/20 text-primary' : 'bg-danger/20 text-danger'
              )}
            >
              {sideIsYes ? 'כן' : 'לא'}
            </span>
            <span className="text-text-muted">
              ב-<bdi className="num">{fmtPercent(trader.entryPrice, 0)}</bdi>
            </span>
            <span className="text-text-dim">·</span>
            <span className="text-text-muted">
              <bdi className="num">{fmtUsd(trader.entrySize)}</bdi>
            </span>
          </div>
        </div>
      )}

      <footer className="grid grid-cols-3 gap-3 text-center text-[11px]">
        <Stat icon={<Clock className="h-3 w-3" />} label="לפני">
          <bdi className="num">{trader.hoursAgo > 0 ? `${Math.round(trader.hoursAgo)}ש` : '—'}</bdi>
        </Stat>
        <Stat icon={<Activity className="h-3 w-3" />} label="עסקאות">
          <bdi className="num">{fmtInt(trader.txCount)}</bdi>
        </Stat>
        <Stat label="תשואה">
          <bdi className={cn('num', trader.pnlPct >= 0 ? 'text-primary' : 'text-danger')}>
            {trader.pnlPct ? `${(trader.pnlPct * 100).toFixed(0)}%` : '—'}
          </bdi>
        </Stat>
      </footer>
    </article>
  );
}

function Stat({ icon, label, children }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-1 text-text-dim mb-0.5">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-text font-medium">{children}</div>
    </div>
  );
}

export function TraderCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-bg-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-12 w-12 rounded-full shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/2 rounded shimmer" />
          <div className="h-3 w-2/3 rounded shimmer" />
        </div>
      </div>
      <div className="h-16 rounded-xl shimmer mb-3" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-8 rounded shimmer" />
        <div className="h-8 rounded shimmer" />
        <div className="h-8 rounded shimmer" />
      </div>
    </div>
  );
}
