// Client adapter for our /api/markets serverless route, which paginates
// Polymarket Gamma directly and (optionally) merges Hebrew translations
// from themoneyradar.com keyed by conditionId. We shape each record into
// the same UI contract used by the rest of the app.

import {
  classifyMarket,
  annualizedReturn,
  getYesProbability,
  daysUntilEnd,
} from './enrichers.js';
import { CATEGORY_BY_SLUG } from '../config/categories.js';

const cache = new Map();

async function fetchJSON(url, ttl = 60_000) {
  const hit = cache.get(url);
  if (hit && hit.expires > Date.now()) return hit.value;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`api ${res.status} on ${url}`);
  const data = await res.json();
  cache.set(url, { value: data, expires: Date.now() + ttl });
  return data;
}

/**
 * Pull markets through our serverless proxy. `limit` defaults to 6000;
 * pass `translate=false` to skip the Hebrew merge for a faster response.
 */
export async function getMarkets({ limit = 6000, translate = true } = {}) {
  const qs = new URLSearchParams({ limit: String(limit) });
  if (!translate) qs.set('translate', 'false');
  return fetchJSON(`/api/markets?${qs.toString()}`, 60_000);
}

// ---------------------------------------------------------------------------
// Category mapping — themoneyradar's free-form `upstream_category`/`tags`
// fields map to our slug taxonomy; we fall back to the keyword classifier
// from enrichers.js when neither is present.
// ---------------------------------------------------------------------------
const UPSTREAM_CAT_MAP = {
  sports: 'sports',
  politics: 'politics',
  crypto: 'crypto',
  business: 'business',
  finance: 'business',
  economy: 'business',
  tech: 'science',
  science: 'science',
  ai: 'science',
  middle_east: 'israel',
  middleeast: 'israel',
  israel: 'israel',
  culture: 'trends',
  entertainment: 'trends',
  music: 'trends',
};

function mapCategory(market) {
  const raw = String(market.upstream_category ?? '').toLowerCase().replace(/\s+/g, '_');
  if (UPSTREAM_CAT_MAP[raw]) return UPSTREAM_CAT_MAP[raw];

  // Check upstream tags next.
  const tags = market.upstream_tags || market.tags || [];
  for (const t of tags) {
    const slug = String(t).toLowerCase().replace(/\s+/g, '_');
    if (UPSTREAM_CAT_MAP[slug]) return UPSTREAM_CAT_MAP[slug];
  }

  // Final fallback: keyword classifier on question/description.
  return classifyMarket(market);
}

/**
 * Convert a Gamma market (optionally enriched with question_he/category_he)
 * into the normalized shape used by every page/component.
 */
export function normalizeMoneyRadarMarket(m) {
  const yesProb = getYesProbability(m);
  const days = daysUntilEnd(m);
  const liquidity = Number(m.liquidity ?? m.liquidityNum ?? 0);
  const volume = Number(m.volume ?? m.volumeNum ?? 0);
  const volume24 = Number(m.volume24hr ?? m.volume24h ?? 0);
  const category = mapCategory(m);
  const conditionId = m.conditionId || m.condition_id || null;

  // Hebrew preferred when present; else upstream English question.
  const questionHe = (m.question_he || '').trim();
  const categoryHe = (m.category_he || '').trim();

  return {
    id: String(m.id ?? conditionId ?? Math.random()),
    conditionId,
    slug: m.slug,
    eventSlug: m.eventSlug ?? m.event_slug ?? null,
    url: m.slug ? `https://polymarket.com/market/${m.slug}` : null,
    question: questionHe || m.question || m.title || '',
    questionEn: m.question || null,
    description: m.description ?? '',
    image: m.image ?? m.icon ?? null,
    category,
    categoryLabel: categoryHe || CATEGORY_BY_SLUG[category]?.label || null,
    tags: Array.isArray(m.tags) ? m.tags : [],
    probability: yesProb,
    side: yesProb != null && yesProb >= 0.5 ? 'yes' : 'no',
    daysLeft: days,
    endDate: m.endDate ?? m.end_date_iso ?? null,
    liquidity,
    volume,
    volume24,
    outcomes: ['Yes', 'No'],
    annualized: annualizedReturn(yesProb, days),
    closed: Boolean(m.closed),
    active: m.active !== false,
    raw: m,
  };
}

export const _internal = { cache };
