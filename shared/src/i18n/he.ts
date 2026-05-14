/**
 * Single source of truth for Hebrew UI strings.
 *
 * Keep keys grouped by feature. Numbers/dates/currencies are kept LTR even
 * inside RTL paragraphs — formatters live in `web/src/lib/format.ts`.
 */

export const common = {
  appName: "פולימרקט אינטל",
  tagline: "מודיעין שוקי חיזוי לסוחרים ישראלים",
  loading: "טוען…",
  error: "אירעה שגיאה",
  retry: "נסה שוב",
  noResults: "אין תוצאות",
  refresh: "רענן",
  more: "עוד",
  yes: "כן",
  no: "לא",
} as const;

export const nav = {
  scanner: "סורק שוקים",
  sharks: "ראדאר כרישים",
  league: "ליגת הכסף החכם",
  about: "אודות",
} as const;

export const scanner = {
  title: "סורק שוקים",
  subtitle: "סינון, ניתוח והשוואה של שוקי Polymarket בזמן אמת",
  filters: {
    category: "קטגוריה",
    liquidity: "נזילות מינימלית",
    volume24h: "מחזור 24ש׳ מינימלי",
    endsWithin: "סיום עד",
    sortBy: "מיון לפי",
  },
  card: {
    yes: "כן",
    no: "לא",
    change24h: "שינוי 24ש׳",
    volume24h: "מחזור 24ש׳",
    liquidity: "נזילות",
    endsOn: "סיום ב־",
    analyze: "נתח עם AI",
    translate: "תרגם",
    favorite: "שמור",
  },
} as const;

export const disclaimers = {
  notAdvice: "אין לראות בכך ייעוץ השקעות.",
  jurisdiction:
    "השימוש ב־Polymarket עשוי להיות מוגבל בתחום שיפוט מסוים. ודא את חוקי המדינה שלך לפני השימוש.",
} as const;
