"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface SubstepTimelineOptions {
  /**
   * External pause, e.g. while a dialog is open. Combined with the user's own
   * pause/play: the timeline runs only when neither is paused. Default false.
   */
  paused?: boolean;
  /**
   * Start playing on mount. Pass `false` under prefers-reduced-motion so the
   * user steps through manually. While the user hasn't touched the controls,
   * a change of this flag re-applies it (hydration flips it after mount).
   * Default true.
   */
  autoplay?: boolean;
  /** After the last sub-step, start over instead of stopping. Default false. */
  loop?: boolean;
}

export interface SubstepTimeline {
  /** 0-based index of the active sub-step. */
  active: number;
  /** Elapsed fraction of the active sub-step, 0–1. */
  progress: number;
  /** True while the clock is running (not paused by the user or `options.paused`, not ended). */
  playing: boolean;
  /** True once the last sub-step finished (only without `loop`). */
  ended: boolean;
  /**
   * Increments on every replay/goTo. Use it as a React `key` on the
   * illustration to restart one-shot CSS animations.
   */
  epoch: number;
  /** Pause the clock (the user's pause). */
  pause: () => void;
  /** Resume; after the end this replays from the first sub-step. */
  play: () => void;
  /** pause() when playing, play() otherwise. */
  toggle: () => void;
  /** Jump to sub-step 0 and play. */
  replay: () => void;
  /** Jump to sub-step `index` (clamped) with progress 0. Keeps the play/pause state. */
  goTo: (index: number) => void;
}

/** Longest frame delta we accept, so a backgrounded tab doesn't skip sub-steps on return. */
const MAX_FRAME_MS = 100;

/**
 * Drives a sequence of timed sub-steps with requestAnimationFrame.
 *
 * One clock syncs the caption, the highlighted checklist row and the progress
 * bar. CSS animations inside the stage are paused separately (AnimationStage
 * adds `.anim-paused` when `playing` is false).
 *
 * @param durationsMs one duration per sub-step, in ms. Only the values matter;
 *   a new array with the same numbers is fine. The position is not reset when
 *   the durations change: give the owning component a `key` per sequence.
 *
 * @example
 *   const t = useSubstepTimeline(step.substeps.map((s) => s.durationMs), { autoplay: !reducedMotion });
 *   <PlayerControls total={n} active={t.active} progress={t.progress} playing={t.playing} … />
 */
export function useSubstepTimeline(
  durationsMs: readonly number[],
  { paused: externalPaused = false, autoplay = true, loop = false }: SubstepTimelineOptions = {},
): SubstepTimeline {
  // Depend on the values, not the array identity.
  const durationsKey = durationsMs.join(",");
  const durations = useMemo(
    () => (durationsKey === "" ? [] : durationsKey.split(",").map(Number)),
    [durationsKey],
  );

  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  // null until the user presses pause/play/replay or a segment; until then `autoplay` decides.
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const [ended, setEnded] = useState(false);
  const [epoch, setEpoch] = useState(0);

  const activeRef = useRef(0);
  const elapsedRef = useRef(0);

  const isUserPaused = userPaused ?? !autoplay;
  const playing = !isUserPaused && !externalPaused && !ended && durations.length > 0;

  const jump = useCallback(
    (index: number) => {
      const i = Math.min(Math.max(0, Math.trunc(index)), Math.max(0, durations.length - 1));
      activeRef.current = i;
      elapsedRef.current = 0;
      setActive(i);
      setProgress(0);
      setEnded(false);
      setEpoch((e) => e + 1);
    },
    [durations],
  );

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();

    const tick = () => {
      const now = performance.now();
      const dt = Math.min(Math.max(0, now - last), MAX_FRAME_MS);
      last = now;

      const n = durations.length;
      let i = activeRef.current;
      let elapsed = elapsedRef.current + dt;
      let done = false;

      while (elapsed >= (durations[i] ?? 0)) {
        const d = durations[i] ?? 0;
        if (i < n - 1) {
          elapsed -= d;
          i += 1;
        } else if (loop) {
          elapsed -= d;
          i = 0;
          if (d <= 0) break;
        } else {
          elapsed = d;
          done = true;
          break;
        }
      }

      activeRef.current = i;
      elapsedRef.current = elapsed;
      const d = durations[i] ?? 0;
      setActive(i);
      setProgress(d > 0 ? Math.min(1, elapsed / d) : 1);
      if (done) {
        setEnded(true);
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, loop, durations]);

  const pause = useCallback(() => setUserPaused(true), []);

  const replay = useCallback(() => {
    jump(0);
    setUserPaused(false);
  }, [jump]);

  const play = useCallback(() => {
    if (ended) jump(0);
    setUserPaused(false);
  }, [ended, jump]);

  const toggle = useCallback(() => {
    if (playing) pause();
    else play();
  }, [playing, pause, play]);

  const goTo = useCallback(
    (index: number) => {
      // Lock in the current play/pause state so a later `autoplay` change doesn't override it.
      setUserPaused((p) => p ?? !autoplay);
      jump(index);
    },
    [jump, autoplay],
  );

  return { active, progress, playing, ended, epoch, pause, play, toggle, replay, goTo };
}
