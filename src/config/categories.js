// Category catalog for the Hebrew UI. Slugs map to keyword matchers used by
// classifyMarket() in lib/enrichers.js — adding a new keyword here is enough
// to surface it in the relevant tab.
export const CATEGORIES = [
  {
    slug: 'all',
    label: 'הכל',
    icon: 'Sparkles',
    keywords: [],
  },
  {
    slug: 'israel',
    label: 'ישראל',
    icon: 'Star',
    keywords: [
      'israel', 'israeli', 'netanyahu', 'gaza', 'hamas', 'hezbollah', 'idf',
      'tel aviv', 'jerusalem', 'iran', 'lebanon', 'west bank', 'mossad',
    ],
  },
  {
    slug: 'trends',
    label: 'טרנדים',
    icon: 'TrendingUp',
    keywords: ['viral', 'trending', 'tiktok', 'meme', 'social media', 'twitter', 'x.com'],
  },
  {
    slug: 'politics',
    label: 'פוליטיקה',
    icon: 'Landmark',
    keywords: [
      'election', 'president', 'trump', 'biden', 'putin', 'congress', 'senate',
      'house', 'governor', 'mayor', 'parliament', 'prime minister', 'vote', 'poll',
    ],
  },
  {
    slug: 'crypto',
    label: 'קריפטו',
    icon: 'Bitcoin',
    keywords: [
      'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'solana', 'sol',
      'token', 'coin', 'binance', 'coinbase', 'defi', 'nft', 'altcoin',
    ],
  },
  {
    slug: 'sports',
    label: 'ספורט',
    icon: 'Trophy',
    keywords: [
      'nba', 'nfl', 'mlb', 'nhl', 'fifa', 'uefa', 'champions league',
      'super bowl', 'world cup', 'olympics', 'soccer', 'football', 'basketball',
      'baseball', 'hockey', 'tennis', 'golf', 'ufc', 'boxing',
    ],
  },
  {
    slug: 'business',
    label: 'עסקים',
    icon: 'Briefcase',
    keywords: [
      'stock', 'earnings', 'ipo', 'merger', 'acquisition', 'ceo', 'tesla',
      'apple', 'amazon', 'google', 'microsoft', 'meta', 'nvidia', 'fed',
      'inflation', 'gdp', 'recession', 'oil', 'gas',
    ],
  },
  {
    slug: 'science',
    label: 'מדע',
    icon: 'Microscope',
    keywords: [
      'spacex', 'nasa', 'mars', 'moon', 'starship', 'rocket', 'satellite',
      'ai', 'gpt', 'openai', 'anthropic', 'claude', 'gemini', 'llm',
      'climate', 'temperature', 'vaccine', 'fda',
    ],
  },
];

export const CATEGORY_BY_SLUG = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c])
);
