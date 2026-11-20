"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { getFaq, getFaqPageCopy } from "@/content/faqs";
import type { Faq } from "@/content/types";
import { cn } from "@/lib/cn";
import { useLocale } from "@/lib/i18n";
import { BulbIcon } from "./icons";
import { FAQ_TINT } from "./tints";

/**
 * Desktop (≥1024 px) left rail from DeskFaq: title, the five FAQs as numbered
 * rows (the open one is outlined) and the "mẻ ủ đạt chuẩn" tip. Lives in the
 * faq layout so it stays put while the detail on the right changes.
 */
export function FaqRail({ faqs }: { faqs: readonly Faq[] }) {
  const { locale } = useLocale();
  const current = useSelectedLayoutSegment();
  const c = getFaqPageCopy(locale).list;
  const localizedFaqs = faqs.map((f) => getFaq(f.slug, locale));

  return (
    <aside className="hidden min-w-0 flex-[1_1_340px] flex-col gap-3.5 lg:flex">
      <div className="flex flex-col gap-1.5">
        <h2 className="m-0 text-[26px] font-bold leading-8">{c.title}</h2>
        <p className="m-0 text-sm leading-5 text-bk-muted">{c.deskIntro}</p>
      </div>
      <ul aria-label={c.label} className="m-0 flex list-none flex-col gap-2 p-0">
        {localizedFaqs.map((f) => {
          const tint = FAQ_TINT[f.slug];
          const isCurrent = f.slug === current;
          return (
            <li key={f.slug}>
              <Link
                href={`/faq/${f.slug}`}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "box-border flex min-h-[72px] w-full items-center gap-3 rounded-2xl bg-bk-surface p-3 text-left text-bk-ink no-underline hover:text-bk-ink",
                  "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-bk-accent",
                  isCurrent ? "border-2 border-bk-primary" : "border border-bk-divider",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn("flex size-11 flex-none items-center justify-center rounded-bk-sm text-[15px] font-bold", tint.bg, tint.fg)}
                >
                  {f.number}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={cn("text-xs font-semibold", tint.fg)}>{f.category}</span>
                  <span className="text-sm font-semibold leading-[19px]">{f.listTitle}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="flex items-start gap-2.5 rounded-2xl bg-bk-primary-dark px-3.5 py-3 text-white">
        <BulbIcon size={20} className="mt-px flex-none text-bk-leaf" />
        <span className="text-[13px] leading-[19px]">{c.deskTip}</span>
      </div>
    </aside>
  );
}
