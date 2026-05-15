"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "@/lib/api";
import { fmtUsdCompact, fmtDate } from "@/lib/format";
import { LivePill } from "@/components/ui/LivePill";

type FilterStatus = "active" | "closed" | "all";

const FILTER_LABELS: Record<FilterStatus, string> = {
  all: "הכל",
  active: "פעיל",
  closed: "סגור",
};

export default function EventsPage() {
  const [status, setStatus] = useState<FilterStatus>("active");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["events", status],
    queryFn: ({ signal }) =>
      fetchEvents(
        {
          limit: 50,
          ...(status === "active" && { active: true }),
          ...(status === "closed" && { closed: true }),
        },
        signal,
      ),
    refetchInterval: 90_000,
  });

  const rows = (data?.data ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <header className="sticky top-0 z-10 border-b border-border bg-bg/90 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-fg">אירועים</h1>
          <p className="text-xs text-fg-subtle">כל שוקי החיזוי ממוינים לפי מחזור</p>
        </div>
        <LivePill />
      </header>

      <div className="px-4 py-4">
        <div className="flex gap-2 mb-5" role="group" aria-label="סינון">
          {(["active", "closed", "all"] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                status === s
                  ? "bg-accent text-white border-accent"
                  : "bg-bg-raised text-fg-subtle border-border hover:text-fg"
              }`}
            >
              {FILTER_LABELS[s]}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex justify-center py-20 text-fg-subtle">טוען…</div>
        )}
        {isError && (
          <div className="text-danger text-center py-20">שגיאה בטעינה</div>
        )}

        {!isLoading && !isError && (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-raised">
                  <th className="py-3 px-4 text-right font-medium text-fg-subtle">אירוע</th>
                  <th className="py-3 px-4 text-left font-medium text-fg-subtle num">מחזור 24ש׳</th>
                  <th className="py-3 px-4 text-left font-medium text-fg-subtle num">נזילות</th>
                  <th className="py-3 px-4 text-left font-medium text-fg-subtle">סיום</th>
                  <th className="py-3 px-4 text-left font-medium text-fg-subtle">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-fg-subtle">
                      אין אירועים
                    </td>
                  </tr>
                )}
                {rows.map((ev, i) => {
                  const id = String(ev["id"] ?? i);
                  const title = String(ev["title"] ?? "—");
                  const v24 = Number(ev["volume24hr"] ?? ev["volume24h"] ?? 0);
                  const liq = Number(ev["liquidity"] ?? 0);
                  const endDate = String(ev["endDate"] ?? ev["endDateIso"] ?? "");
                  const active = Boolean(ev["active"]);
                  const closed = Boolean(ev["closed"]);

                  return (
                    <tr
                      key={id}
                      className="border-b border-border last:border-0 hover:bg-bg-raised/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <p className="text-fg line-clamp-1 max-w-xs">{title}</p>
                      </td>
                      <td className="py-3 px-4 num text-left text-fg-muted">
                        {fmtUsdCompact(v24)}
                      </td>
                      <td className="py-3 px-4 num text-left text-fg-muted">
                        {fmtUsdCompact(liq)}
                      </td>
                      <td className="py-3 px-4 num text-left text-fg-muted">
                        {endDate ? fmtDate(endDate) : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            closed
                              ? "bg-fg-subtle/10 text-fg-subtle"
                              : active
                                ? "bg-success/10 text-success"
                                : "bg-fg-subtle/10 text-fg-subtle"
                          }`}
                        >
                          {closed ? "סגור" : active ? "פעיל" : "לא פעיל"}
                        </span>
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
