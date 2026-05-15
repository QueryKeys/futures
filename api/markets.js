// Vercel serverless route — paginates Polymarket Gamma directly and
// merges in Hebrew translations from themoneyradar.com (keyed by
// conditionId) so the client gets one normalized payload.
//
//   GET /api/markets                  → up to 6000 active markets, joined
//   GET /api/markets?limit=2000       → cap markets at 2000
//   GET /api/markets?translate=false  → skip the themoneyradar merge
//
// Gamma caps each response at 100 markets regardless of the `limit`
// param, so we fan out ?offset=0,100,200,…,N-100 in parallel.

const GAMMA = 'https://gamma-api.polymarket.com/markets';
const TMR = 'https://www.themoneyradar.com/api/markets';

const DEFAULT_TARGET = 6000;
const PAGE_SIZE = 100;
const MAX_TARGET = 10_000;       // Gamma errors past ~10-15k offset
const PARALLEL_BATCH = 12;       // tame upstream concurrency

export default async function handler(req, res) {
  try {
    const target = clampInt(req.query?.limit, DEFAULT_TARGET, 100, MAX_TARGET);
    const translate = req.query?.translate !== 'false';
    const order = String(req.query?.order ?? 'volume24hr');

    const [gamma, tmrPage] = await Promise.all([
      pageThroughGamma({ target, order }),
      translate ? loadAllTranslations().catch(() => null) : null,
    ]);

    const merged = mergeTranslations(gamma, tmrPage);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(
      JSON.stringify({
        success: true,
        lastUpdated: new Date().toISOString(),
        source: 'polymarket-gamma',
        translationsFrom: tmrPage ? 'themoneyradar' : null,
        totalMarkets: merged.length,
        markets: merged,
        hasMore: false,
        offset: 0,
      })
    );
  } catch (err) {
    res.status(502).json({ error: String(err?.message ?? err) });
  }
}

// ---------------------------------------------------------------------------
// Gamma pagination — parallel offset crawl, throttled.
// ---------------------------------------------------------------------------
async function pageThroughGamma({ target, order }) {
  const offsets = [];
  for (let o = 0; o < target; o += PAGE_SIZE) offsets.push(o);

  const all = [];
  for (let i = 0; i < offsets.length; i += PARALLEL_BATCH) {
    const batch = offsets.slice(i, i + PARALLEL_BATCH);
    const results = await Promise.all(
      batch.map((offset) => fetchGammaPage({ offset, order }).catch(() => []))
    );
    for (const page of results) {
      if (Array.isArray(page) && page.length) all.push(...page);
      // If we got an empty page mid-crawl we've exhausted the universe.
    }
    // Bail out early if upstream is returning empties.
    if (results.every((r) => !r || r.length === 0)) break;
  }
  // Deduplicate by conditionId — defensive against overlap across pages.
  const seen = new Set();
  const out = [];
  for (const m of all) {
    const cid = m.conditionId || m.condition_id || String(m.id);
    if (seen.has(cid)) continue;
    seen.add(cid);
    out.push(m);
    if (out.length >= target) break;
  }
  return out;
}

async function fetchGammaPage({ offset, order }) {
  const url = `${GAMMA}?closed=false&active=true&archived=false&order=${encodeURIComponent(
    order
  )}&ascending=false&limit=${PAGE_SIZE}&offset=${offset}`;
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`gamma ${r.status} @ offset=${offset}`);
  const data = await r.json();
  return Array.isArray(data) ? data : [];
}

// ---------------------------------------------------------------------------
// themoneyradar translation merge — keyed by conditionId.
// ---------------------------------------------------------------------------
async function loadAllTranslations() {
  const map = new Map();
  let offset = 0;
  while (offset < 10_000) {
    const url = `${TMR}?offset=${offset}&limit=1000`;
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) break;
    const page = await r.json();
    const items = page?.markets ?? [];
    if (!items.length) break;
    for (const m of items) {
      // themoneyradar.id IS Polymarket conditionId (0x-prefixed).
      if (m.id) {
        map.set(String(m.id).toLowerCase(), {
          question_he: m.question_he?.trim() || null,
          category_he: m.category_he?.trim() || null,
          category: m.category || null,
          tags: m.tags || null,
        });
      }
    }
    if (!page?.hasMore) break;
    offset += 1000;
  }
  return map;
}

function mergeTranslations(gammaMarkets, tmrMap) {
  if (!tmrMap || tmrMap.size === 0) return gammaMarkets;
  return gammaMarkets.map((m) => {
    const cid = String(m.conditionId || m.condition_id || '').toLowerCase();
    const tx = cid ? tmrMap.get(cid) : null;
    if (!tx) return m;
    return {
      ...m,
      question_he: tx.question_he,
      category_he: tx.category_he,
      upstream_category: tx.category,
      upstream_tags: tx.tags,
    };
  });
}

function clampInt(raw, fallback, min, max) {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
