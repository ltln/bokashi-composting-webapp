import { admin } from "@/content/admin";
import { formatNumber } from "./query";
import type { Overview } from "./types";

const ORDER = ["users", "step1", "allSteps", "faqTab", "faqDetail"] as const;

/** "Hành trình người dùng": share of logged-in users reaching each step. */
export function Funnel({ data }: { data: Overview }) {
  const f = admin.funnel;
  const base = data.funnel.users;
  const pcts = ORDER.map((k) => (base ? Math.round((data.funnel[k] / base) * 100) : 0));
  return (
    <section aria-labelledby="admin-funnel" className="flex flex-col gap-3.5 rounded-bk-card bg-bk-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="admin-funnel" className="m-0 text-lg font-bold">
          {f.title}
        </h2>
        <span className="text-[13px] text-bk-muted">{f.sub}</span>
      </div>
      <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3 p-0">
        {ORDER.map((k, i) => {
          const p = pcts[i] ?? 0;
          const drop = i === 0 ? 0 : (pcts[i - 1] ?? 0) - p;
          return (
            <li key={k} className="flex flex-col gap-2">
              <div className="flex h-[110px] items-end overflow-hidden rounded-bk-sm bg-bk-admin-bg" aria-hidden="true">
                <div className="w-full rounded-t-bk-sm bg-bk-primary" style={{ height: `${p}%` }} />
              </div>
              <div className="flex items-baseline justify-between gap-1.5">
                <span className="text-[22px] font-bold tabular-nums">{`${p}%`}</span>
                {drop > 0 && <span className="text-xs font-semibold text-bk-accent-dark">{`−${drop}%`}</span>}
              </div>
              <span className="text-[13px] font-semibold leading-[18px]">{f.steps[k]}</span>
              <span className="text-xs text-bk-muted">{f.count(formatNumber(data.funnel[k]))}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
