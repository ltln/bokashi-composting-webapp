"use client";

import Link from "next/link";
import { getSetupPageCopy } from "@/content/setupSteps";
import type { SetupStep } from "@/content/types";
import { cn } from "@/lib/cn";
import { useLocale } from "@/lib/i18n";
import { LockIcon } from "./SetupChecklist";

const chevron = (d: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const BTN =
  "flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-[14px] text-sm font-semibold no-underline focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-bk-accent";

/**
 * Desktop (≥1024 px) right column from the DeskSetup board: title, material
 * chips, the step list (active step expands its sub-step dots), prev/next and
 * the "3 ngày cuối" tip.
 */
export function DeskStepList({ steps, step, active }: { steps: readonly SetupStep[]; step: SetupStep; active: number }) {
  const { locale } = useLocale();
  const d = getSetupPageCopy(locale).desk;
  const isFirst = step.number === 1;
  const isLast = step.number === steps.length;
  return (
    <aside className="hidden min-w-0 flex-[1_1_360px] flex-col gap-4 lg:flex">
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 text-[26px] font-bold leading-8">{d.title}</h1>
        <p className="m-0 text-sm leading-5 text-bk-muted">{d.intro}</p>
      </div>
      <ul aria-label={d.materialsLabel} className="m-0 flex list-none flex-wrap gap-1.5 p-0">
        {d.materials.map((m) => (
          <li key={m} className="rounded-full border border-bk-border bg-bk-surface px-2.5 py-[5px] text-xs font-semibold">
            {m}
          </li>
        ))}
      </ul>
      <ol aria-label={d.stepListLabel} className="m-0 flex list-none flex-col gap-2.5 p-0">
        {steps.map((s) => {
          const isActive = s.number === step.number;
          return (
            <li key={s.number} className={cn("box-border rounded-[18px] bg-bk-surface", isActive ? "border-2 border-bk-primary" : "border border-bk-border")}>
              <Link
                href={`/setup/${s.number}`}
                aria-current={isActive ? "step" : undefined}
                className="flex min-h-16 items-center gap-3 px-3.5 py-3 text-left text-bk-ink no-underline hover:text-bk-ink focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-bk-accent"
              >
                <span
                  className={cn(
                    "box-border flex size-8 flex-none items-center justify-center rounded-full text-sm font-bold",
                    isActive ? "bg-bk-primary text-white" : "border-[1.5px] border-bk-brown text-bk-brown-dark",
                  )}
                >
                  {s.number}
                </span>
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[15px] font-bold">{s.title}</span>
                  <span className="text-xs text-bk-muted">{s.summary ?? s.badge}</span>
                </span>
                <span className="text-bk-muted">{chevron("M9 6l6 6-6 6")}</span>
              </Link>
              {isActive && (
                <ul className="m-0 flex list-none flex-col gap-2 p-0 pb-3.5 pl-[58px] pr-3.5">
                  {s.substeps.map((a, i) => (
                    <li
                      key={a.id}
                      aria-current={i === active ? "step" : undefined}
                      className={cn("flex items-start gap-2 text-sm leading-5", i === active ? "font-semibold" : i < active ? "text-bk-muted" : "")}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "mt-1.5 size-2 flex-none rounded-full",
                          i < active ? "bg-bk-primary" : i === active ? "bg-bk-accent" : "box-border border-[1.5px] border-bk-brown",
                        )}
                      />
                      {a.checklist}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
      <div className="flex gap-2.5">
        {isFirst ? (
          <span aria-disabled="true" className={cn(BTN, "cursor-not-allowed border border-bk-input-border bg-bk-surface text-bk-ink opacity-45")}>
            {chevron("M15 6l-6 6 6 6")}
            {d.prev}
          </span>
        ) : (
          <Link href={`/setup/${step.number - 1}`} className={cn(BTN, "border border-bk-input-border bg-bk-surface text-bk-ink hover:text-bk-ink")}>
            {chevron("M15 6l-6 6 6 6")}
            {d.prev}
          </Link>
        )}
        {isLast ? (
          <Link href="/faq" className={cn(BTN, "bg-bk-primary text-white hover:text-white")}>
            {d.toFaq}
            {chevron("M9 6l6 6-6 6")}
          </Link>
        ) : (
          <Link href={`/setup/${step.number + 1}`} className={cn(BTN, "bg-bk-primary text-white hover:text-white")}>
            {d.next}
            {chevron("M9 6l6 6-6 6")}
          </Link>
        )}
      </div>
      <div className="flex items-start gap-2.5 rounded-2xl bg-bk-primary-dark px-3.5 py-3 text-white">
        <LockIcon className="mt-0.5 flex-none text-bk-leaf" />
        <span className="text-[13px] leading-[19px]">
          {d.tipLead}
          <b>{d.tipStrong}</b>
          {d.tipTail}
        </span>
      </div>
    </aside>
  );
}
