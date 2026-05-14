/**
 * Number / date formatters. We deliberately use `en-US` for numbers so digits
 * stay LTR and tabular even on RTL pages — Hebrew locale digits would render
 * normally but read awkwardly next to currency symbols and percentages.
 */

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

const percentSigned = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

export function fmtUsd(n: number): string {
  return usd.format(n);
}

export function fmtUsdCompact(n: number): string {
  return usdCompact.format(n);
}

export function fmtPct(probability: number): string {
  return percent.format(probability);
}

export function fmtPctSigned(delta: number): string {
  return percentSigned.format(delta);
}

export function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("he-IL", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
