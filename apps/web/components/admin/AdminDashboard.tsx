"use client";

import { useRef, useState } from "react";
import { LogoMark } from "@/components/shell/icons";
import { admin } from "@/content/admin";
import { site } from "@/content/site";
import { ExportMenu } from "./ExportMenu";
import { exportChartPng } from "./exportPng";
import { FeatureChart } from "./FeatureChart";
import { Funnel } from "./Funnel";
import { KpiCards, pagesPerVisit } from "./KpiCards";
import { pageRows, PagesTable } from "./PagesTable";
import { chartFileName, DEFAULT_FILTERS, exportHref, formatNumber, rangeText } from "./query";
import { Segmented } from "./Segmented";
import { TrafficChart } from "./TrafficChart";
import type { Device, Filters, OverviewRange } from "./types";
import { useOverview } from "./useAdminData";
import { UsersCard } from "./UsersCard";

/** The /admin overview ("Tổng quan truy cập"). One request, polled every 15 s. */
export function AdminDashboard() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [pngError, setPngError] = useState(false);
  const chartRef = useRef<SVGSVGElement>(null);
  const { data, error } = useOverview(filters);

  const rows = data ? pageRows(data) : [];
  const downloadPng = async () => {
    if (!chartRef.current || !data) return;
    setPngError(false);
    try {
      await exportChartPng(chartRef.current, {
        title: admin.export.pngTitle,
        subtitle: rangeText(data),
        fileName: chartFileName(data.range),
      });
    } catch {
      setPngError(true);
    }
  };

  return (
    <div className="min-h-dvh bg-bk-admin-bg">
      <header className="border-b border-bk-divider bg-bk-surface">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-3 px-4 py-2.5 md:px-6">
          <LogoMark className="size-8 flex-none" />
          <span className="text-base font-bold">{site.name}</span>
          <span className="rounded-full bg-bk-pill-neutral px-2.5 py-1 text-xs font-semibold text-bk-illo-label">
            {admin.brandSuffix}
          </span>
          <span className="flex-1" />
          <span
            role="status"
            className="flex items-center gap-2 rounded-full bg-bk-nav-active px-3 py-1.5 text-[13px] font-semibold text-bk-primary-dark"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
              <circle cx="4" cy="4" r="4" className="fill-bk-illo-can-green motion-safe:animate-pulse" />
            </svg>
            {admin.online(data ? formatNumber(data.online) : "–")}
          </span>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1240px] flex-col gap-5 px-4 pb-12 pt-6 md:px-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-[999_1_360px] flex-col gap-1.5">
            <h1 className="m-0 text-[28px] font-bold leading-9">{admin.heading}</h1>
            <p className="m-0 text-sm leading-5 text-bk-muted">{admin.subheading(data ? rangeText(data) : "…")}</p>
          </div>
          <div className="flex flex-auto flex-wrap justify-end gap-2">
            <Segmented<OverviewRange>
              label={admin.rangeLabel}
              options={admin.ranges}
              value={filters.range}
              onChange={(range) => setFilters((f) => ({ ...f, range }))}
            />
            <Segmented<Device>
              label={admin.deviceLabel}
              options={admin.devices}
              value={filters.device}
              onChange={(device) => setFilters((f) => ({ ...f, device }))}
            />
            <ExportMenu csvHref={exportHref(filters)} onPng={downloadPng} pngDisabled={!data} />
          </div>
        </div>
        {pngError && (
          <p role="alert" className="m-0 text-[13px] text-bk-accent-dark">
            {admin.export.pngFailed}
          </p>
        )}
        {Boolean(error) && (
          <p role="alert" className="m-0 rounded-bk-sm bg-bk-accent-tint px-4 py-3 text-[13px] text-bk-accent-dark">
            {admin.loadFailed}
          </p>
        )}

        <KpiCards data={data} />

        {data && (
          <>
            <TrafficChart data={data} />
            <div className="flex flex-wrap items-stretch gap-4">
              <PagesTable data={data} ppv={pagesPerVisit(data)} />
              <UsersCard data={data} />
            </div>
            <Funnel data={data} />
          </>
        )}

        <section
          aria-label={admin.definitions.label}
          className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-x-6 gap-y-3.5 rounded-bk-card bg-bk-surface-tint px-5 py-[18px] text-[13px] leading-[19px]"
        >
          {admin.definitions.items.map(([title, body]) => (
            <div key={title}>
              <b>{title}</b>
              <br />
              {body}
            </div>
          ))}
        </section>
      </main>

      {/* Off-screen source of the PNG export (the table above is HTML, the PNG needs an SVG). */}
      <div aria-hidden="true" className="pointer-events-none fixed -left-[10000px] top-0 w-[640px] bg-bk-surface text-bk-ink">
        <FeatureChart ref={chartRef} data={rows.map((r) => ({ target: r.target, label: r.name, count: r.views }))} />
      </div>
    </div>
  );
}
