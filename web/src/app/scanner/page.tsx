"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMarkets } from "@/lib/api";
import type { Market } from "@poly-il/shared";
import { fmtUsdCompact, fmtPct, fmtPctSigned, fmtDate } from "@/lib/format";
import { LivePill } from "@/components/ui/LivePill";

type Tier = "SMART_MONEY" | "CONSENSUS" | "SNIPER";

const TIER_CONFIG: Record<
  Tier,
  { tierLabel: string; heLabel: string; desc: string; color: string; bg: string; border: string }
> = {
  SMART_MONEY: {
    tierLabel: "Tier A",
    heLabel: "כסף חכם",
    desc: "תנועת מחיר חדה + מחזור גבוה ביחס לנזילות — סימן לכסף מוסדי",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/25",
  },
  CONSENSUS: {
    tierLabel: "Tier B",
    heLabel: "קונצנזוס",
    desc: "שוקים קרובים ל-50% עם מחזור גבוה — הכסף חלוק",
    color: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/25",
  },
  SNIPER: {
    tierLabel: "Tier C",
    heLabel: "הצלף",
    desc: "הסתברויות קיצוניות + נפח פעיל — משחקי ערך אסימטרי",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/25",
  },
};

function classifyMarket(m: Market): Tier | null {
  if (!m.active || m.closed || m.archived) return null;
  const yp = m.yesPrice;
  if (yp === null) return null;
  const v24 = m.volume24h;
  const liq = m.liquidity;
  const change = m.priceChange24h ?? 0;

  if (
    Math.abs(change) >= 0.05 &&
    liq > 0 &&
    v24 / liq > 0.3 &&
    v24 > 20_000 &&
    yp > 0.1 &&
    yp < 0.9
  )
    return "SMART_MONEY";

  if ((yp <= 0.15 || yp >= 0.85) && v24 > 5_000) return "SNIPER";

  if (yp >= 0.35 && yp <= 0.65 && v24 > 10_000 && liq > 30_000)
    return "CONSENSUS";

  return null;
}

function MarketCard({ market }: { market: Market }) {
  const yp = market.yesPrice ?? 0;
  const np = market.noPrice ?? 1 - yp;
  const change = market.priceChange24h;
  const changePos = change !== null && change > 0;
  const changeNeg = change !== null && change < 0;

  return (
    <div className="rounded-xl border border-border bg-bg-raised p-4 flex flex-col gap-3 hover:border-fg-subtle/40 transition-colors">
      <p className="text-sm text-fg leading-snug line-clamp-2 min-h-[2.5rem]">
        {market.question}
      </p>

      <div className="flex gap-2">
        <div className="flex-1 rounded-lg bg-success/10 border border-success/20 px-3 py-2 text-center">
          <div className="text-[10px] text-fg-subtle mb-0.5">כן</div>
          <div className="text-base font-semibold text-success num">{fmtPct(yp)}</div>
        </div>
        <div className="flex-1 rounded-lg bg-danger/10 border border-danger/20 px-3 py-2 text-center">
          <div className="text-[10px] text-fg-subtle mb-0.5">לא</div>
          <div className="text-base font-semibold text-danger num">{fmtPct(np)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span
          className={`num font-medium ${
            changePos ? "text-success" : changeNeg ? "text-danger" : "text-fg-subtle"
          }`}
        >
          {change !== null ? fmtPctSigned(change) : "—"}
        </span>
        <span className="num text-fg-subtle">{fmtUsdCompact(market.volume24h)} מחזור</span>
      </div>

      <div className="flex items-center justify-between text-xs text-fg-subtle border-t border-border pt-2">
        <span className="num">{fmtUsdCompact(market.liquidity)} נזילות</span>
        {market.endDate && <span className="num">{fmtDate(market.endDate)}</span>}
      </div>
    </div>
  );
}

function TierSection({ tier, markets }: { tier: Tier; markets: Market[] }) {
  const cfg = TIER_CONFIG[tier];
  return (
    <section>
      <div
        className={`inline-flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 mb-4 ${cfg.bg} ${cfg.border}`}
      >
        <span className={`text-xs font-mono ${cfg.color}`}>{cfg.tierLabel}</span>
        <span className={`text-sm font-bold ${cfg.color}`}>{cfg.heLabel}</span>
        <span className="text-fg-subtle text-xs hidden sm:inline">· {cfg.desc}</span>
        <span className={`text-xs font-medium ${cfg.color} num`}>({markets.length})</span>
      </div>
      {markets.length === 0 ? (
        <p className="text-fg-subtle text-sm py-4 px-1">אין שוקים בקטגוריה זו כרגע.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {markets.map((m) => (
            <MarketCard key={m.id} market={m} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function ScannerPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["markets", { active: true, closed: false, limit: 100 }],
    queryFn: ({ signal }) =>
      fetchMarkets({ active: true, closed: false, limit: 100 }, signal),
    refetchInterval: 60_000,
  });

  const tiers: Record<Tier, Market[]> = {
    SMART_MONEY: [],
    CONSENSUS: [],
    SNIPER: [],
  };

  if (data) {
    for (const m of data.markets) {
      const t = classifyMarket(m);
      if (t) tiers[t].push(m);
    }
    for (const arr of Object.values(tiers)) {
      arr.sort((a, b) => b.volume24h - a.volume24h);
    }
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <header className="sticky top-0 z-10 border-b border-border bg-bg/90 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-fg">סורק שוקים</h1>
          <p className="text-xs text-fg-subtle">ניתוח שלוש רמות בזמן אמת</p>
        </div>
        <div className="flex items-center gap-3">
          {data && (
            <span className="text-xs text-fg-subtle num">{data.markets.length} שוקים</span>
          )}
          <LivePill />
        </div>
      </header>

      <div className="px-4 py-6 space-y-10">
        {isLoading && (
          <div className="flex items-center justify-center h-64 text-fg-subtle">
            טוען שוקים…
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-3 h-64 justify-center">
            <p className="text-danger">שגיאה בטעינת הנתונים</p>
            <button
              onClick={() => refetch()}
              className="text-sm px-4 py-2 rounded-lg bg-danger/10 hover:bg-danger/20 transition-colors text-danger"
            >
              נסה שוב
            </button>
          </div>
        )}

        {data && (
          <>
            <TierSection tier="SMART_MONEY" markets={tiers.SMART_MONEY} />
            <TierSection tier="CONSENSUS" markets={tiers.CONSENSUS} />
            <TierSection tier="SNIPER" markets={tiers.SNIPER} />
          </>
        )}
      </div>
    </div>
  );
}
