"use client";

import { IconButton, SegmentProgress } from "@/components/ui";
import { cn } from "@/lib/cn";

/** Vietnamese/English labels for the controls; pass `getPlayerCopy(locale)` from content/setupSteps. */
export interface PlayerLabels {
  pause: string;
  play: string;
  replay: string;
  /** aria-label of the progress bar / segment group. */
  progress: string;
  /** aria-label of the voiceover mute/unmute button. */
  mute?: string;
  unmute?: string;
  /** aria-label of segment button `i` (1-based) when segments are interactive. */
  segment: (i: number, total: number, caption: string) => string;
}

export interface PlayerControlsProps {
  /** Number of sub-steps (segments). */
  total: number;
  /** 0-based active sub-step. */
  active: number;
  /** Fill of the active segment, 0–1 (use `player.displayProgress`). */
  progress: number;
  /** Shows the pause icon when true, play otherwise. */
  playing: boolean;
  onTogglePlay: () => void;
  onReplay: () => void;
  labels: PlayerLabels;
  /** Voiceover mute toggle; omit when the active clip has no audio track. */
  muted?: boolean;
  onToggleMute?: () => void;
  /**
   * When set, the segments render as buttons that jump to a sub-step
   * (reduced motion). Otherwise they are a passive progress bar.
   */
  onSelect?: (index: number) => void;
  /** Sub-step captions, used in the segment buttons' aria-labels. */
  captions?: readonly string[];
  className?: string;
}

/** Shared speaker mute/unmute button (44 px on mobile, 48 px on desktop). */
export function VoiceMuteButton({
  muted,
  onToggle,
  muteLabel,
  unmuteLabel,
}: {
  muted: boolean;
  onToggle: () => void;
  muteLabel: string;
  unmuteLabel: string;
}) {
  return (
    <IconButton
      variant="outline"
      aria-pressed={!muted}
      aria-label={muted ? unmuteLabel : muteLabel}
      onClick={onToggle}
      className="lg:size-12 lg:border-bk-input-border"
    >
      {muted ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )}
    </IconButton>
  );
}

/**
 * Pause/play, segmented progress, an `n/N` counter, optional voice mute, and replay,
 * as in the boards (44 px buttons on mobile, 48 px on desktop).
 */
export function PlayerControls({
  total,
  active,
  progress,
  playing,
  onTogglePlay,
  onReplay,
  labels,
  muted = true,
  onToggleMute,
  onSelect,
  captions,
  className,
}: PlayerControlsProps) {
  return (
    <div className={cn("flex h-[60px] items-center gap-3 px-4 py-2 lg:h-auto lg:gap-3.5 lg:p-0", className)}>
      <IconButton
        variant="primary"
        aria-label={playing ? labels.pause : labels.play}
        onClick={onTogglePlay}
        className="lg:size-12"
      >
        {playing ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5.5v13a1 1 0 0 0 1.5.9l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5z" />
          </svg>
        )}
      </IconButton>

      {onSelect ? (
        <div role="group" aria-label={labels.progress} className="flex flex-1 items-center gap-1 lg:gap-1.5">
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              aria-current={i === active ? "step" : undefined}
              aria-label={labels.segment(i + 1, total, captions?.[i] ?? "")}
              className="group flex h-touch flex-1 items-center rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-bk-primary"
            >
              <span
                className={cn(
                  "block h-1.5 w-full overflow-hidden rounded-[3px] lg:h-2 lg:rounded",
                  i < active ? "bg-bk-primary" : "bg-bk-border",
                )}
              >
                {i === active && (
                  <span
                    className="block h-full w-full origin-left bg-bk-accent"
                    style={{ transform: `scaleX(${Math.min(1, Math.max(0, progress))})` }}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <SegmentProgress
          total={total}
          current={active}
          progress={progress}
          aria-label={labels.progress}
          className="lg:gap-1.5 lg:[&>div]:h-2 lg:[&>div]:rounded"
        />
      )}

      <span className="text-xs tabular-nums text-bk-muted lg:text-[13px] lg:text-bk-illo-label">
        {Math.min(total, active + 1)}/{total}
      </span>

      {onToggleMute && labels.mute && labels.unmute && (
        <VoiceMuteButton
          muted={muted}
          onToggle={onToggleMute}
          muteLabel={labels.mute}
          unmuteLabel={labels.unmute}
        />
      )}

      <IconButton
        variant="outline"
        aria-label={labels.replay}
        onClick={onReplay}
        className="lg:size-12 lg:border-bk-input-border"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </IconButton>
    </div>
  );
}
