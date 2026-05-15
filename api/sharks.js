// Vercel serverless route — top whales by current open-position PnL.
//
// Aggregates Polymarket /trades (filtered to ≥$5k fills) by wallet, then
// fans out one /positions call per top wallet. Returns a ready-to-render
// leaderboard so the client doesn't need to make N+1 calls from the browser.
//
// /api/sharks                → top 18 wallets, $5k whale floor, 7d window
// /api/sharks?min=10000&n=24 → custom thresholds

const TRADES_URL = 'https://data-api.polymarket.com/trades';
const POSITIONS_URL = 'https://data-api.polymarket.com/positions';

export default async function handler(req, res) {
  try {
    const minSize = clampInt(req.query?.min, 5000, 1000, 100_000);
    const limitN = clampInt(req.query?.n, 18, 3, 50);

    const tradesRes = await fetch(
      `${TRADES_URL}?limit=500&filterType=CASH&filterAmount=${minSize}`,
      { headers: { Accept: 'application/json' } }
    );
    if (!tradesRes.ok) throw new Error(`trades ${tradesRes.status}`);
    const trades = await tradesRes.json();

    // Group by wallet, keep latest entry metadata.
    const now = Date.now();
    const byUser = new Map();
    for (const t of trades) {
      const u = t.proxyWallet;
      if (!u) continue;
      const usd = Number(t.size ?? 0) * Number(t.price ?? 0);
      if (usd < minSize) continue;
      const tsMs = (Number(t.timestamp) || 0) * 1000;
      const hoursAgo = tsMs ? (now - tsMs) / 3_600_000 : Infinity;
      const cur =
        byUser.get(u) ?? {
          proxyWallet: u,
          name: t.name || t.pseudonym || null,
          profileImage: t.profileImage || null,
          volume: 0,
          trades: 0,
          recentEntryUsd: 0,
          recentEntryHoursAgo: Infinity,
          lastPositionTitle: null,
          lastPositionSide: null,
          lastEntryPrice: 0,
          lastEntrySize: 0,
        };
      cur.volume += usd;
      cur.trades += 1;
      if (hoursAgo < cur.recentEntryHoursAgo) {
        cur.recentEntryHoursAgo = hoursAgo;
        cur.recentEntryUsd = usd;
        cur.lastPositionTitle = t.title ?? null;
        cur.lastPositionSide = t.outcome === 'Yes' ? 'yes' : 'no';
        cur.lastEntryPrice = Number(t.price ?? 0);
        cur.lastEntrySize = usd;
      }
      byUser.set(u, cur);
    }

    const top = [...byUser.values()]
      .sort((a, b) => b.volume - a.volume)
      .slice(0, limitN);

    // Enrich with real PnL from /positions.
    const enriched = await Promise.all(
      top.map(async (w) => {
        try {
          const r = await fetch(
            `${POSITIONS_URL}?user=${w.proxyWallet}&limit=50&sortBy=CURRENT&sortDirection=DESC`,
            { headers: { Accept: 'application/json' } }
          );
          if (!r.ok) throw new Error(`positions ${r.status}`);
          const positions = await r.json();
          const pnl = positions.reduce((a, p) => a + Number(p.cashPnl ?? 0), 0);
          const realized = positions.reduce((a, p) => a + Number(p.realizedPnl ?? 0), 0);
          const initial = positions.reduce((a, p) => a + Number(p.initialValue ?? 0), 0);
          return {
            ...w,
            pnl,
            pnlPct: initial > 0 ? pnl / initial : 0,
            lifetimeProfit: pnl + realized,
            txCount: w.trades,
          };
        } catch {
          return { ...w, pnl: 0, pnlPct: 0, lifetimeProfit: 0, txCount: w.trades };
        }
      })
    );

    enriched.sort((a, b) => b.pnl - a.pnl);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(
      JSON.stringify({
        success: true,
        lastUpdated: new Date().toISOString(),
        minSize,
        traders: enriched,
      })
    );
  } catch (err) {
    res.status(502).json({ error: String(err?.message ?? err) });
  }
}

function clampInt(raw, fallback, min, max) {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
