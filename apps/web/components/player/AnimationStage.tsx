"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Size presets taken from the boards. Mobile: the tinted canvas has a fixed
 * height with the illustration and caption absolutely placed. Desktop
 * (≥1024 px): the whole stage becomes a padded tinted panel and the canvas
 * stacks chips → illustration → caption → controls.
 *
 * - setup: Main/Step2/Step3 (canvas 336 px, SVG box 358×260 at top 30) and DeskSetup (SVG 480 px, max 560 px).
 * - faq:   Faq1–3 (canvas 300 px, SVG box 270×236 at top 4, centred) and DeskFaq (SVG 400 px, max 480 px).
 * - faqCompare: Faq4–5 (figures filling the canvas above the caption bubble; 16:9 stage on desktop).
 */
export type AnimationStageSize = "setup" | "faq" | "faqCompare";

const SIZE: Record<AnimationStageSize, { canvas: string; illustration: string }> = {
  faqCompare: {
    canvas: "h-[300px]",
    illustration: "inset-x-3 top-3 bottom-[68px] lg:h-[380px] lg:max-w-[680px]",
  },
  setup: {
    canvas: "h-[336px]",
    // 240 px tall keeps the bin's floor + shadow clear of a two-line caption
    // bubble (which reaches up to canvas y≈274).
    illustration: "left-0 top-[30px] h-[240px] w-full lg:h-[480px] lg:max-w-[560px]",
  },
  faq: {
    canvas: "h-[300px]",
    // 270×236 keeps the 320×280 aspect and lifts the bin's floor + shadow above
    // the caption bubble (which covers the canvas from y≈250).
    illustration: "left-1/2 top-0 h-[236px] w-[270px] -translate-x-1/2 lg:h-[400px] lg:w-full lg:max-w-[480px] lg:translate-x-0",
  },
};

export interface AnimationStageProps {
  /** aria-label of the stage <section>, e.g. "Mô phỏng bước 1". */
  label: string;
  /** Caption bubble text (the active sub-step's caption). Announced politely. */
  caption: string;
  /** Pauses every animation inside the canvas (`.anim-paused` and `<video>`). */
  paused: boolean;
  /** Chip(s) at the top left, e.g. <Pill>Bước 1/3 · Tầng đáy giả</Pill>. */
  badgeStart?: ReactNode;
  /** Chip(s) at the top right, e.g. <Pill tone="primary">Lớp 3</Pill>. */
  badgeEnd?: ReactNode;
  /** Optional custom illustration node when not using `videoSrc`. */
  children?: ReactNode;
  /** Pre-rendered 1920×1080@60fps board clip under `/animations/*.mp4`. */
  videoSrc?: string;
  /** Final settled frame poster under `/animations/*-poster.png`. */
  posterSrc?: string;
  /** Accessible label for the rendered illustration wrapper (`role="img"`). */
  illustrationLabel?: string;
  /** 0-based active sub-step driving video seek targets (`active * substepSeconds`). */
  active?: number;
  /** Incremented on replay/goTo to force immediate video seek. */
  epoch?: number;
  /** When true and paused, keeps poster visible on mount and seeks to sub-step end on manual select. */
  reducedMotion?: boolean;
  /** Sub-step length in seconds (default 4.5 matching SUBSTEP_MS = 4500). */
  substepSeconds?: number;
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
 * The rounded `bk-surface-tint` animation stage: chip slots, a pre-rendered
 * Remotion video (or fallback illustration slot), a caption bubble and an
 * optional controls slot. Pair with `useAnimationPlayer` in a client component.
 */
export function AnimationStage({
  label,
  caption,
  paused,
  badgeStart,
  badgeEnd,
  children,
  videoSrc,
  posterSrc,
  illustrationLabel,
  active = 0,
  epoch = 0,
  reducedMotion = false,
  substepSeconds = 4.5,
  controls,
  size = "setup",
  className,
}: AnimationStageProps) {
  const preset = SIZE[size];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const prevEpochRef = useRef(epoch);

  // Sync play/pause state with player controls and prefers-reduced-motion.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;
    if (paused) {
      try {
        video.pause();
      } catch {
        // jsdom does not implement HTMLMediaElement.pause
      }
      return;
    }
    try {
      const p = video.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {});
      }
    } catch {
      // jsdom does not implement HTMLMediaElement.play
    }
  }, [paused, videoSrc]);

  // Sync active sub-step and manual replay/goTo jumps (`epoch`) with video timeline.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;
    const epochChanged = prevEpochRef.current !== epoch;
    prevEpochRef.current = epoch;

    if (reducedMotion && paused) {
      if (!epochChanged) return;
      const settledTime = Math.max(0, (active + 1) * substepSeconds - 0.08);
      try {
        video.currentTime = settledTime;
      } catch {
        // Ignore unseekable media state in headless test DOMs
      }
      return;
    }

    const targetTime = active * substepSeconds;
    if (epochChanged || Math.abs((video.currentTime || 0) - targetTime) > 0.35) {
      try {
        video.currentTime = targetTime;
      } catch {
        // Ignore unseekable media state in headless test DOMs
      }
    }
  }, [active, epoch, paused, reducedMotion, substepSeconds, videoSrc]);

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
        <div className={cn("absolute lg:static lg:mx-auto lg:w-full", preset.illustration)}>
          {videoSrc ? (
            <div
              role="img"
              aria-label={illustrationLabel ?? label}
              className="relative h-full w-full overflow-hidden rounded-2xl"
            >
              <video
                ref={videoRef}
                src={videoSrc}
                poster={posterSrc}
                muted
                playsInline
                preload="auto"
                aria-hidden="true"
                className={cn(
                  "block h-full w-full object-center",
                  size === "faqCompare" ? "object-contain" : "object-cover",
                )}
              />
            </div>
          ) : (
            children
          )}
        </div>
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
