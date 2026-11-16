import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { FaqOption } from "@/content/types";
import type { StepIllustrationProps } from "../setup/types";

/** Props of the compare-style FAQ illustrations (FAQ 4 and 5). */
export interface CompareIllustrationProps extends StepIllustrationProps {
  /** The states; `options[active]` is emphasised on mobile. */
  options: readonly FaqOption[];
}

/**
 * Row of white figure cards used by FAQ 4 and 5: caption, the SVG, and a tag
 * under it. Fills the stage's illustration slot (see AnimationStage size
 * "faqCompare"). The active card gets a ring and a slight scale on mobile;
 * on desktop all are shown at full size (DeskFaq).
 */
export function CompareRow({ label, paused, children }: { label: string; paused?: boolean; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className={cn("flex h-full gap-2.5 lg:h-auto lg:flex-wrap lg:gap-3.5", paused && "anim-paused")}>
      {children}
    </div>
  );
}

/** The figure's drawing: fills the card on mobile, capped at 300×280 on desktop. */
const FIGURE_SLOT =
  "flex min-h-0 w-full flex-1 items-center justify-center " +
  "[&>svg]:h-auto [&>svg]:w-full " +
  "lg:[&>svg]:h-[280px] lg:[&>svg]:w-full lg:[&>svg]:max-w-[300px]";

export function CompareFigure({
  caption,
  active,
  tag,
  children,
}: {
  caption: string;
  active: boolean;
  tag: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure
      data-active={active || undefined}
      className={cn(
        "m-0 flex min-h-0 min-w-0 flex-1 flex-col items-center gap-1.5 rounded-2xl bg-bk-surface p-2.5",
        "origin-center transition-transform duration-300",
        active ? "scale-[1.02] ring-2 ring-bk-primary" : "scale-100",
        "lg:flex-[1_1_240px] lg:gap-2 lg:rounded-[18px] lg:p-3.5 lg:ring-0 lg:scale-100",
      )}
    >
      <figcaption className="self-start text-[13px] font-bold lg:text-[15px]">{caption}</figcaption>
      <div className={FIGURE_SLOT}>{children}</div>
      {tag}
    </figure>
  );
}
