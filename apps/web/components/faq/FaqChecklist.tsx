"use client";

import Link from "next/link";
import { Card, NumberBadge } from "@/components/ui";
import { getFaqPageCopy } from "@/content/faqs";
import type { Faq, FaqOption } from "@/content/types";
import { cn } from "@/lib/cn";
import { useLocale } from "@/lib/i18n";
import { CheckIcon, ChevronLeft, ChevronRight, CrossIcon } from "./icons";

const LINK =
  "flex min-h-touch items-center gap-1 text-sm font-semibold no-underline focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-bk-accent";

function Marker({ marker }: { marker: FaqOption["marker"] }) {
  const base = "flex size-6 flex-none items-center justify-center rounded-full text-xs font-bold text-white";
  if (marker === "check") return <span aria-hidden="true" className={cn(base, "bg-bk-faq-liquid-fg")}><CheckIcon /></span>;
  if (marker === "cross") return <span aria-hidden="true" className={cn(base, "bg-bk-accent-dark")}><CrossIcon /></span>;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-6 flex-none items-center justify-center rounded-full text-xs font-bold",
        marker === "a" ? "bg-bk-faq-disposal-bg text-bk-faq-disposal-fg" : "bg-bk-pill-neutral text-bk-illo-label",
      )}
    >
      {marker}
    </span>
  );
}

/**
 * The white card under the controls. Ordered FAQs (1–3): "Cách xử lý" with
 * rows that follow the active sub-step. Compare FAQs (4, 5): note rows with a
 * check/cross or a/b marker. Both end with the previous/next links.
 */
export function FaqChecklist({
  faq,
  active,
  prev,
  next,
}: {
  faq: Faq;
  active: number;
  prev: Faq | null;
  next: Faq | null;
}) {
  const { locale } = useLocale();
  const d = getFaqPageCopy(locale).detail;
  return (
    <Card as="article" className="mx-4 flex flex-col gap-2 py-3.5 lg:mx-0 lg:gap-2.5 lg:rounded-[20px] lg:px-5 lg:py-[18px]">
      {faq.options ? (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {faq.options.map((o, i) => (
            <li key={faq.substeps[i]?.id ?? i} className="flex items-start gap-2.5">
              <Marker marker={o.marker} />
              <p className="m-0 text-sm leading-5 lg:text-[15px] lg:leading-[21px]">
                {o.note.before}
                <b>{o.note.bold}</b>
                {o.note.after}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <h2 className="m-0 text-[15px] font-bold lg:text-base">{d.handling}</h2>
          <ol className="m-0 flex list-none flex-col gap-1.5 p-0 lg:gap-2">
            {faq.substeps.map((s, i) => {
              const state = i < active ? "done" : i === active ? "current" : "upcoming";
              return (
                <li
                  key={s.id}
                  aria-current={state === "current" ? "step" : undefined}
                  className={cn(
                    "flex items-start gap-2.5 text-sm leading-5 lg:text-[15px] lg:leading-[21px]",
                    state === "done" && "text-bk-muted",
                    state === "current" && "-mx-2 rounded-bk-sm bg-bk-accent-tint px-2 py-1.5 font-semibold",
                  )}
                >
                  <NumberBadge number={i + 1} state={state} />
                  {s.checklist}
                </li>
              );
            })}
          </ol>
        </>
      )}
      <nav aria-label={d.navLabel} className="flex justify-between gap-2.5 lg:mt-1">
        {prev ? (
          <Link href={`/faq/${prev.slug}`} className={LINK}>
            <ChevronLeft />
            {d.prev}
          </Link>
        ) : (
          <span aria-disabled="true" className={cn(LINK, "hidden cursor-not-allowed text-bk-primary opacity-45 lg:flex")}>
            <ChevronLeft />
            {d.prev}
          </span>
        )}
        <Link href={next ? `/faq/${next.slug}` : "/faq"} className={cn(LINK, "ml-auto")}>
          {next ? d.next : d.toList}
          <ChevronRight />
        </Link>
      </nav>
    </Card>
  );
}
