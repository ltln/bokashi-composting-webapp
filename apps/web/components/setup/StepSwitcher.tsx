import Link from "next/link";
import { cn } from "@/lib/cn";
import { setupPageCopy } from "@/content/setupSteps";
import type { SetupStep } from "@/content/types";

/** Mobile step switcher: "1 · Đáy giả" / "2 · Nạp lớp" / "3 · Khóa khí". */
export function StepSwitcher({ steps, current }: { steps: readonly SetupStep[]; current: number }) {
  return (
    <nav aria-label={setupPageCopy.switcherLabel} className="flex gap-2 px-4 lg:hidden">
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
            {setupPageCopy.switcherItem(s)}
          </Link>
        );
      })}
    </nav>
  );
}
