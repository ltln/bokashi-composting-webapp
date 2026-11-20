"use client";

import Link from "next/link";
import { getFaq, getFaqPageCopy } from "@/content/faqs";
import type { Faq } from "@/content/types";
import { cn } from "@/lib/cn";
import { useLocale } from "@/lib/i18n";
import { BulbIcon, ChevronRight, FaqIcon } from "./icons";
import { FAQ_TINT } from "./tints";

const FOCUS =
  "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-bk-accent";

/**
 * Mobile /faq (FaqList board): intro, five tinted cards that link to the
 * details, and the dark "Dấu hiệu mẻ ủ đạt chuẩn" tip. Hidden at ≥1024 px,
 * where the rail in the layout takes over.
 */
export function FaqListView({ faqs }: { faqs: readonly Faq[] }) {
  const { locale } = useLocale();
  const c = getFaqPageCopy(locale).list;
  const localizedFaqs = faqs.map((f) => getFaq(f.slug, locale));

  return (
    <div className="pb-4 lg:hidden">
      <div className="flex flex-col gap-1 px-4 pt-1">
        <h1 className="m-0 text-2xl font-bold leading-[30px]">{c.title}</h1>
        <p className="m-0 text-sm leading-5 text-bk-muted">{c.intro}</p>
      </div>
      <ul aria-label={c.label} className="m-0 mt-4 flex list-none flex-col gap-2.5 px-4">
        {localizedFaqs.map((f) => {
          const tint = FAQ_TINT[f.slug];
          return (
            <li key={f.slug}>
              <Link
                href={`/faq/${f.slug}`}
                className={cn(
                  "flex items-center gap-3 rounded-bk-lg bg-bk-surface p-3 text-bk-ink no-underline hover:text-bk-ink",
                  FOCUS,
                )}
              >
                <span className={cn("flex size-12 flex-none items-center justify-center rounded-bk-md", tint.bg, tint.fg)}>
                  <FaqIcon slug={f.slug} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <span className={cn("text-xs font-semibold", tint.fg)}>
                    {c.cardTag(f)}
                  </span>
                  <span className="text-[15px] font-semibold leading-5">{f.listTitle}</span>
                </span>
                <ChevronRight size={20} className="flex-none text-bk-muted" />
              </Link>
            </li>
          );
        })}
      </ul>
      <aside className="mx-4 mt-3.5 flex items-start gap-3 rounded-bk-lg bg-bk-primary-dark p-3.5 text-white">
        <BulbIcon className="flex-none text-bk-leaf" />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold">{c.tipTitle}</span>
          <span className="text-[13px] leading-[18px] text-bk-nav-active">{c.tipText}</span>
        </div>
      </aside>
    </div>
  );
}

/** Desktop empty state shown at /faq before any FAQ item is chosen. */
export function FaqEmptyDetail() {
  const { locale } = useLocale();
  const c = getFaqPageCopy(locale).list;
  return (
    <p className="m-0 hidden rounded-[28px] bg-bk-surface-tint p-8 text-base text-bk-illo-label lg:block">
      {c.emptyDetail}
    </p>
  );
}
