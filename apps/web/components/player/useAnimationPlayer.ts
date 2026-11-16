"use client";

import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { useSubstepTimeline, type SubstepTimeline, type SubstepTimelineOptions } from "./useSubstepTimeline";

export interface AnimationPlayer extends SubstepTimeline {
  /** prefers-reduced-motion is on: no autoplay, final frames, segment buttons. */
  reducedMotion: boolean;
  /**
   * Progress to show in the bar. Under reduced motion, while stopped, the
   * active segment shows as full (its final frame is on screen).
   */
  displayProgress: number;
}

/**
 * useSubstepTimeline wired to prefers-reduced-motion. This is what pages use:
 *
 * @example
 *   const player = useAnimationPlayer(substeps.map((s) => s.durationMs));
 *   <AnimationStage paused={!player.playing} caption={substeps[player.active].caption} …>
 *     <MyIllustration key={player.epoch} active={player.active} paused={!player.playing} />
 *   </AnimationStage>
 *   <PlayerControls {...playerControlsProps(player, substeps.length)} labels={playerCopy} />
 */
export function useAnimationPlayer(
  durationsMs: readonly number[],
  options: Omit<SubstepTimelineOptions, "autoplay"> = {},
): AnimationPlayer {
  const reducedMotion = usePrefersReducedMotion();
  const timeline = useSubstepTimeline(durationsMs, { ...options, autoplay: !reducedMotion });
  const displayProgress = reducedMotion && !timeline.playing ? 1 : timeline.progress;
  return { ...timeline, reducedMotion, displayProgress };
}
