"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { admin } from "@/content/admin";
import { formatNumber, tabOf } from "./query";

/** One bar: a screen and its views. */
export interface ChartRow {
  target: string;
  label: string;
  count: number;
}

const ROW = 32;
const BAR = 22;
const GAP = 12;
const COUNT_W = 48;

/** Measures an element's width (falls back to `initial` where ResizeObserver is missing, e.g. jsdom). */
function useWidth(initial: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => setWidth(Math.max(240, Math.floor(el.clientWidth)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * Horizontal bar chart drawn as plain SVG at its real pixel width (so text
 * stays 12-13 px on phones). Tab 1 bars are primary green, Tab 2 bars blue.
 * The forwarded ref is the <svg>; the dashboard renders it off screen as the
 * source of the "Trang được xem" PNG export.
 */
export const FeatureChart = forwardRef<SVGSVGElement, { data: ChartRow[] }>(function FeatureChart({ data }, svgRef) {
  const [boxRef, width] = useWidth(640);
  const max = Math.max(1, ...data.map((d) => d.count));
  const labelW = Math.min(190, Math.round(width * 0.4));
  const barX = labelW + GAP;
  const barW = Math.max(40, width - barX - COUNT_W - GAP);
  const height = Math.max(ROW, data.length * ROW);

  return (
    <div ref={boxRef} className="w-full min-w-0">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={admin.export.chartLabel}
        className="block max-w-full text-bk-ink"
      >
        {data.map((d, i) => {
          const y = i * ROW;
          const fill = tabOf(d.target) === "setup" ? "fill-bk-primary" : "fill-bk-faq-liquid-fg";
          const w = Math.max(d.count > 0 ? 4 : 0, Math.round((d.count / max) * barW));
          return (
            <g key={d.target} data-target={d.target}>
              <text
                x={0}
                y={y + ROW / 2}
                dominantBaseline="central"
                className="fill-bk-ink text-[12px]"
              >
                {d.label}
              </text>
              <rect x={barX} y={y + (ROW - BAR) / 2} width={barW} height={BAR} rx={6} className="fill-bk-surface-tint" />
              <rect x={barX} y={y + (ROW - BAR) / 2} width={w} height={BAR} rx={6} className={cn(fill)} />
              <text
                x={width}
                y={y + ROW / 2}
                textAnchor="end"
                dominantBaseline="central"
                className="fill-bk-ink text-[13px] font-semibold"
              >
                {formatNumber(d.count)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
});
