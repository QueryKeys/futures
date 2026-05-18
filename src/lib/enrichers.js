// Pure data-shaping helpers. All inputs are raw Polymarket payloads, all
// outputs are UI-friendly objects.

import { CATEGORIES } from '../config/categories.js';

const MS_PER_DAY = 86_400_000;

// ---------------------------------------------------------------------------
// price extraction — markets come back with `outcomePrices` as a JSON-encoded
// string array of two strings, e.g. '["0.62","0.38"]'. Older payloads expose
// `lastTradePrice`; we fall back to that.
// ---------------------------------------------------------------------------
function parseOutcomePrices(market) {
  const raw = market.outcomePrices ?? market.outcome_prices;
  if (!raw) return [null, null];
  if (Array.isArray(raw)) return raw.map(Number);
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(Number);
  } catch {
    /* fallthrough */
  }
  return [null, null];
}

function parseOutcomes(market) {
  const raw = market.outcomes;
  if (!raw) return ['Yes', 'No'];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* fallthrough */
  }
  return ['Yes', 'No'];
}

export function getYesProbability(market) {
  const [yes] = parseOutcomePrices(market);
  if (Number.isFinite(yes)) return yes;
  if (Number.isFinite(market.lastTradePrice)) return Number(market.lastTradePrice);
  return null;
}

export function daysUntilEnd(market) {
  const end = market.endDate ?? market.end_date_iso ?? market.endDateIso;
  if (!end) return null;
  const ts = new Date(end).getTime();
  if (Number.isNaN(ts)) return null;
  return Math.max(0, Math.ceil((ts - Date.now()) / MS_PER_DAY));
}

// ---------------------------------------------------------------------------
// classifyMarket — assigns a category slug based on keyword presence in the
// question/title/description text. Returns 'all' as a no-op fallback so the
// market still surfaces in the default tab.
// ---------------------------------------------------------------------------
export function classifyMarket(market) {
  const haystack = [
    market.question,
    market.title,
    market.description,
    market.slug,
    market.eventTitle,
    ...(Array.isArray(market.tags) ? market.tags : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  for (const cat of CATEGORIES) {
    if (cat.slug === 'all') continue;
    if (cat.keywords.some((kw) => haystack.includes(kw))) return cat.slug;
  }
  return 'all';
}

// ---------------------------------------------------------------------------
// Smart-money detection. A market is flagged when a known top whale holds a
// position >$10k AND the implied probability is < 80% — i.e. the whale is
// betting against consensus. The flag is computed lazily by the caller and
// passed in here, but we expose the same threshold as a helper.
// ---------------------------------------------------------------------------
export const SMART_MONEY_MIN_USD = 10_000;
export const SMART_MONEY_MAX_PROB = 0.8;

export function isSmartMoneyPosition(position) {
  const usd = Number(position.currentValue ?? position.size ?? 0);
  const prob = Number(position.curPrice ?? position.avgPrice ?? 0);
  return usd > SMART_MONEY_MIN_USD && prob < SMART_MONEY_MAX_PROB;
}

/**
 * Roll up raw whale trades (from /trades with filterAmount) into a per-market
 * signal — keyed by conditionId so it joins cleanly with /markets payloads.
 *
 * Returned shape per market:
 *   { volume, whaleCount, lastPrice, lastSide, hoursAgo, sample: [trade,…] }
 */
export function aggregateWhalesByMarket(trades) {
  const now = Date.now();
  const map = new Map();
  for (const t of trades) {
    const cid = t.conditionId;
    if (!cid) continue;
    const usd = Number(t.size ?? 0) * Number(t.price ?? 0);
    if (!Number.isFinite(usd) || usd < SMART_MONEY_MIN_USD) continue;
    const tsMs = (Number(t.timestamp) || 0) * 1000;
    const hoursAgo = tsMs ? (now - tsMs) / 3_600_000 : Infinity;
    const cur = map.get(cid) ?? {
      volume: 0,
      whales: new Set(),
      lastPrice: null,
      lastSide: null,
      hoursAgo: Infinity,
      sample: [],
    };
    cur.volume += usd;
    cur.whales.add(t.proxyWallet);
    if (hoursAgo < cur.hoursAgo) {
      cur.hoursAgo = hoursAgo;
      cur.lastPrice = Number(t.price);
      cur.lastSide = t.outcome === 'Yes' ? 'yes' : 'no';
    }
    if (cur.sample.length < 5) cur.sample.push(t);
    map.set(cid, cur);
  }
  // Materialize for consumption (Set → count, keep order).
  const out = new Map();
  for (const [cid, v] of map) {
    out.set(cid, {
      volume: v.volume,
      whaleCount: v.whales.size,
      lastPrice: v.lastPrice,
      lastSide: v.lastSide,
      hoursAgo: v.hoursAgo,
      sample: v.sample,
    });
  }
  return out;
}

/**
 * Apply a whale signal map (from aggregateWhalesByMarket) onto an array of
 * already-normalized markets. Adds `whaleVolume`, `whaleCount`, and an
 * `isSmartMoney` boolean (whales active AND prob < 80% — i.e. whales
 * betting *against* consensus on this market).
 */
export function enrichWithWhales(markets, whaleMap) {
  if (!whaleMap || whaleMap.size === 0) return markets;
  return markets.map((m) => {
    const signal = m.conditionId ? whaleMap.get(m.conditionId) : null;
    if (!signal) {
      return { ...m, whaleVolume: 0, whaleCount: 0, isSmartMoney: false };
    }
    const isSmart =
      signal.volume >= SMART_MONEY_MIN_USD &&
      m.probability != null &&
      m.probability < SMART_MONEY_MAX_PROB;
    return {
      ...m,
      whaleVolume: signal.volume,
      whaleCount: signal.whaleCount,
      whaleLastSide: signal.lastSide,
      whaleHoursAgo: signal.hoursAgo,
      isSmartMoney: isSmart,
    };
  });
}

// ---------------------------------------------------------------------------
// Annualized return for "smart money" tile. Given an implied probability p
// and a horizon in days, returns the annualized expected return assuming the
// position resolves YES. (1/p - 1) is the gross multiple; we annualize.
// ---------------------------------------------------------------------------
export function annualizedReturn(prob, days) {
  if (!Number.isFinite(prob) || prob <= 0 || prob >= 1) return null;
  if (!Number.isFinite(days) || days <= 0) return null;
  const grossPerPeriod = 1 / prob - 1;
  return grossPerPeriod * (365 / days);
}

// ---------------------------------------------------------------------------
// normalizeMarket — single transform that produces every field the UI cards
// rely on. Keeps the rest of the codebase free of raw Polymarket quirks.
// ---------------------------------------------------------------------------
export function normalizeMarket(market) {
  const yesProb = getYesProbability(market);
  const days = daysUntilEnd(market);
  const liquidity = Number(market.liquidity ?? market.liquidityNum ?? 0);
  const volume24 = Number(market.volume24hr ?? market.volume24h ?? 0);
  const volume = Number(market.volume ?? market.volumeNum ?? 0);
  const outcomes = parseOutcomes(market);
  const [pricesYes, pricesNo] = parseOutcomePrices(market);

  return {
    id: String(market.id ?? market.conditionId ?? market.condition_id),
    conditionId: market.conditionId ?? market.condition_id ?? null,
    slug: market.slug,
    question: market.question ?? market.title ?? '',
    description: market.description ?? '',
    image: market.image ?? market.icon ?? null,
    category: classifyMarket(market),
    probability: yesProb,
    side: yesProb != null && yesProb >= 0.5 ? 'yes' : 'no',
    daysLeft: days,
    endDate: market.endDate ?? market.end_date_iso ?? null,
    liquidity,
    volume,
    volume24,
    outcomes,
    outcomePrices: [pricesYes, pricesNo],
    annualized: annualizedReturn(yesProb, days),
    raw: market,
  };
}

// ---------------------------------------------------------------------------
// Strategy filters for the MarketScanner.
// ---------------------------------------------------------------------------
export const STRATEGIES = {
  smart_money: {
    slug: 'smart_money',
    label: 'כסף חכם',
    sub: 'לוויתנים נגד הקונצנזוס',
    color: 'smart',
    description: 'שווקים שבהם לוויתנים מובילים מחזיקים פוזיציה של מעל $10k בהסתברות מתחת ל-80%.',
    // Real signal: market must have been flagged by enrichWithWhales(),
    // which joins live /trades whale data with the /markets payload.
    matches(m) {
      return m.isSmartMoney === true;
    },
    score(m) {
      return m.whaleVolume ?? 0;
    },
  },
  consensus: {
    slug: 'consensus',
    label: 'קונצנזוס',
    sub: 'הימור בטוח על מובילים ברורים',
    color: 'primary',
    description: 'הסתברות מעל 90% עם נזילות מעל $50k — תשואה נמוכה אבל סיכון מינימלי.',
    matches(m) {
      return m.probability != null && m.probability >= 0.9 && m.liquidity > 50_000;
    },
    score(m) {
      return m.liquidity;
    },
  },
  sharpshooter: {
    slug: 'sharpshooter',
    label: 'צלף',
    sub: 'תנודתיות גבוהה, תשואה אסימטרית',
    color: 'cta',
    description: 'הסתברות 30%-60% עם נפח מסחר 24 שעות מעל $20k — אזור הזדמנות לצלפים.',
    matches(m) {
      return (
        m.probability != null &&
        m.probability >= 0.3 &&
        m.probability <= 0.6 &&
        m.volume24 > 20_000
      );
    },
    score(m) {
      return m.volume24;
    },
  },
};

export function applyStrategy(markets, strategySlug) {
  const strat = STRATEGIES[strategySlug];
  if (!strat) return markets;
  return markets
    .filter((m) => strat.matches(m))
    .sort((a, b) => strat.score(b) - strat.score(a));
}

// ---------------------------------------------------------------------------
// Trader / shark enrichment.
// ---------------------------------------------------------------------------
const SHARK_THRESHOLDS = {
  insiderEntryUsd: 5_000,
  insiderHours: 6,
  whaleWinPct: 0.3,
  strongReturnerProfit: 500_000,
};

export function classifyTrader(trader) {
  const tags = [];
  const pnlPct = Number(trader.pnlPct ?? trader.profitPct ?? 0);
  const lifetime = Number(trader.lifetimeProfit ?? trader.totalProfit ?? trader.profit ?? 0);
  const recentEntryUsd = Number(trader.recentEntryUsd ?? trader.lastEntrySize ?? 0);
  const recentHours = Number(trader.recentEntryHoursAgo ?? trader.lastEntryHoursAgo ?? Infinity);

  if (recentEntryUsd >= SHARK_THRESHOLDS.insiderEntryUsd && recentHours <= SHARK_THRESHOLDS.insiderHours) {
    tags.push({ slug: 'insider', label: 'מהלך פנימי', color: 'cta' });
  }
  if (pnlPct >= SHARK_THRESHOLDS.whaleWinPct) {
    tags.push({ slug: 'whale_winner', label: 'לוויתן מנצח', color: 'primary' });
  }
  if (lifetime >= SHARK_THRESHOLDS.strongReturnerProfit) {
    tags.push({ slug: 'strong_returner', label: 'מחזיר חזק', color: 'smart' });
  }

  return tags;
}

export function normalizeTrader(t) {
  const address = t.proxyWallet ?? t.user ?? t.address ?? '';
  const username = t.name ?? t.username ?? t.displayName ?? null;
  const pnl = Number(t.pnl ?? t.profit ?? t.netPnl ?? 0);
  const pnlPct = Number(t.pnlPct ?? t.profitPct ?? 0);
  return {
    address,
    username: username || (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'אנונימי'),
    avatar: t.profileImage ?? t.avatar ?? null,
    pnl,
    pnlPct,
    lifetimeProfit: Number(t.lifetimeProfit ?? t.totalProfit ?? 0),
    volume: Number(t.volume ?? 0),
    txCount: Number(t.txCount ?? t.numTrades ?? t.trades ?? 0),
    position: t.lastPositionTitle ?? t.position ?? null,
    side: t.lastPositionSide ?? t.side ?? null,
    entryPrice: Number(t.lastEntryPrice ?? t.entryPrice ?? 0),
    entrySize: Number(t.lastEntrySize ?? t.recentEntryUsd ?? 0),
    hoursAgo: Number(t.lastEntryHoursAgo ?? t.hoursAgo ?? 0),
    tags: classifyTrader(t),
    raw: t,
  };
}

// formatting helpers used everywhere
export function fmtPercent(n, digits = 0) {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${(n * 100).toFixed(digits)}%`;
}
export function fmtUsd(n, { compact = true } = {}) {
  if (n == null || !Number.isFinite(n)) return '—';
  if (compact) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
      style: 'currency',
      currency: 'USD',
    }).format(n);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}
export function fmtInt(n) {
  if (n == null || !Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en-US').format(Math.round(n));
}
export function fmtDays(n) {
  if (n == null) return '—';
  if (n === 0) return 'היום';
  if (n === 1) return 'יום';
  if (n < 30) return `${n} ימים`;
  const months = Math.round(n / 30);
  if (months === 1) return 'חודש';
  if (months < 12) return `${months} חודשים`;
  const years = Math.round(months / 12);
  return years === 1 ? 'שנה' : `${years} שנים`;
}
