/** Shapes returned by the Go API under /api/admin (apps/api/internal/analytics). */

/** Ranges of the CSV export (export.csv also accepts "all"). */
export type Range = "today" | "7d" | "30d" | "all";
/** Ranges of the overview: each one has a previous period to compare with. */
export type OverviewRange = Exclude<Range, "all">;
export type Device = "all" | "mobile" | "desktop";
/** Series shown on the traffic chart. */
export type Metric = "visits" | "users" | "views";

export interface Filters {
  range: OverviewRange;
  device: Device;
}

export interface OverviewTotals {
  visits: number;
  users: number;
  newUsers: number;
  views: number;
}

export interface OverviewPoint {
  /** Local (Asia/Ho_Chi_Minh) bucket start, "YYYY-MM-DDTHH:mm". */
  start: string;
  /** null for buckets still in the future. */
  visits: number | null;
  users: number | null;
  views: number | null;
  prevVisits: number;
  prevUsers: number;
  prevViews: number;
}

export interface Overview {
  range: OverviewRange;
  unit: "hour" | "day";
  /** First and last local day of the period, YYYY-MM-DD. */
  from: string;
  to: string;
  online: number;
  totals: OverviewTotals;
  /** The same elapsed time, one period earlier. */
  previous: OverviewTotals;
  series: OverviewPoint[];
  /** Screens with at least one view, most viewed first. */
  pages: { target: string; views: number; viewers: number }[];
  /** Visits per device type. */
  devices: { mobile: number; desktop: number; tablet: number };
  /** Visits started per local hour of day, 0-23. */
  hours: number[];
  funnel: { users: number; step1: number; allSteps: number; faqTab: number; faqDetail: number };
}
