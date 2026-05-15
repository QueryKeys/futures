import { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Search, ArrowUpDown, Sparkles, ExternalLink } from 'lucide-react';
import { FilterChip } from '../components/FilterChip.jsx';
import { useMarkets } from '../lib/useMarkets.js';
import { useFavorites, useAiCredits } from '../lib/useFavorites.js';
import { CATEGORIES, CATEGORY_BY_SLUG } from '../config/categories.js';
import { fmtPercent, fmtUsd, fmtDays, fmtInt } from '../lib/enrichers.js';
import { cn } from '../lib/cn.js';

// 20,098 — the published total market count for Polymarket as of build.
const PLATFORM_TOTAL = 20098;

const LIQUIDITY_FILTERS = [
  { slug: 'lt10', label: 'מתחת ל-$10k', test: (m) => m.liquidity < 10_000 },
  { slug: '10to50', label: '$10k-$50k', test: (m) => m.liquidity >= 10_000 && m.liquidity < 50_000 },
  { slug: '50to250', label: '$50k-$250k', test: (m) => m.liquidity >= 50_000 && m.liquidity < 250_000 },
  { slug: 'gt250', label: 'מעל $250k', test: (m) => m.liquidity >= 250_000 },
];
const PRICE_FILTERS = [
  { slug: 'longshot', label: 'הימור ארוך (<25%)', test: (m) => m.probability != null && m.probability < 0.25 },
  { slug: 'mid', label: '25%-75%', test: (m) => m.probability != null && m.probability >= 0.25 && m.probability <= 0.75 },
  { slug: 'consensus', label: 'קונצנזוס (>75%)', test: (m) => m.probability != null && m.probability > 0.75 },
];
const TIME_FILTERS = [
  { slug: 'lt7', label: 'תוך שבוע', test: (m) => m.daysLeft != null && m.daysLeft <= 7 },
  { slug: 'lt30', label: 'תוך חודש', test: (m) => m.daysLeft != null && m.daysLeft <= 30 },
  { slug: 'lt90', label: 'תוך 3 חודשים', test: (m) => m.daysLeft != null && m.daysLeft <= 90 },
  { slug: 'gt90', label: 'מעל 3 חודשים', test: (m) => m.daysLeft != null && m.daysLeft > 90 },
];
const CATEGORY_OPTIONS = CATEGORIES.filter((c) => c.slug !== 'all').map((c) => ({
  slug: c.slug,
  label: c.label,
}));

export function AllEvents() {
  const { data: markets, loading } = useMarkets({ limit: 500 });
  const { isFavorite, toggle } = useFavorites();
  const credits = useAiCredits();

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    liquidity: null,
    price: null,
    time: null,
    category: null,
  });
  const [sorting, setSorting] = useState([{ id: 'volume24', desc: true }]);

  const filtered = useMemo(() => {
    let out = markets;
    if (filters.liquidity) {
      const f = LIQUIDITY_FILTERS.find((x) => x.slug === filters.liquidity);
      if (f) out = out.filter(f.test);
    }
    if (filters.price) {
      const f = PRICE_FILTERS.find((x) => x.slug === filters.price);
      if (f) out = out.filter(f.test);
    }
    if (filters.time) {
      const f = TIME_FILTERS.find((x) => x.slug === filters.time);
      if (f) out = out.filter(f.test);
    }
    if (filters.category) {
      out = out.filter((m) => m.category === filters.category);
    }
    return out;
  }, [markets, filters]);

  const columns = useMemo(
    () => [
      {
        id: 'question',
        accessorKey: 'question',
        header: 'שווק',
        cell: ({ row }) => (
          <div className="flex items-center gap-3 min-w-0">
            {row.original.image ? (
              <img
                src={row.original.image}
                alt=""
                className="h-9 w-9 rounded-lg shrink-0 object-cover bg-bg-elevated"
                loading="lazy"
              />
            ) : (
              <div className="h-9 w-9 rounded-lg bg-bg-elevated shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm text-text font-medium line-clamp-1">{row.original.question}</p>
              <p className="text-[11px] text-text-dim mt-0.5">
                {CATEGORY_BY_SLUG[row.original.category]?.label}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'probability',
        accessorKey: 'probability',
        header: 'הסתברות',
        cell: ({ getValue }) => (
          <span className="text-sm font-semibold text-text">
            <bdi className="num">{fmtPercent(getValue())}</bdi>
          </span>
        ),
      },
      {
        id: 'liquidity',
        accessorKey: 'liquidity',
        header: 'נזילות',
        cell: ({ getValue }) => (
          <span className="text-sm text-text-muted">
            <bdi className="num">{fmtUsd(getValue())}</bdi>
          </span>
        ),
      },
      {
        id: 'volume24',
        accessorKey: 'volume24',
        header: 'נפח 24ש',
        cell: ({ getValue }) => (
          <span className="text-sm text-text-muted">
            <bdi className="num">{fmtUsd(getValue())}</bdi>
          </span>
        ),
      },
      {
        id: 'daysLeft',
        accessorKey: 'daysLeft',
        header: 'נותרו',
        cell: ({ getValue }) => (
          <span className="text-sm text-text-muted">
            <bdi className="num">{fmtDays(getValue())}</bdi>
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => toggle(row.original)}
              className={cn(
                'rounded-lg p-1.5 transition-colors',
                isFavorite(row.original.id)
                  ? 'text-cta'
                  : 'text-text-dim hover:text-text'
              )}
              aria-label="שמור"
            >
              <Sparkles className="h-4 w-4" />
            </button>
            <a
              href={row.original.slug ? `https://polymarket.com/market/${row.original.slug}` : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-1.5 text-text-dim hover:text-text transition-colors"
              aria-label="פתח ב-Polymarket"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ),
      },
    ],
    [isFavorite, toggle]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
  });

  const visibleCount = table.getFilteredRowModel().rows.length;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-6">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text">כל השווקים</h1>
            <p className="text-sm text-text-muted mt-1">
              <bdi className="num">{fmtInt(visibleCount)}</bdi> מתוך{' '}
              <bdi className="num">{fmtInt(PLATFORM_TOTAL)}</bdi> שווקים
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-card px-3 py-2">
            <Sparkles className="h-4 w-4 text-cta" />
            <div className="text-xs">
              <p className="text-text">
                <bdi className="num">{credits.remaining}</bdi> קרדיטי AI נותרו השבוע
              </p>
              <p className="text-[10px] text-text-dim">
                שאל את ה-AI לסיכום לפני קנייה ({credits.total} שאלות שבועיות)
              </p>
            </div>
          </div>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-text-dim inset-inline-start-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חפש שווק..."
              className="w-full rounded-xl border border-border bg-bg-card ps-10 pe-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <FilterChip
            label="נזילות"
            value={filters.liquidity}
            options={LIQUIDITY_FILTERS}
            onChange={(v) => setFilters((f) => ({ ...f, liquidity: v }))}
          />
          <FilterChip
            label="מחיר"
            value={filters.price}
            options={PRICE_FILTERS}
            onChange={(v) => setFilters((f) => ({ ...f, price: v }))}
          />
          <FilterChip
            label="זמן"
            value={filters.time}
            options={TIME_FILTERS}
            onChange={(v) => setFilters((f) => ({ ...f, time: v }))}
          />
          <FilterChip
            label="קטגוריה"
            value={filters.category}
            options={CATEGORY_OPTIONS}
            onChange={(v) => setFilters((f) => ({ ...f, category: v }))}
          />
        </div>

        <div className="rounded-2xl border border-border bg-bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-elevated border-b border-border">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((h) => (
                      <th
                        key={h.id}
                        className="px-4 py-3 text-start text-[11px] uppercase tracking-wider text-text-muted font-semibold"
                      >
                        {h.isPlaceholder ? null : h.column.getCanSort() ? (
                          <button
                            type="button"
                            onClick={h.column.getToggleSortingHandler()}
                            className="inline-flex items-center gap-1 hover:text-text transition-colors"
                          >
                            {flexRender(h.column.columnDef.header, h.getContext())}
                            <ArrowUpDown className="h-3 w-3 opacity-60" />
                          </button>
                        ) : (
                          flexRender(h.column.columnDef.header, h.getContext())
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-border-subtle">
                      {columns.map((_c, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 w-full max-w-[160px] rounded shimmer" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-12 text-center text-text-muted">
                      לא נמצאו שווקים תואמים
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-border-subtle hover:bg-bg-elevated/40 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
