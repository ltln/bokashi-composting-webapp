"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import { overviewPath, POLL_MS } from "./query";
import type { Filters, Overview } from "./types";

const fetcher = <T,>(path: string) => api<T>(path);

/** The whole dashboard in one request, polled every 15 s. */
export function useOverview(f: Filters) {
  return useSWR<Overview>(overviewPath(f), fetcher, {
    refreshInterval: POLL_MS,
    keepPreviousData: true,
    revalidateOnFocus: false,
  });
}
