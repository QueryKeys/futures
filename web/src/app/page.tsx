"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMarkets } from "@/lib/api";
import { fmtDate, fmtPct, fmtPctSigned, fmtUsdCompact } from "@/lib/format";
import { he } from "@poly-il/shared";

export default function HomePage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["markets", { limit: 20, active: true, closed: false }],
    queryFn: ({ signal }) =>
      fetchMarkets({ limit: 20, active: true, closed: false }, signal),
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {he.common.appName}
        </h1>
        <p className="mt-2 text-fg-muted">{he.common.tagline}</p>
      </header>

      <section className="mb-6 flex items-center justify-between gap-4">
        <div className="text-sm text-fg-muted">
          {he.scanner.subtitle}
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-md border border-border bg-bg-raised px-3 py-1.5 text-sm hover:bg-bg-muted disabled:opacity-50"
        >
          {isFetching ? he.common.loading : he.common.refresh}
        </button>
      </section>

      {data && (
        <div className="mb-4 flex items-center gap-3 text-xs text-fg-subtle">
          <span
            className={`mono rounded px-2 py-0.5 ${
              data.cache === "HIT"
                ? "bg-success/15 text-success"
                : data.cache === "STALE"
                  ? "bg-accent/15 text-accent"
                  : "bg-bg-muted text-fg-muted"
            }`}
            title="X-Cache header from the Worker"
          >
            cache: {data.cache}
          </span>
          <span className="mono">
            generatedAt: {new Date(data.generatedAt).toISOString()}
          </span>
          <span>·</span>
          <span>{data.markets.length} שווקים</span>
        </div>
      )}

      {isLoading && (
        <div className="rounded-lg border border-border bg-bg-raised p-6 text-fg-muted">
          {he.common.loading}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-danger/50 bg-danger/10 p-4 text-danger">
          {he.common.error}
          <pre className="mono mt-2 whitespace-pre-wrap text-xs">
            {(error as Error).message}
          </pre>
        </div>
      )}

      {data && data.markets.length === 0 && (
        <div className="rounded-lg border border-border bg-bg-raised p-6 text-fg-muted">
          {he.common.noResults}
        </div>
      )}

      <ul className="grid gap-3 md:grid-cols-2">
        {data?.markets.map((m) => {
          const delta = m.priceChange24h ?? 0;
          const deltaPositive = delta > 0;
          const deltaNegative = delta < 0;
          return (
            <li
              key={m.id}
              className="rounded-lg border border-border bg-bg-raised p-4"
            >
              <div className="mb-3 flex items-start gap-3">
                {m.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.icon}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 shrink-0 rounded-md bg-bg-muted" />
                )}
                <h3 className="text-base font-semibold leading-snug">
                  {m.question}
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div className="text-xs text-fg-subtle">
                    {he.scanner.card.yes}
                  </div>
                  <div className="num text-base font-semibold text-success">
                    {m.yesPrice != null ? fmtPct(m.yesPrice) : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-fg-subtle">
                    {he.scanner.card.no}
                  </div>
                  <div className="num text-base font-semibold text-danger">
                    {m.noPrice != null ? fmtPct(m.noPrice) : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-fg-subtle">
                    {he.scanner.card.change24h}
                  </div>
                  <div
                    className={`num text-base font-semibold ${
                      deltaPositive
                        ? "text-success"
                        : deltaNegative
                          ? "text-danger"
                          : "text-fg-muted"
                    }`}
                  >
                    {m.priceChange24h != null
                      ? fmtPctSigned(m.priceChange24h)
                      : "—"}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-fg-muted">
                <span>
                  {he.scanner.card.volume24h}:{" "}
                  <span className="num">{fmtUsdCompact(m.volume24h)}</span>
                </span>
                <span>
                  {he.scanner.card.liquidity}:{" "}
                  <span className="num">{fmtUsdCompact(m.liquidity)}</span>
                </span>
                <span>
                  {he.scanner.card.endsOn}{" "}
                  <span className="num">{fmtDate(m.endDate)}</span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <footer className="mt-10 border-t border-border pt-4 text-xs text-fg-subtle">
        {he.disclaimers.notAdvice} {he.disclaimers.jurisdiction}
      </footer>
    </main>
  );
}
