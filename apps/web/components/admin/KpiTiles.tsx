import { Card } from "@/components/ui";
import { admin } from "@/content/admin";
import type { Summary } from "./types";

export const formatNumber = (n: number) => n.toLocaleString("vi-VN");

/** The four KPI tiles. Shows "–" until the first response arrives. */
export function KpiTiles({ summary }: { summary: Summary | undefined }) {
  const k = admin.kpis;
  const tiles = [
    { ...k.totalEvents, value: summary && formatNumber(summary.totalEvents) },
    { ...k.uniqueSessions, value: summary && formatNumber(summary.uniqueSessions) },
    { ...k.pageViews, value: summary && formatNumber(summary.pageViews) },
    { ...k.mobileShare, value: summary && `${summary.mobileShare}%` },
  ];
  return (
    <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 p-0">
      {tiles.map((t) => (
        <Card as="li" key={t.label} className="flex flex-col gap-1.5 rounded-[18px] p-[18px]">
          <span className="text-[13px] text-bk-muted">{t.label}</span>
          <span className="text-3xl font-bold tabular-nums">{t.value ?? "–"}</span>
          <span className="text-xs text-bk-muted">{t.hint}</span>
        </Card>
      ))}
    </ul>
  );
}
