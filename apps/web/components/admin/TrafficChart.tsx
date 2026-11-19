"use client";

import { useState } from "react";
import { admin } from "@/content/admin";
import { cn } from "@/lib/cn";
import { bucketLabel, current, formatNumber, niceSteps, previous } from "./query";
import type { Metric, Overview } from "./types";

const W = 1000;
const H = 260;

/** Line + area chart of one metric over the period, with the previous period dashed. */
export function TrafficChart({ data }: { data: Overview }) {
  const [metric, setMetric] = useState<Metric>("visits");
  const [hover, setHover] = useState<number | null>(null);

  const unit = admin.metrics.find((m) => m.value === metric)?.unit ?? "";
  const pts = data.series;
  const n = pts.length;
  const cur = pts.map((p) => current(p, metric));
  const prev = pts.map((p) => previous(p, metric));
  const labels = pts.map((p) => bucketLabel(p.start, data.range));
  const known = cur.filter((v): v is number => v !== null);

  const ticks = niceSteps(Math.max(0, ...known, ...prev));
  const yMax = ticks[4] ?? 1;
  const X = (i: number) => (n === 1 ? W / 2 : (i * W) / (n - 1));
  const Y = (v: number) => H - (v / yMax) * (H - 12);
  const path = (vals: (number | null)[]) =>
    vals
      .map((v, i) => (v === null ? null : `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`))
      .filter(Boolean)
      .join(" ");
  const line = path(cur);
  const lastIdx = cur.reduce<number>((last, v, i) => (v === null ? last : i), -1);
  const area = lastIdx >= 0 ? `${line} L${X(lastIdx).toFixed(1)} ${H} L0 ${H} Z` : "";
  const grid = ticks.map((t) => `M0 ${Y(t).toFixed(1)} L${W} ${Y(t).toFixed(1)}`).join(" ");
  const pct = (x: number) => `${(x / 10).toFixed(2)}%`;

  const total = known.reduce((a, b) => a + b, 0);
  const peakIdx = known.length ? cur.indexOf(Math.max(...known)) : 0;
  const aria = admin.traffic.chartAria(
    unit,
    admin.rangeShort[data.range],
    formatNumber(total),
    formatNumber(cur[peakIdx] ?? 0),
    labels[peakIdx] ?? "",
  );
  const every = Math.ceil(n / 8);
  const xLabels = labels
    .map((label, i) => ({ label, i }))
    .filter(({ i }) => (i % every === 0 || i === n - 1) && !(i !== n - 1 && n - 1 - i < every / 2));
  const slot = 100 / n;
  const tip = hover !== null && hover < n ? hover : null;

  return (
    <section aria-labelledby="admin-traffic" className="flex flex-col gap-3.5 rounded-bk-card bg-bk-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 id="admin-traffic" className="m-0 text-lg font-bold">
            {admin.traffic.title}
          </h2>
          <span className="text-[13px] text-bk-muted">{admin.traffic.sub[data.unit]}</span>
        </div>
        <div role="group" aria-label={admin.traffic.metricsLabel} className="flex flex-wrap gap-[3px] rounded-bk-sm bg-bk-admin-bg p-[3px]">
          {admin.metrics.map((m) => (
            <button
              key={m.value}
              type="button"
              aria-pressed={metric === m.value}
              onClick={() => {
                setMetric(m.value);
                setHover(null);
              }}
              className={cn(
                "min-h-9 rounded-[9px] px-3 text-[13px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bk-primary",
                metric === m.value ? "bg-bk-surface text-bk-primary-dark shadow-sm" : "bg-transparent text-bk-illo-label",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3.5 text-xs text-bk-illo-label">
        <span className="flex items-center gap-1.5">
          <svg width="18" height="4" viewBox="0 0 18 4" aria-hidden="true">
            <rect width="18" height="4" rx="2" className="fill-bk-primary" />
          </svg>
          {admin.rangeShort[data.range]}
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="18" height="4" viewBox="0 0 18 4" aria-hidden="true">
            <path d="M0 2 L18 2" strokeWidth="2" strokeDasharray="4 3" className="stroke-bk-admin-prev" />
          </svg>
          {admin.traffic.previous}
        </span>
      </div>
      <div className="flex gap-2.5">
        <div className="relative h-[260px] w-11 flex-none" aria-hidden="true">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-0 -translate-y-1/2 text-xs tabular-nums text-bk-muted"
              style={{ top: `${((Y(t) / H) * 100).toFixed(2)}%` }}
            >
              {formatNumber(t)}
            </span>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="relative h-[260px]">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              width="100%"
              height={H}
              preserveAspectRatio="none"
              role="img"
              aria-label={aria}
              className="absolute left-0 top-0"
            >
              <path d={grid} strokeWidth="1" vectorEffect="non-scaling-stroke" className="stroke-bk-admin-grid" />
              {area && <path d={area} fillOpacity="0.1" className="fill-bk-primary" />}
              <path
                d={path(prev)}
                fill="none"
                strokeWidth="2"
                strokeDasharray="5 4"
                vectorEffect="non-scaling-stroke"
                className="stroke-bk-admin-prev"
              />
              <path
                d={line}
                fill="none"
                strokeWidth="2.5"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                className="stroke-bk-primary"
              />
            </svg>
            {tip !== null && (
              <div className="absolute bottom-0 top-0 w-px bg-bk-admin-crosshair" style={{ left: pct(X(tip)) }} />
            )}
            {cur.map((v, i) =>
              v === null ? null : (
                <div
                  key={i}
                  className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bk-primary bg-bk-surface"
                  style={{ left: pct(X(i)), top: `${((Y(v) / H) * 100).toFixed(2)}%` }}
                />
              ),
            )}
            {pts.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${labels[i]}: ${cur[i] === null ? "–" : formatNumber(cur[i] ?? 0)} ${unit}`}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onBlur={() => setHover(null)}
                className="absolute bottom-0 top-0 cursor-default border-0 bg-transparent p-0 hover:bg-bk-primary/5 focus-visible:bg-bk-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-bk-accent"
                style={{ left: `${Math.max(0, X(i) / 10 - slot / 2).toFixed(2)}%`, width: `${slot.toFixed(2)}%` }}
              />
            ))}
            {tip !== null && (
              <div
                className="pointer-events-none absolute top-1.5 -translate-x-1/2 whitespace-nowrap rounded-[10px] bg-bk-ink px-3 py-2 text-xs leading-[18px] text-white"
                style={{ left: `${Math.min(90, Math.max(10, X(tip) / 10)).toFixed(2)}%` }}
              >
                <div className="font-bold">{labels[tip]}</div>
                <div>{cur[tip] === null ? "–" : `${formatNumber(cur[tip] ?? 0)} ${unit}`}</div>
                <div className="text-bk-admin-tip-muted">{admin.traffic.previousValue(formatNumber(prev[tip] ?? 0))}</div>
              </div>
            )}
          </div>
          <div className="relative h-[18px]" aria-hidden="true">
            {xLabels.map(({ label, i }) => (
              <span
                key={i}
                className="absolute -translate-x-1/2 whitespace-nowrap text-xs text-bk-muted"
                style={{ left: pct(X(i)) }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
