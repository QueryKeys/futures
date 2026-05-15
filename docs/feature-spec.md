# Feature Spec v2 — Polymarket-IL

> Supplement to the original brief. Captures structural decisions inspired by
> reviewing themoneyradar.com's information architecture. **Visual design
> remains 100% original** — no colors, gradients, typography, brand marks, or
> exact copy are lifted. Patterns adopted (icon sidebar, tier cards, filter
> chips, dense events table) are generic UX patterns shared across many
> fintech and analytics apps.

---

## 1. Information architecture

Persistent right-side icon nav (RTL), six items:

| Route          | Hebrew label        | Purpose                                              |
| -------------- | ------------------- | ---------------------------------------------------- |
| `/`            | דף הבית             | Landing — quick highlights from each tier + sharks.  |
| `/scanner`     | סורק השוק           | **Three-tier scanner** (see §2).                     |
| `/events`      | כל האירועים         | Dense table of every active market (see §3).         |
| `/sharks`      | רדאר הכרישים        | Live large-trade feed + wallet profiles.             |
| `/favorites`   | המועדפים שלי        | Saved markets and watched wallets.                   |
| `/about`       | אודות               | About + jurisdiction & "not advice" disclaimers.     |

Mobile: collapse the sidebar; show a 5-icon bottom nav (drop favorites into a
header icon to keep room).

The original spec had `/league` as a top-level route — demote to a subsection
of `/sharks` (a "ליגה" tab on the sharks page) since both pages aggregate from
the same wallet endpoints.

---

## 2. Scanner — three tiers

The scanner used to be a flat filterable grid. New structure: three named
**strategies**, each its own ranked subset of markets. Each tier is a section
on `/scanner`, stacked vertically, separated by a hero card explaining the
strategy.

### Tier A — כסף חכם  *(Smart Money)*

Markets where the top-100 leaderboard wallets hold meaningful positions.
Surfaces what the proven traders are actually betting on.

- **Score** = Σ (position USD × wallet rank weight) ÷ market liquidity.
- **Card primary metric**: % of market liquidity held by top wallets.
- **Card secondary**: market consensus probability, days to resolution.
- **Pick label**: which side (YES/NO) the smart money is mostly on.

### Tier B — קונצנזוס  *(Consensus)*

Markets the AI rates as near-certain (probability outside 15–85%) **and** the
market price agrees within a small band. Boring but reliable.

- **Score** = AI confidence × (1 − |AI fair value − 0.5| inverted) × proximity to AI estimate.
- **Card primary metric**: AI-estimated probability.
- **Card secondary**: market price, # catalysts identified, days to resolution.

### Tier C — הצלף  *(Sniper)*

Highest |edge|: largest gap between our AI fair value and the market price,
weighted by confidence. The high-risk, high-reward bucket.

- **Score** = |AI fair value − market price| × AI confidence × min(liquidity, $50k)/$50k.
- **Card primary metric**: edge % (e.g. *+233%* expected return if right).
- **Card secondary**: implied annualized return given days-to-resolution.

---

## 3. Events page (`/events`)

Dense table-mode view of every active market. `/scanner` is curated;
`/events` is comprehensive.

- Sticky filter bar (chips): נזילות / טווח מחירים / זמן שנותר / קטגוריה,
  plus a free-text search and a מיון לפי dropdown.
- Table columns: שם האירוע · היתכנות לכן · נזילות · מחזור · ימים · ⭐ · ☐
- Multi-select rows + "קבל ניתוח AI" button → batches selected markets through
  the AI proxy (consumes credits per market).

---

## 4. AI credits

Free tier: 3 AI analyses per week per uid. Worker enforces server-side via
KV counter (week-bucketed). UI shows `‎3 קרדיטים נותרים השבוע` near the AI
buttons; disable at 0 with a tooltip explaining the reset day.

Per-market AI results cached in Firestore keyed by `${marketId}_${hourBucket}`
for 1 h so re-opening the same drawer doesn't re-charge.

---

## 5. Build order (proposed)

1. **App shell** — sidebar nav + bottom nav + theme + brand placeholder.
2. **`/scanner` (Tier C only — Sniper)**.
3. **AI proxy on the Worker** — `POST /api/ai/analyze` (streaming, per-uid weekly cap).
4. **AI drawer** consuming the stream.
5. **Tiers A and B** on the scanner — needs leaderboard endpoint first.
6. **`/events`** — paginated table + filters + batch AI.
7. **`/sharks`** + leaderboard tab.
8. **Auth + favorites + watchlist**.
9. **Web push for watched wallets**.
10. **Polish pass + Lighthouse**.

Each step is independently shippable.
