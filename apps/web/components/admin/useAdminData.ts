"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { adminPath, featuresPath, logsPath, POLL_MS } from "./query";
import type { DeviceCount, EventTypeCount, FeatureCount, FeatureTab, Filters, LogRow, LogsPage, Summary } from "./types";

const fetcher = <T,>(path: string) => api<T>(path);
const opts = { refreshInterval: POLL_MS, keepPreviousData: true, revalidateOnFocus: false } as const;

export function useSummary(f: Filters) {
  return useSWR<Summary>(adminPath("summary", f), fetcher, opts);
}
export function useFeatures(f: Filters, tab: FeatureTab) {
  return useSWR<FeatureCount[]>(featuresPath(f, tab), fetcher, opts);
}
export function useEventTypes(f: Filters) {
  return useSWR<EventTypeCount[]>(adminPath("event-types", f), fetcher, opts);
}
export function useDevices(f: Filters) {
  return useSWR<DeviceCount[]>(adminPath("devices", f), fetcher, opts);
}

interface Extra {
  key: string;
  items: LogRow[];
  next: string | null | undefined; // undefined = nothing loaded yet
}

/**
 * The newest page is polled with SWR; "load more" appends older pages kept in
 * local state, which resets whenever the filters or the search change.
 */
export function useLogs(f: Filters, target: string) {
  const key = logsPath(f, target);
  const first = useSWR<LogsPage>(key, fetcher, opts);
  const [extra, setExtra] = useState<Extra>({ key, items: [], next: undefined });
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);

  const mine: Extra = extra.key === key ? extra : { key, items: [], next: undefined };
  const nextCursor = mine.next !== undefined ? mine.next : (first.data?.nextCursor ?? null);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setMoreError(false);
    try {
      const page = await api<LogsPage>(logsPath(f, target, nextCursor));
      setExtra((prev) => ({
        key,
        items: [...(prev.key === key ? prev.items : []), ...page.items],
        next: page.nextCursor,
      }));
    } catch {
      setMoreError(true);
    } finally {
      setLoadingMore(false);
    }
  }, [f, target, key, nextCursor, loadingMore]);

  const head = first.data?.items ?? [];
  const seen = new Set(head.map((r) => r.id));
  const items = [...head, ...mine.items.filter((r) => !seen.has(r.id))];

  return {
    items,
    hasMore: nextCursor !== null,
    loadMore,
    loadingMore,
    moreError,
    error: first.error as unknown,
    isLoading: first.isLoading,
  };
}
