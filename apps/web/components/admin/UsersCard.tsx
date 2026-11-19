import { admin } from "@/content/admin";
import { cn } from "@/lib/cn";
import { formatNumber, peakWindow } from "./query";
import type { Overview } from "./types";

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

/** New vs returning users, device split (by visits) and the peak hours. */
export function UsersCard({ data }: { data: Overview }) {
  const u = admin.users;
  const { users, newUsers } = data.totals;
  const returning = Math.max(0, users - newUsers);
  const newW = pct(newUsers, users);

  const { mobile, desktop, tablet } = data.devices;
  const visits = mobile + desktop + tablet;
  const devices = [
    { key: "mobile", label: u.mobile, n: mobile, cls: "bg-bk-faq-liquid-fg text-white" },
    { key: "tablet", label: u.tablet, n: tablet, cls: "bg-bk-illo-bag text-bk-ink" },
    { key: "desktop", label: u.desktop, n: desktop, cls: "bg-bk-pill-neutral text-bk-ink" },
  ].filter((d) => d.n > 0);

  const peak = peakWindow(data.hours);
  const max = Math.max(1, ...data.hours);

  return (
    <section
      aria-labelledby="admin-users"
      className="flex min-w-0 flex-[1_1_340px] flex-col gap-[18px] rounded-bk-card bg-bk-surface p-5"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="admin-users" className="m-0 text-lg font-bold">
          {u.title}
        </h2>
        <span className="text-[13px] text-bk-muted">{u.count(formatNumber(users))}</span>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold">{u.newVsReturning}</span>
        {users ? (
          <div className="flex h-[30px] overflow-hidden rounded-lg text-xs font-semibold">
            {newUsers > 0 && (
              <div className="flex items-center whitespace-nowrap bg-bk-primary pl-2.5 text-white" style={{ width: `${newW}%` }}>
                {u.new(formatNumber(newUsers))}
              </div>
            )}
            {returning > 0 && (
              <div className="flex flex-1 items-center whitespace-nowrap bg-bk-admin-returning pl-2.5 text-bk-ink">
                {u.returning(formatNumber(returning))}
              </div>
            )}
          </div>
        ) : (
          <p className="m-0 text-[13px] text-bk-muted">{admin.noData}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold">{u.devices}</span>
        {visits ? (
          <div className="flex h-[30px] overflow-hidden rounded-lg text-xs font-semibold">
            {devices.map((d, i) => (
              <div
                key={d.key}
                className={cn("flex items-center whitespace-nowrap px-2.5", d.cls, i === devices.length - 1 && "flex-1")}
                style={i === devices.length - 1 ? undefined : { width: `${pct(d.n, visits)}%` }}
              >
                {`${d.label} ${pct(d.n, visits)}%`}
              </div>
            ))}
          </div>
        ) : (
          <p className="m-0 text-[13px] text-bk-muted">{admin.noData}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[13px] font-semibold">{u.peak}</span>
          {peak && <span className="text-xs text-bk-muted">{u.peakRange(peak[0], peak[1])}</span>}
        </div>
        <div
          className="flex h-[70px] items-end gap-[3px]"
          role="img"
          aria-label={peak ? u.peakAria(peak[0], peak[1]) : u.hoursAria}
        >
          {data.hours.map((v, h) => (
            <div
              key={h}
              className={cn(
                "flex-1 rounded-t-[3px]",
                peak && h >= peak[0] && h < peak[1] ? "bg-bk-primary" : "bg-bk-admin-hour-low",
              )}
              style={{ height: `${Math.max(4, (v / max) * 100).toFixed(0)}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between text-[11px] text-bk-muted" aria-hidden="true">
          {u.hourTicks.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
