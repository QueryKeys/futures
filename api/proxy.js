// Vercel Edge proxy used as a CORS escape hatch for the two Polymarket APIs.
// Wire it in by flipping USE_VERCEL_PROXY in src/lib/polymarket.js.
//
// Usage from the client:  /api/proxy?url=<encoded full URL>
//
// Allowed targets are pinned to the two Polymarket origins.

const ALLOW = ['https://gamma-api.polymarket.com', 'https://data-api.polymarket.com'];

export default async function handler(req, res) {
  const url = req.query?.url;
  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'missing url' });
    return;
  }

  if (!ALLOW.some((origin) => url.startsWith(origin))) {
    res.status(403).json({ error: 'origin not allowed' });
    return;
  }

  try {
    const upstream = await fetch(url, { headers: { Accept: 'application/json' } });
    const body = await upstream.text();
    res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(upstream.status).send(body);
  } catch (err) {
    res.status(502).json({ error: String(err?.message ?? err) });
  }
}
