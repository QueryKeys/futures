"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSharks } from "@/lib/api";
import { fmtUsdCompact, fmtPct, fmtAddr, fmtRelTime } from "@/lib/format";
import { LivePill } from "@/components/ui/LivePill";

const MIN_SIZES = [1_000, 5_000, 10_000, 50_000];

export default function SharksPage() {
  const [minSize, setMinSize] = useState(5_000);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["sharks", minSize],
    queryFn: ({ signal }) => fetchSharks({ minSize, limit: 50 }, signal),
    refetchInterval: 30_000,
  });

  const trades = (data?.data ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <header className="sticky top-0 z-10 border-b border-border bg-bg/90 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-fg">ראדאר כרישים</h1>
          <p className="text-xs text-fg-subtle">עסקאות גדולות בזמן אמת</p>
        </div>
        <LivePill />
      </header>

      <div className="px-4 py-4">
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className="text-sm text-fg-subtle">גודל מינימלי:</span>
          {MIN_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setMinSize(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium num transition-colors border ${
                minSize === s
                  ? "bg-accent text-white border-accent"
                  : "bg-bg-raised text-fg-subtle border-border hover:text-fg"
              }`}
            >
              {fmtUsdCompact(s)}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex justify-center py-20 text-fg-subtle">טוען…</div>
        )}

        {isError && (
          <div className="text-center py-20 space-y-2">
            <p className="text-danger">שגיאה בטעינת נתוני הכרישים</p>
            <p className="text-xs text-fg-subtle">ייתכן שממשק ה-API אינו זמין</p>
          </div>
        )}

        {!isLoading && !isError && trades.length === 0 && (
          <div className="text-center py-20 text-fg-subtle">
            אין עסקאות מעל {fmtUsdCompact(minSize)} ברגע זה
          </div>
        )}

        {trades.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-raised">
                  <th className="py-3 px-4 text-right font-medium text-fg-subtle">זמן</th>
                  <th className="py-3 px-4 text-right font-medium text-fg-subtle">שוק</th>
                  <th className="py-3 px-4 text-left font-medium text-fg-subtle">צד</th>
                  <th className="py-3 px-4 text-left font-medium text-fg-subtle num">גודל ($)</th>
                  <th className="py-3 px-4 text-left font-medium text-fg-subtle num">מחיר</th>
                  <th className="py-3 px-4 text-left font-medium text-fg-subtle">ארנק</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t, i) => {
                  const id = String(t["id"] ?? t["transactionHash"] ?? i);
                  const title = String(
                    t["title"] ?? t["market"] ?? t["question"] ?? "—",
                  );
                  const side = String(
                    t["side"] ?? t["type"] ?? "",
                  ).toUpperCase();
                  const isBuy = side === "BUY";
                  const usdcSize = Number(
                    t["usdcSize"] ?? t["size"] ?? t["amount"] ?? 0,
                  );
                  const price = Number(t["price"] ?? 0);
                  const ts = String(
                    t["timestamp"] ?? t["createdAt"] ?? t["time"] ?? "",
                  );
                  const wallet = String(
                    t["proxyWallet"] ?? t["maker"] ?? t["taker"] ?? "",
                  );

                  return (
                    <tr
                      key={id}
                      className="border-b border-border last:border-0 hover:bg-bg-raised/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-fg-subtle num whitespace-nowrap">
                        {ts ? fmtRelTime(ts) : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-fg line-clamp-1 max-w-[180px]">{title}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold ${
                            isBuy
                              ? "bg-success/10 text-success"
                              : "bg-danger/10 text-danger"
                          }`}
                        >
                          {isBuy ? "קנייה" : "מכירה"}
                        </span>
                      </td>
                      <td className="py-3 px-4 num text-fg font-medium">
                        {fmtUsdCompact(usdcSize)}
                      </td>
                      <td className="py-3 px-4 num text-fg-muted">
                        {price > 0 ? fmtPct(price) : "—"}
                      </td>
                      <td className="py-3 px-4">
                        {wallet ? (
                          <span className="mono text-xs text-fg-subtle">
                            {fmtAddr(wallet)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
