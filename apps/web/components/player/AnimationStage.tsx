import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Size presets taken from the boards. Mobile: the tinted canvas has a fixed
 * height with the illustration and caption absolutely placed. Desktop
 * (≥1024 px): the whole stage becomes a padded tinted panel and the canvas
 * stacks chips → illustration → caption → controls.
 *
 * - setup: Main/Step2/Step3 (canvas 336 px, SVG box 358×260 at top 30) and DeskSetup (SVG 480 px, max 560 px).
 * - faq:   Faq1–5 (canvas 300 px, SVG box 300×262 at top 4, centred) and DeskFaq (SVG 400 px, max 480 px).
 */
export type AnimationStageSize = "setup" | "faq";

const SIZE: Record<AnimationStageSize, { canvas: string; illustration: string }> = {
  setup: {
    canvas: "h-[336px]",
    illustration: "left-0 top-[30px] h-[260px] w-full lg:h-[480px] lg:max-w-[560px]",
  },
  faq: {
    canvas: "h-[300px]",
    illustration: "left-1/2 top-1 h-[262px] w-[300px] -translate-x-1/2 lg:h-[400px] lg:w-full lg:max-w-[480px] lg:translate-x-0",
  },
};

export interface AnimationStageProps {
  /** aria-label of the stage <section>, e.g. "Mô phỏng bước 1". */
  label: string;
  /** Caption bubble text (the active sub-step's caption). Announced politely. */
  caption: string;
  /** Pauses every CSS animation inside the canvas (`.anim-paused`). */
  paused: boolean;
  /** Chip(s) at the top left, e.g. <Pill>Bước 1/3 · Tầng đáy giả</Pill>. */
  badgeStart?: ReactNode;
  /** Chip(s) at the top right, e.g. <Pill tone="primary">Lớp 3</Pill>. */
  badgeEnd?: ReactNode;
  /**
   * The illustration: an <svg> that fills its box (BinBase does). It is placed
   * by the `size` preset.
   */
  children: ReactNode;
  /**
   * Usually <PlayerControls>. Rendered under the canvas on mobile and inside
   * the tinted panel on desktop, as in the boards.
   */
  controls?: ReactNode;
  /** Layout preset. Default "setup". */
  size?: AnimationStageSize;
  className?: string;
}

/**
 * The rounded `bk-surface-tint` animation stage: chip slots, an illustration
 * slot, a caption bubble and an optional controls slot. Server-safe (no
 * state); pair it with `useAnimationPlayer` in a client component.
 */
export function AnimationStage({
  label,
  caption,
  paused,
  badgeStart,
  badgeEnd,
  children,
  controls,
  size = "setup",
  className,
}: AnimationStageProps) {
  const preset = SIZE[size];
  return (
    <section
      aria-label={label}
      className={cn(
        "flex min-w-0 flex-col",
        "lg:gap-3.5 lg:rounded-[28px] lg:bg-bk-surface-tint lg:p-5",
        className,
      )}
    >
      <div
        data-paused={paused || undefined}
        className={cn(
          "relative mx-4 overflow-hidden rounded-bk-stage bg-bk-surface-tint",
          preset.canvas,
          "lg:mx-0 lg:flex lg:h-auto lg:flex-col lg:gap-3.5 lg:overflow-visible lg:rounded-none lg:bg-transparent",
          paused && "anim-paused",
        )}
      >
        {(badgeStart || badgeEnd) && (
          <div className="absolute left-3 right-3 top-3 z-10 flex items-center justify-between gap-1.5 lg:static lg:flex-wrap">
            <div className="flex items-center gap-1.5">{badgeStart}</div>
            <div className="flex items-center gap-2">{badgeEnd}</div>
          </div>
        )}
        <div className={cn("absolute lg:static lg:mx-auto lg:w-full", preset.illustration)}>{children}</div>
        <p
          aria-live="polite"
          className={cn(
            "absolute bottom-3 left-3 right-3 m-0 rounded-bk-md bg-bk-surface px-3 py-2.5 text-[13px] font-medium leading-[18px]",
            "lg:static lg:rounded-2xl lg:px-4 lg:py-3.5 lg:text-base lg:leading-[22px]",
          )}
        >
          {caption}
        </p>
      </div>
      {controls}
    </section>
  );
}
