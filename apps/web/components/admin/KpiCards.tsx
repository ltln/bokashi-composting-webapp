import { Card } from "@/components/ui";
import { admin } from "@/content/admin";
import { cn } from "@/lib/cn";
import { formatDecimal, formatDelta, formatNumber } from "./query";
import type { Metric, Overview } from "./types";

/** Sparkline path in a 100×28 box from the non-null values. */
function spark(values: number[]): string {
  const max = Math.max(1, ...values);
  const n = values.length;
  return values
    .map((v, i) => `${i ? "L" : "M"}${(n === 1 ? 50 : (i * 100) / (n - 1)).toFixed(1)} ${(26 - (v / max) * 24).toFixed(1)}`)
    .join(" ");
}

const STROKE: Record<Metric, string> = {
  visits: "stroke-bk-primary",
  users: "stroke-bk-faq-liquid-fg",
  views: "stroke-bk-accent-dark",
};

/** Pages per visit, "3,8"; "0" with no visits. */
export function pagesPerVisit(o: Overview): string {
  return o.totals.visits ? formatDecimal(o.totals.views / o.totals.visits) : "0";
}

/** The three KPI cards: value, change vs the previous period, sparkline. */
export function KpiCards({ data }: { data: Overview | undefined }) {
  const k = admin.kpis;
  const cards: { metric: Metric; label: string; sub: string }[] = [
    { metric: "visits", label: k.visits.label, sub: k.visits.sub },
    { metric: "users", label: k.users.label, sub: k.users.sub(data ? formatNumber(data.totals.newUsers) : "–") },
    { metric: "views", label: k.views.label, sub: k.views.sub(data ? pagesPerVisit(data) : "–") },
  ];
  return (
    <ul aria-label={admin.kpisLabel} className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3 p-0">
      {cards.map((c) => {
        const delta = data && formatDelta(data.totals[c.metric], data.previous[c.metric]);
        const values = data?.series.map((p) => p[c.metric]).filter((v): v is number => v !== null) ?? [];
        return (
          <Card as="li" key={c.metric} className="flex flex-col gap-1.5 rounded-[18px] px-[18px] pb-3.5 pt-[18px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-bk-illo-label">{c.label}</span>
              {delta && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-bold",
                    delta.down ? "bg-bk-accent-tint text-bk-accent-dark" : "bg-bk-nav-active text-bk-admin-delta",
                  )}
                >
                  {delta.text}
                </span>
              )}
            </div>
            <span className="text-[32px] font-bold leading-10 tabular-nums">
              {data ? formatNumber(data.totals[c.metric]) : "–"}
            </span>
            <svg viewBox="0 0 100 28" width="100%" height="28" preserveAspectRatio="none" aria-hidden="true">
              {values.length > 0 && (
                <path
                  d={spark(values)}
                  fill="none"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                  className={STROKE[c.metric]}
                />
              )}
            </svg>
            <span className="text-xs text-bk-muted">{c.sub}</span>
          </Card>
        );
      })}
    </ul>
  );
}
