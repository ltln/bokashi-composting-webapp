"use client";

import Link from "next/link";
import { getSetupPageCopy } from "@/content/setupSteps";
import type { SetupStep } from "@/content/types";
import { cn } from "@/lib/cn";
import { useLocale } from "@/lib/i18n";

/** Mobile step switcher: "1 · Đáy giả" / "2 · Nạp lớp" / "3 · Khóa khí". */
export function StepSwitcher({ steps, current }: { steps: readonly SetupStep[]; current: number }) {
  const { locale } = useLocale();
  const pageCopy = getSetupPageCopy(locale);

  return (
    <nav aria-label={pageCopy.switcherLabel} className="flex gap-2 px-4 lg:hidden">
      {steps.map((s) => {
        const isCurrent = s.number === current;
        return (
          <Link
            key={s.number}
            href={`/setup/${s.number}`}
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "flex h-touch flex-1 items-center justify-center rounded-bk-sm text-[13px] font-semibold no-underline",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bk-primary",
              isCurrent
                ? "bg-bk-primary text-white hover:text-white"
                : "box-border border border-bk-border bg-bk-surface text-bk-ink hover:text-bk-ink",
            )}
          >
            {pageCopy.switcherItem(s)}
          </Link>
        );
      })}
    </nav>
  );
}
