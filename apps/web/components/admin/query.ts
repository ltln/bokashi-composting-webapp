import type { Filters, FeatureTab, Range } from "./types";

export const DEFAULT_FILTERS: Filters = { range: "7d", device: "all" };
export const POLL_MS = 15_000;
export const LOGS_PAGE_SIZE = 50;

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
export function adminPath(endpoint: string, f: Filters, extra: Record<string, Param> = {}): string {
  return `/admin/${endpoint}${buildQuery({ range: f.range, device: f.device, ...extra })}`;
}

/** Browser URL of the CSV export for the current filters. */
export function exportHref(f: Filters, target: string): string {
  return `/api/admin/export.csv${buildQuery({ range: f.range, device: f.device, target })}`;
}

export function featuresPath(f: Filters, tab: FeatureTab): string {
  return adminPath("features", f, { tab });
}

export function logsPath(f: Filters, target: string, cursor?: string | null): string {
  return adminPath("logs", f, { target, cursor, limit: LOGS_PAGE_SIZE });
}

const ICT = "Asia/Ho_Chi_Minh";

function ictDate(now: Date): Date {
  // Calendar date in Ho Chi Minh City, as a UTC-midnight Date for day arithmetic.
  const [y = 1970, m = 1, d = 1] = new Intl.DateTimeFormat("en-CA", {
    timeZone: ICT,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .split("-")
    .map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fmt(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

/** Human date range for the PNG subtitle, mirroring the API's day boundaries. */
export function dateRangeLabel(range: Range, now: Date = new Date()): string {
  const today = ictDate(now);
  if (range === "all") return `Toàn chiến dịch, đến ${fmt(today)}`;
  if (range === "today") return fmt(today);
  const back = range === "7d" ? 6 : 29;
  const start = new Date(today.getTime() - back * 86_400_000);
  return `${fmt(start)} – ${fmt(today)}`;
}

export function chartFileName(range: Range): string {
  return `bokashi-features-${range}.png`;
}

/** Tab 1 (setup) or Tab 2 (faq) for a Feature_Target, from its prefix. */
export function tabOf(target: string): "setup" | "faq" {
  return target === "Tab_1_Setup" || target.startsWith("3D_Setup_") ? "setup" : "faq";
}
