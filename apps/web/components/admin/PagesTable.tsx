import { admin } from "@/content/admin";
import { cn } from "@/lib/cn";
import { formatNumber, tabOf } from "./query";
import type { Overview } from "./types";

export interface PageRow {
  target: string;
  name: string;
  tab: "setup" | "faq";
  views: number;
  viewers: number;
}

/** Every app screen (zeros included), most viewed first. */
export function pageRows(o: Overview): PageRow[] {
  const byTarget = new Map(o.pages.map((p) => [p.target, p]));
  return Object.entries(admin.pages.names)
    .map(([target, name]) => ({
      target,
      name,
      tab: tabOf(target),
      views: byTarget.get(target)?.views ?? 0,
      viewers: byTarget.get(target)?.viewers ?? 0,
    }))
    .sort((a, b) => b.views - a.views);
}

const TAG = { setup: "bg-bk-nav-active text-bk-primary-dark", faq: "bg-bk-faq-liquid-bg text-bk-faq-liquid-fg" };
const BAR = { setup: "bg-bk-primary", faq: "bg-bk-faq-liquid-fg" };

export function PagesTable({ data, ppv }: { data: Overview; ppv: string }) {
  const rows = pageRows(data);
  const total = rows.reduce((a, r) => a + r.views, 0);
  const max = Math.max(1, ...rows.map((r) => r.views));
  const c = admin.pages.columns;
  return (
    <section
      aria-labelledby="admin-pages"
      className="flex min-w-0 flex-[999_1_560px] flex-col gap-3 rounded-bk-card bg-bk-surface p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="admin-pages" className="m-0 text-lg font-bold">
          {admin.pages.title}
        </h2>
        <span className="text-[13px] text-bk-muted">{admin.pages.sub(formatNumber(total), ppv)}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs text-bk-muted">
              <th scope="col" className="py-2 pr-2 font-semibold">{c.page}</th>
              <th scope="col" className="w-[38%] p-2 font-semibold">{c.share}</th>
              <th scope="col" className="p-2 text-right font-semibold">{c.views}</th>
              <th scope="col" className="py-2 pl-2 text-right font-semibold">{c.viewers}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.target} className="border-t border-bk-pill-neutral">
                <td className="py-2.5 pr-2">
                  <span className="flex items-center gap-2">
                    <span className={cn("whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-bold", TAG[r.tab])}>
                      {admin.pages.tabs[r.tab]}
                    </span>
                    <span className="font-semibold">{r.name}</span>
                  </span>
                </td>
                <td className="px-2 py-2.5">
                  <span className="flex items-center gap-2">
                    <span className="h-2 flex-1 overflow-hidden rounded bg-bk-pill-neutral">
                      <span className={cn("block h-2 rounded", BAR[r.tab])} style={{ width: `${((r.views / max) * 100).toFixed(1)}%` }} />
                    </span>
                    <span className="w-[34px] text-right text-xs tabular-nums text-bk-illo-label">
                      {total ? `${Math.round((r.views / total) * 100)}%` : "0%"}
                    </span>
                  </span>
                </td>
                <td className="px-2 py-2.5 text-right font-semibold tabular-nums">{formatNumber(r.views)}</td>
                <td className="py-2.5 pl-2 text-right tabular-nums text-bk-illo-label">{formatNumber(r.viewers)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
