/**
 * Single source of truth for Hebrew UI strings.
 * Numbers/dates/currencies stay LTR — formatters live in web/src/lib/format.ts.
 */

export const common = {
  appName: "פוליראדאר",
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
  scanner: "סורק",
  events: "אירועים",
  sharks: "כרישים",
  favorites: "מועדפים",
  about: "אודות",
} as const;

export const scanner = {
  title: "סורק שוקים",
  subtitle: "ניתוח שלוש רמות בזמן אמת",
  tiers: {
    smartMoney: {
      label: "כסף חכם",
      tier: "Tier A",
      desc: "תנועת מחיר חדה + מחזור גבוה — סימן לכסף מוסדי",
    },
    consensus: {
      label: "קונצנזוס",
      tier: "Tier B",
      desc: "שוקים ב-50% עם מחזור גבוה — הכסף חלוק",
    },
    sniper: {
      label: "הצלף",
      tier: "Tier C",
      desc: "הסתברויות קיצוניות + נפח פעיל — ערך אסימטרי",
    },
  },
  card: {
    yes: "כן",
    no: "לא",
    change24h: "שינוי 24ש׳",
    volume24h: "מחזור 24ש׳",
    liquidity: "נזילות",
    endsOn: "סיום",
  },
} as const;

export const events = {
  title: "אירועים",
  subtitle: "כל שוקי החיזוי ממוינים לפי מחזור",
  filters: { all: "הכל", active: "פעיל", closed: "סגור" },
  cols: {
    event: "אירוע",
    volume24h: "מחזור 24ש׳",
    liquidity: "נזילות",
    endDate: "סיום",
    status: "סטטוס",
  },
} as const;

export const sharks = {
  title: "ראדאר כרישים",
  subtitle: "עסקאות גדולות בזמן אמת — גישוש אחר כסף מוסדי",
  live: "לייב",
  buy: "קנייה",
  sell: "מכירה",
  cols: {
    time: "זמן",
    market: "שוק",
    side: "צד",
    size: "גודל",
    price: "מחיר",
    wallet: "ארנק",
  },
  minSize: "גודל מינימלי",
  empty: "אין עסקאות מעל הסף שנבחר",
} as const;

export const disclaimers = {
  notAdvice: "אין לראות בכך ייעוץ השקעות.",
  jurisdiction:
    "השימוש ב-Polymarket עשוי להיות מוגבל בתחום שיפוט מסוים. ודא את חוקי המדינה שלך לפני השימוש.",
} as const;
