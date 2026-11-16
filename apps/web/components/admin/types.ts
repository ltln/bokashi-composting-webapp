/** Shapes returned by the Go API under /api/admin (apps/api/internal/analytics). */
export type Range = "today" | "7d" | "30d" | "all";
export type Device = "all" | "mobile" | "desktop";
export type FeatureTab = "all" | "setup" | "faq";

export interface Filters {
  range: Range;
  device: Device;
}

export interface Summary {
  totalEvents: number;
  uniqueSessions: number;
  pageViews: number;
  /** Percent of events from mobile, 0-100. */
  mobileShare: number;
}

export interface FeatureCount {
  target: string;
  count: number;
}

export interface EventTypeCount {
  type: string;
  count: number;
}

export interface DeviceCount {
  deviceType: string;
  count: number;
}

export interface LogRow {
  id: number;
  /** RFC 3339 in Asia/Ho_Chi_Minh (+07:00). */
  ts: string;
  sessionId: string;
  eventType: string;
  featureTarget: string | null;
  deviceType: string;
  deviceInfo: string | null;
}

export interface LogsPage {
  items: LogRow[];
  nextCursor: string | null;
}
