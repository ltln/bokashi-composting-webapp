import { admin } from "@/content/admin";
import type { Filters, Metric, Overview, OverviewPoint, OverviewRange } from "./types";

export const DEFAULT_FILTERS: Filters = { range: "7d", device: "all" };
export const POLL_MS = 15_000;

type Param = string | number | null | undefined;

/** Query string (with the leading "?", or "" when empty) that skips empty values. */
export function buildQuery(params: Record<string, Param>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/** Path for the `api()` helper (which adds the `/api` prefix). */
export function overviewPath(f: Filters): string {
  return `/admin/overview${buildQuery({ range: f.range, device: f.device })}`;
}

/** Browser URL of the CSV export for the current filters. */
export function exportHref(f: Filters): string {
  return `/api/admin/export.csv${buildQuery({ range: f.range, device: f.device })}`;
}

export const formatNumber = (n: number) => Math.round(n).toLocaleString("vi-VN");

/** One decimal with a Vietnamese comma: 3.8 -> "3,8". */
export const formatDecimal = (n: number) => n.toFixed(1).replace(".", ",");

/** "+18%", "−5%", "0%"; `admin.deltaNew` when there was nothing before. */
export function formatDelta(cur: number, prev: number): { text: string; down: boolean } {
  if (prev <= 0) return { text: cur > 0 ? admin.deltaNew : "0%", down: false };
  const pct = Math.round(((cur - prev) / prev) * 100);
  if (pct > 0) return { text: `+${pct}%`, down: false };
  if (pct < 0) return { text: `−${-pct}%`, down: true };
  return { text: "0%", down: false };
}

/** "2026-11-19" -> { d, m, y } as numbers. */
function parts(day: string) {
  const [y = 1970, m = 1, d = 1] = day.split("-").map(Number);
  return { y, m, d };
}
const p2 = (n: number) => String(n).padStart(2, "0");

/** Subtitle range text, e.g. "7 ngày qua (13/11 – 19/11)". */
export function rangeText(o: Pick<Overview, "range" | "from" | "to">): string {
  const a = parts(o.from);
  const b = parts(o.to);
  if (o.range === "today") return admin.rangeText.today(`${p2(b.d)}/${p2(b.m)}/${b.y}`);
  return admin.rangeText[o.range](`${p2(a.d)}/${p2(a.m)}`, `${p2(b.d)}/${p2(b.m)}`);
}

/** x-axis / tooltip label of a bucket: "9h" (hours), "T6 13/11" (7 days), "21/10" (30 days). */
export function bucketLabel(start: string, range: OverviewRange): string {
  const [day = "", time = "00:00"] = start.split("T");
  if (range === "today") return `${Number(time.slice(0, 2))}h`;
  const { y, m, d } = parts(day);
  const date = `${d}/${m}`;
  if (range === "30d") return date;
  const wd = admin.weekdays[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${wd} ${date}`;
}

export function current(p: OverviewPoint, m: Metric): number | null {
  return p[m];
}

export function previous(p: OverviewPoint, m: Metric): number {
  return m === "visits" ? p.prevVisits : m === "users" ? p.prevUsers : p.prevViews;
}

/** Y axis: 4 "nice" steps covering max with a little headroom. */
export function niceSteps(max: number): number[] {
  const raw = (Math.max(max, 1) * 1.08) / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((k) => k * mag >= raw) ?? 10) * mag;
  // Whole numbers only: counts never need fractional ticks.
  const s = Math.max(1, Math.ceil(step));
  return [0, 1, 2, 3, 4].map((k) => k * s);
}

/**
 * The run of busy hours around the peak (hours at >= 60% of the peak), as
 * [first, last + 1] for "Đông nhất 19–22h". null when there is no traffic.
 */
export function peakWindow(hours: number[]): [number, number] | null {
  const max = Math.max(0, ...hours);
  if (max === 0) return null;
  const busy = (h: number) => (hours[h] ?? 0) >= max * 0.6;
  const peak = hours.indexOf(max);
  let a = peak;
  let b = peak;
  while (a > 0 && busy(a - 1)) a--;
  while (b < 23 && busy(b + 1)) b++;
  return [a, b + 1];
}

/** Tab of a screen's Feature_Target. */
export function tabOf(target: string): "setup" | "faq" {
  return target === "Tab_1_Setup" || target.startsWith("3D_Setup_") ? "setup" : "faq";
}

export function chartFileName(range: OverviewRange): string {
  return `bokashi-trang-duoc-xem-${range}.png`;
}
