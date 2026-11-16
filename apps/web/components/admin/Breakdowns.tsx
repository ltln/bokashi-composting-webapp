import { admin } from "@/content/admin";
import { formatNumber } from "./KpiTiles";
import type { DeviceCount, EventTypeCount } from "./types";

/** "Theo loại sự kiện": one orange bar per event type, scaled to the largest. */
export function EventTypeBars({ data }: { data: EventTypeCount[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  if (data.length === 0) return <p className="m-0 text-[13px] text-bk-muted">{admin.empty}</p>;
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {data.map((d) => (
        <li key={d.type} className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[13px]">
            <span className="font-mono">{d.type}</span>
            <span className="font-semibold tabular-nums">{formatNumber(d.count)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded bg-bk-surface-tint">
            <div className="h-2 rounded bg-bk-accent" style={{ width: `${Math.round((d.count / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const DEVICE_STYLE: Record<string, string> = {
  mobile: "bg-bk-primary text-white",
  desktop: "bg-bk-border text-bk-ink",
  tablet: "bg-bk-brown-tint text-bk-brown-dark",
};
const DEVICE_LABEL: Record<string, string> = {
  mobile: admin.devicesCard.mobile,
  desktop: admin.devicesCard.desktop,
  tablet: admin.devicesCard.tablet,
};

/** Share of events per device type as one stacked bar plus a text legend. */
export function DeviceSplit({ data }: { data: DeviceCount[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return <p className="m-0 text-[13px] text-bk-muted">{admin.empty}</p>;
  const pct = (n: number) => Math.round((n / total) * 100);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-7 overflow-hidden rounded-lg" role="img" aria-label={data.map((d) => `${DEVICE_LABEL[d.deviceType] ?? d.deviceType} ${pct(d.count)}%`).join(", ")}>
        {data.map((d) => (
          <div
            key={d.deviceType}
            style={{ width: `${(d.count / total) * 100}%` }}
            className={`flex items-center justify-center overflow-hidden whitespace-nowrap text-xs font-semibold ${DEVICE_STYLE[d.deviceType] ?? DEVICE_STYLE.desktop}`}
          >
            {pct(d.count) >= 15 ? `${DEVICE_LABEL[d.deviceType] ?? d.deviceType} ${pct(d.count)}%` : ""}
          </div>
        ))}
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-bk-muted">
        {data.map((d) => (
          <li key={d.deviceType}>
            {DEVICE_LABEL[d.deviceType] ?? d.deviceType}: <span className="tabular-nums">{formatNumber(d.count)}</span> ({pct(d.count)}%)
          </li>
        ))}
      </ul>
    </div>
  );
}
