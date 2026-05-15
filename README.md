# Polymarket Intelligence — Israel (Hebrew, RTL)

Production-grade Hebrew web app delivering Polymarket prediction-market
intelligence to Israeli traders.

This repository is an npm-workspaces monorepo with three packages:

```
.
├── web/      # Next.js 15 + TS + Tailwind + TanStack Query (Hebrew/RTL)
├── worker/   # Cloudflare Worker proxy + cache (Polymarket / Anthropic)
├── shared/   # TS types, parsers, i18n strings
└── .github/  # CI: typecheck + web build
```

> **Status — Step 1.** Only the monorepo skeleton plus a single cached
> `/api/markets` endpoint and a minimal Hebrew page that consumes it via
> TanStack Query are wired. Feature-level work (scanner filters/AI, sharks
> radar, leaderboard) is intentionally not implemented yet.

---

## Setup

Prereqs: Node 22+, npm 10+, a Cloudflare account for the Worker, a Vercel
account for the web app.

```bash
npm install
cp .env.example web/.env.local   # for the web app
```

### Run locally

In two terminals:

```bash
# Terminal 1 — Worker (Cloudflare Wrangler, http://127.0.0.1:8787)
npm run dev:worker

# Terminal 2 — Web (Next.js, http://localhost:3000)
NEXT_PUBLIC_WORKER_BASE_URL=http://127.0.0.1:8787 npm run dev:web
```

The Worker logs every cache hit/miss/stale event to the console, e.g.:

```
[cache] MISS markets:v1:active=true:closed=false:limit=20
[cache] HIT  markets:v1:active=true:closed=false:limit=20 age=4.1s
[cache] STALE markets:v1:active=true:closed=false:limit=20 age=63.4s (revalidating)
```

The web app surfaces the same status via an `X-Cache` chip in the header.

---

See `docs/feature-spec.md` for the v2 build plan.