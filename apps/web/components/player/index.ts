/**
 * Reusable animation player (Tab 1 setup steps, Tab 2 FAQs).
 *
 *   const player = useAnimationPlayer(substeps.map((s) => s.durationMs));
 *   <AnimationStage label=… caption={substeps[player.active].caption} paused={!player.playing}
 *     badgeStart={<Pill>…</Pill>}
 *     controls={<PlayerControls total=… active={player.active} progress={player.displayProgress}
 *       playing={player.playing} onTogglePlay={player.toggle} onReplay={player.replay}
 *       onSelect={player.reducedMotion ? player.goTo : undefined} labels={playerCopy} />}>
 *     <Illustration key={player.epoch} active={player.active} paused={!player.playing} />
 *   </AnimationStage>
 */
export { AnimationStage, type AnimationStageProps, type AnimationStageSize } from "./AnimationStage";
export { PlayerControls, type PlayerControlsProps, type PlayerLabels } from "./PlayerControls";
export { useAnimationPlayer, type AnimationPlayer } from "./useAnimationPlayer";
export { usePrefersReducedMotion } from "./usePrefersReducedMotion";
export { useSubstepTimeline, type SubstepTimeline, type SubstepTimelineOptions } from "./useSubstepTimeline";
