const usdFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdCompactFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const pctFmt = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const dateFmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function fmtUsd(n: number): string {
  return usdFmt.format(n);
}

export function fmtUsdCompact(n: number): string {
  return usdCompactFmt.format(n);
}

export function fmtPct(n: number): string {
  return pctFmt.format(n);
}

export function fmtPctSigned(n: number): string {
  const s = pctFmt.format(Math.abs(n));
  return n >= 0 ? `+${s}` : `-${s}`;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return dateFmt.format(new Date(iso));
  } catch {
    return iso;
  }
}

export function fmtAddr(addr: string): string {
  if (!addr || addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function fmtRelTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "עכשיו";
  if (diffMin < 60) return `לפני ${diffMin}ד׳`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `לפני ${diffH}ש׳`;
  return `לפני ${Math.floor(diffH / 24)}י׳`;
}
