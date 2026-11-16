"use client";

import { admin } from "@/content/admin";
import type { LogRow } from "./types";

export interface LogsTableProps {
  rows: LogRow[];
  search: string;
  onSearch: (value: string) => void;
  hasMore: boolean;
  loadingMore: boolean;
  failed: boolean;
  onLoadMore: () => void;
}

/** "2031-06-15T09:00:00+07:00" -> "2031-06-15 09:00:00" (the API already sends +07:00). */
export const formatTs = (ts: string) => ts.slice(0, 19).replace("T", " ");

const mono = "px-3.5 py-2.5 font-mono";

/** Recent logs: Feature_Target prefix search, a table scrolling inside its own box, and "load more". */
export function LogsTable({ rows, search, onSearch, hasMore, loadingMore, failed, onLoadMore }: LogsTableProps) {
  const l = admin.logs;
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="m-0 text-[17px] font-bold">{l.title}</h2>
        <label className="flex items-center gap-2 text-[13px] text-bk-muted">
          {l.searchLabel}
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={l.searchPlaceholder}
            className="min-h-touch w-[200px] max-w-full rounded-[10px] border border-bk-input-border bg-bk-surface px-3 text-[13px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bk-primary"
          />
        </label>
      </div>
      <div className="overflow-x-auto rounded-xl border border-bk-divider" tabIndex={0} role="region" aria-label={l.title}>
        <table className="w-full min-w-[720px] border-collapse text-[13px]">
          <thead>
            <tr className="bg-bk-ground text-left">
              {l.columns.map((c) => (
                <th key={c} scope="col" className="px-3.5 py-2.5 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-bk-divider">
                <td className="px-3.5 py-2.5 tabular-nums text-bk-muted">{formatTs(r.ts)}</td>
                <td className={mono} title={r.sessionId}>
                  {r.sessionId.slice(0, 8)}
                </td>
                <td className={mono}>{r.eventType}</td>
                <td className={mono}>{r.featureTarget ?? l.noTarget}</td>
                <td className="px-3.5 py-2.5">{r.deviceInfo ?? r.deviceType}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr className="border-t border-bk-divider">
                <td colSpan={l.columns.length} className="px-3.5 py-6 text-center text-bk-muted">
                  {l.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {failed && <p className="m-0 text-[13px] text-bk-accent-dark">{admin.loadFailed}</p>}
      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="min-h-touch self-center rounded-bk-sm border border-bk-border bg-bk-surface px-5 text-sm font-semibold hover:bg-bk-ground disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bk-primary"
        >
          {loadingMore ? l.loadingMore : l.loadMore}
        </button>
      )}
    </div>
  );
}
