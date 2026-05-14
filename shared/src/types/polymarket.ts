/**
 * Polymarket API response types.
 *
 * Derived from live samples of:
 *   - https://gamma-api.polymarket.com/markets
 *
 * Many "numeric" fields are returned as strings (e.g. "0.57") and some array
 * fields are returned as JSON-encoded strings (e.g. outcomes: "[\"Yes\",\"No\"]").
 * Helper parsers below unwrap those into proper types for the app.
 */

// ── Raw shapes (as returned by the upstream API) ───────────────────────────

export interface GammaEventRaw {
  id: string;
  ticker: string;
  slug: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  image?: string;
  icon?: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  liquidity?: number;
  volume?: number;
  volume24hr?: number;
  volume1wk?: number;
  volume1mo?: number;
  openInterest?: number;
  commentCount?: number;
}

export interface GammaMarketRaw {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  description?: string;
  resolutionSource?: string;
  endDate?: string;
  startDate?: string;
  image?: string;
  icon?: string;

  /** JSON-encoded string array, e.g. `'["Yes","No"]'`. */
  outcomes?: string;
  /** JSON-encoded string array of decimal prices, e.g. `'["0.57","0.43"]'`. */
  outcomePrices?: string;
  /** JSON-encoded string array of CLOB token IDs (uint256 as decimal string). */
  clobTokenIds?: string;

  /** Decimal-as-string. */
  liquidity?: string;
  /** Decimal-as-string. */
  volume?: string;

  liquidityNum?: number;
  volumeNum?: number;

  volume24hr?: number;
  volume1wk?: number;
  volume1mo?: number;
  volume1yr?: number;

  active: boolean;
  closed: boolean;
  archived: boolean;
  new?: boolean;
  featured?: boolean;
  restricted?: boolean;

  oneDayPriceChange?: number;
  oneWeekPriceChange?: number;
  oneMonthPriceChange?: number;
  oneYearPriceChange?: number;

  bestBid?: number;
  bestAsk?: number;
  lastTradePrice?: number;
  spread?: number;

  enableOrderBook?: boolean;
  orderPriceMinTickSize?: number;
  orderMinSize?: number;
  acceptingOrders?: boolean;

  negRisk?: boolean;
  competitive?: number;

  events?: GammaEventRaw[];

  createdAt?: string;
  updatedAt?: string;

  endDateIso?: string;
  startDateIso?: string;
}

// ── Normalized shape used by the app ───────────────────────────────────────

export interface MarketOutcome {
  label: string;
  /** 0..1 probability implied by the market. */
  price: number;
}

export interface Market {
  id: string;
  conditionId: string;
  slug: string;
  question: string;
  description: string;
  image: string | null;
  icon: string | null;

  outcomes: MarketOutcome[];

  liquidity: number;
  volume: number;
  volume24h: number;

  /** Δ in implied probability over 24h (signed, e.g. +0.055). */
  priceChange24h: number | null;

  endDate: string | null;
  startDate: string | null;

  active: boolean;
  closed: boolean;
  archived: boolean;

  /** Convenience: implied YES probability if the market is binary. */
  yesPrice: number | null;
  /** Convenience: implied NO probability if the market is binary. */
  noPrice: number | null;

  /** First parent event, if any (used for category-ish grouping in v1). */
  eventSlug: string | null;
  eventTitle: string | null;
}

// ── Parsers ────────────────────────────────────────────────────────────────

function parseJsonStringArray(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function parseNumberLike(value: string | number | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.length > 0) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

export function normalizeGammaMarket(raw: GammaMarketRaw): Market {
  const labels = parseJsonStringArray(raw.outcomes);
  const prices = parseJsonStringArray(raw.outcomePrices).map((p) => Number(p));

  const outcomes: MarketOutcome[] = labels.map((label, i) => ({
    label,
    price: Number.isFinite(prices[i]) ? (prices[i] as number) : 0,
  }));

  const yesIdx = outcomes.findIndex((o) => o.label.toLowerCase() === "yes");
  const noIdx = outcomes.findIndex((o) => o.label.toLowerCase() === "no");

  const firstEvent = raw.events && raw.events.length > 0 ? raw.events[0] : null;

  return {
    id: raw.id,
    conditionId: raw.conditionId,
    slug: raw.slug,
    question: raw.question,
    description: raw.description ?? "",
    image: raw.image ?? null,
    icon: raw.icon ?? null,

    outcomes,

    liquidity: raw.liquidityNum ?? parseNumberLike(raw.liquidity),
    volume: raw.volumeNum ?? parseNumberLike(raw.volume),
    volume24h: raw.volume24hr ?? 0,

    priceChange24h:
      typeof raw.oneDayPriceChange === "number" ? raw.oneDayPriceChange : null,

    endDate: raw.endDate ?? raw.endDateIso ?? null,
    startDate: raw.startDate ?? raw.startDateIso ?? null,

    active: raw.active,
    closed: raw.closed,
    archived: raw.archived,

    yesPrice: yesIdx >= 0 ? outcomes[yesIdx]!.price : null,
    noPrice: noIdx >= 0 ? outcomes[noIdx]!.price : null,

    eventSlug: firstEvent?.slug ?? null,
    eventTitle: firstEvent?.title ?? null,
  };
}

export interface MarketsResponse {
  markets: Market[];
  /** Echoed query parameters (useful for cache debugging). */
  query: {
    limit: number;
    active: boolean;
    closed: boolean;
  };
  /** ISO timestamp of when the Worker generated this payload. */
  generatedAt: string;
  /** "HIT" | "MISS" | "STALE" — set by the Worker. */
  cache: "HIT" | "MISS" | "STALE";
}
