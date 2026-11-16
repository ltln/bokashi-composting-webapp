"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui";
import { LogoMark } from "@/components/shell/icons";
import { admin } from "@/content/admin";
import { site } from "@/content/site";
import { DeviceSplit, EventTypeBars } from "./Breakdowns";
import { exportChartPng } from "./exportPng";
import { FeatureChart } from "./FeatureChart";
import { KpiTiles } from "./KpiTiles";
import { LogsTable } from "./LogsTable";
import { chartFileName, dateRangeLabel, DEFAULT_FILTERS, exportHref } from "./query";
import { Segmented } from "./Segmented";
import type { Device, FeatureTab, Filters, Range } from "./types";
import { useDevices, useEventTypes, useFeatures, useLogs, useSummary } from "./useAdminData";

const SEARCH_DEBOUNCE_MS = 300;

const btnBase =
  "inline-flex min-h-touch items-center gap-2 rounded-bk-sm px-4 text-sm font-semibold no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bk-primary disabled:opacity-60";

function Icon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        <rect width="10" height="10" rx="2" className={className} />
      </svg>
      {label}
    </span>
  );
}

const section = "flex min-w-0 flex-col gap-4 rounded-bk-card bg-bk-surface p-5";

/** The /admin dashboard. Everything here polls the Go API every 15 s. */
export function AdminDashboard() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [featureTab, setFeatureTab] = useState<FeatureTab>("all");
  const [searchInput, setSearchInput] = useState("");
  const [target, setTarget] = useState("");
  const [pngError, setPngError] = useState(false);
  const chartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setTarget(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const summary = useSummary(filters);
  const features = useFeatures(filters, featureTab);
  const types = useEventTypes(filters);
  const devices = useDevices(filters);
  const logs = useLogs(filters, target);

  const failed = Boolean(summary.error || features.error || types.error || devices.error);

  const downloadPng = async () => {
    if (!chartRef.current) return;
    setPngError(false);
    try {
      await exportChartPng(chartRef.current, {
        title: admin.features.pngTitle,
        subtitle: dateRangeLabel(filters.range),
        fileName: chartFileName(filters.range),
      });
    } catch {
      setPngError(true);
    }
  };

  return (
    <div className="min-h-dvh bg-bk-ground">
      <header className="border-b border-bk-divider bg-bk-surface">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-3 px-4 py-3 md:px-6">
          <LogoMark className="size-8 flex-none" />
          <span className="text-base font-bold">{site.name}</span>
          <span className="text-[13px] text-bk-muted">{admin.brandSuffix}</span>
          <span className="flex-1" />
          <span
            role="status"
            className="flex items-center gap-1.5 rounded-full bg-bk-nav-active px-3 py-1.5 text-[13px] font-semibold text-bk-primary-dark"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
              <circle cx="4" cy="4" r="4" className="fill-bk-illo-can-green motion-safe:animate-pulse" />
            </svg>
            {admin.live}
          </span>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 pb-12 pt-7 md:px-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex min-w-[260px] flex-[999_1_420px] flex-col gap-1.5">
            <h1 className="m-0 text-[28px] font-bold leading-9">{admin.heading}</h1>
            <p className="m-0 text-sm leading-5 text-bk-muted">{admin.subheading}</p>
          </div>
          <div className="flex flex-1 flex-wrap gap-2">
            <a
              href={exportHref(filters, target)}
              download
              className={`${btnBase} border border-bk-border bg-bk-surface text-bk-ink hover:text-bk-ink`}
            >
              <Icon d="M12 3v12M7 10l5 5 5-5M5 21h14" />
              {admin.exportCsv}
            </a>
            <button
              type="button"
              onClick={downloadPng}
              disabled={!features.data?.length}
              className={`${btnBase} border-0 bg-bk-primary text-white`}
            >
              <Icon d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
              {admin.exportPng}
            </button>
          </div>
        </div>
        {pngError && (
          <p role="alert" className="m-0 text-[13px] text-bk-accent-dark">
            {admin.exportPngFailed}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Segmented<Range>
            label={admin.rangeLabel}
            options={admin.ranges}
            value={filters.range}
            onChange={(range) => setFilters((f) => ({ ...f, range }))}
          />
          <Segmented<Device>
            label={admin.deviceLabel}
            options={admin.devices}
            value={filters.device}
            tone="tint"
            onChange={(device) => setFilters((f) => ({ ...f, device }))}
          />
        </div>

        {failed && (
          <p role="alert" className="m-0 rounded-bk-sm bg-bk-accent-tint px-4 py-3 text-[13px] text-bk-accent-dark">
            {admin.loadFailed}
          </p>
        )}

        <KpiTiles summary={summary.data} />

        <div className="flex flex-wrap items-stretch gap-4">
          <section className={`${section} flex-[999_1_560px]`} aria-labelledby="admin-features">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="admin-features" className="m-0 text-[17px] font-bold">
                {admin.features.title}
              </h2>
              <Segmented<FeatureTab>
                label={admin.features.tabsLabel}
                options={admin.features.tabs}
                value={featureTab}
                tone="tint"
                onChange={setFeatureTab}
              />
            </div>
            <div className="flex gap-3.5 text-xs text-bk-ink">
              <Legend className="fill-bk-primary" label={admin.features.legendSetup} />
              <Legend className="fill-bk-illo-bag" label={admin.features.legendFaq} />
            </div>
            {features.data && features.data.length === 0 ? (
              <p className="m-0 text-[13px] text-bk-muted">{admin.empty}</p>
            ) : (
              <FeatureChart ref={chartRef} data={features.data ?? []} />
            )}
          </section>

          <section className={`${section} flex-[1_1_320px]`}>
            <h2 className="m-0 text-[17px] font-bold">{admin.eventTypes.title}</h2>
            <EventTypeBars data={types.data ?? []} />
            <h2 className="m-0 mt-2 text-[17px] font-bold">{admin.devicesCard.title}</h2>
            <DeviceSplit data={devices.data ?? []} />
          </section>
        </div>

        <section className={section}>
          <LogsTable
            rows={logs.items}
            search={searchInput}
            onSearch={setSearchInput}
            hasMore={logs.hasMore}
            loadingMore={logs.loadingMore}
            failed={logs.moreError || Boolean(logs.error)}
            onLoadMore={logs.loadMore}
          />
        </section>

        <section className="flex flex-wrap gap-4">
          <Card className="flex min-w-0 flex-[1_1_420px] flex-col gap-3 p-5">
            <h2 className="m-0 text-[17px] font-bold">{admin.reference.title}</h2>
            <dl className="m-0 grid grid-cols-[minmax(0,140px)_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-[13px] leading-[19px]">
              {admin.reference.rows.map(([name, desc]) => (
                <div key={name} className="contents">
                  <dt className="font-mono font-semibold">{name}</dt>
                  <dd className="m-0 text-bk-illo-label">{desc}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2.5 rounded-bk-card bg-bk-primary-dark p-5 text-white">
            <h2 className="m-0 text-[17px] font-bold">{admin.source.title}</h2>
            <p className="m-0 text-[13px] leading-[19px] text-bk-nav-active">{admin.source.body}</p>
          </div>
        </section>
      </main>
    </div>
  );
}
