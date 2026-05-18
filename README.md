# Money Radar — מכ"ם הכסף החכם

Hebrew RTL Polymarket intelligence dashboard. React 18 + Vite + Tailwind +
Firebase, deployed to https://liamlaboratory.web.app.

## Features

- **בית (Home)** — categorized live market grid with smart-money ribbons.
- **סורק שווקים (Market Scanner)** — three preset strategies: Smart Money,
  Consensus, Sharpshooter.
- **כל השווקים (All Events)** — sortable, searchable, multi-filter table over
  the full market universe.
- **ראדאר לוויתנים (Sharks Radar)** — top traders by 7-day PnL with auto-tags
  for insider entries, winning whales and strong returners.

## Stack

- React 18, React Router, Vite
- Tailwind CSS + `tailwindcss-rtl` plugin, dark theme
  (`#0A0A0A` / `#00D67E` / `#F59E0B` / `#EC4899`)
- Heebo / Rubik fonts
- Firebase Auth (Google) + Firestore for favorites & weekly AI credits
- Polymarket Gamma + Data APIs with 60s in-memory TTL cache
- TanStack Table for the All Events grid
- lucide-react icons

## Setup

```bash
npm install
cp .env.example .env.local   # paste Firebase web config
npm run dev                  # http://localhost:5173
```

Without Firebase keys the app still runs — favorites and credits fall back to
`localStorage`.

## Deploy

```bash
npm run build
firebase login
firebase deploy --only hosting   # ships to liamlaboratory.web.app
```

## CORS

In dev, requests are routed via the Vite proxy (`/api/gamma` → Gamma,
`/api/data` → Data API). Production hits the Polymarket origins directly. If
they ever clamp down, flip `USE_VERCEL_PROXY` in `src/lib/polymarket.js` and
deploy `api/proxy.js` on Vercel.

## File map

```
src/
  pages/{Home,MarketScanner,AllEvents,SharksRadar}.jsx
  components/{MarketCard,TraderCard,FilterChip,CategoryTabs,StrategyCard,Sidebar}.jsx
  lib/
    polymarket.js   — Gamma + Data API client, TTL cache
    enrichers.js    — normalizeMarket, classifyMarket, strategy filters,
                      smart-money detector, annualized return, formatters
    useFavorites.js — Firestore-backed favorites + weekly AI credits
    useMarkets.js   — paginated active-market hook
    firebase.js     — env-driven init, no-op fallback
    cn.js           — clsx + tailwind-merge
  config/categories.js — slug → Hebrew label + keyword matcher
api/proxy.js        — optional Vercel CORS proxy
```
