import { Easing, interpolate, random, spring } from "remotion";
import { FPS } from "./timeline";

export const EASE = {
  smooth: Easing.bezier(0.25, 0.1, 0.25, 1),
  out: Easing.bezier(0.16, 1, 0.3, 1),
  in: Easing.bezier(0.55, 0.05, 0.85, 0.35),
  inOut: Easing.bezier(0.42, 0, 0.2, 1),
  backOut: Easing.bezier(0.22, 1.18, 0.36, 1),
} as const;

/** Clamped interpolation shorthand (prevents value runaway outside keyframe bounds). */
export function clampInterp(
  value: number,
  inputRange: readonly [number, number] | readonly number[],
  outputRange: readonly number[],
  easing?: (t: number) => number,
): number {
  return interpolate(value, [...inputRange], [...outputRange], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
}

/** 0..1 progress inside [start, end] with optional easing. */
export function segProgress(
  frame: number,
  start: number,
  end: number,
  easing: (t: number) => number = EASE.inOut,
): number {
  if (end <= start) return frame >= end ? 1 : 0;
  return clampInterp(frame, [start, end], [0, 1], easing);
}

/**
 * Spring helper anchored at `startFrame` with sensible defaults for crisp 60fps UI/prop motion.
 */
export function motionSpring(
  frame: number,
  startFrame: number,
  options?: {
    damping?: number;
    stiffness?: number;
    mass?: number;
    overshootClamping?: boolean;
    durationInFrames?: number;
  },
): number {
  if (frame <= startFrame) return 0;
  return spring({
    frame: frame - startFrame,
    fps: FPS,
    config: {
      damping: options?.damping ?? 16,
      stiffness: options?.stiffness ?? 150,
      mass: options?.mass ?? 1,
      overshootClamping: options?.overshootClamping ?? false,
    },
    durationInFrames: options?.durationInFrames,
  });
}

/**
 * Gravity-accelerated vertical drop with optional tiny physical bounce on landing.
 * Returns { y, impactSquashX, impactSquashY } so every landing solid object feels weighty.
 */
export function gravityDrop(
  frame: number,
  startFrame: number,
  fallDuration: number,
  fromY: number,
  toY: number,
  options?: {
    bouncePx?: number;
    bounceFrames?: number;
    squashAmount?: number;
    anticipationPx?: number;
    anticipationFrames?: number;
  },
): { y: number; scaleX: number; scaleY: number; landed: boolean; opacity: number } {
  const antF = options?.anticipationFrames ?? 8;
  const antPx = options?.anticipationPx ?? 3.5;
  const bouncePx = options?.bouncePx ?? 3.5;
  const bounceF = options?.bounceFrames ?? 18;
  const squash = options?.squashAmount ?? 0.1;

  const antStart = startFrame - antF;
  if (frame < antStart) {
    return { y: fromY, scaleX: 1, scaleY: 1, landed: false, opacity: 0 };
  }

  const opacity = clampInterp(frame, [antStart, startFrame + 4], [0, 1], EASE.out);

  if (frame < startFrame) {
    // Anticipation lift before dropping
    const t = clampInterp(frame, [antStart, startFrame], [0, 1], EASE.inOut);
    const lift = Math.sin(t * Math.PI * 0.5) * antPx;
    return {
      y: fromY - lift,
      scaleX: 1 - t * 0.03,
      scaleY: 1 + t * 0.03,
      landed: false,
      opacity,
    };
  }

  const impactFrame = startFrame + fallDuration;
  if (frame < impactFrame) {
    // Free-fall: quadratic acceleration (gravity) + subtle vertical stretch near impact
    const t = (frame - startFrame) / fallDuration;
    const g = t * t;
    const y = (fromY - antPx * 0.4 * (1 - t)) + (toY - (fromY - antPx * 0.4 * (1 - t))) * g;
    const stretch = Math.min(0.06, t * 0.06);
    return {
      y,
      scaleX: 1 - stretch * 0.5,
      scaleY: 1 + stretch,
      landed: false,
      opacity: 1,
    };
  }

  const post = frame - impactFrame;
  if (post < bounceF) {
    const p = post / bounceF;
    // Damped single physical rebound + area-preserving squash-stretch
    const rebound = Math.sin(p * Math.PI) * bouncePx * (1 - p);
    const sq = Math.sin(p * Math.PI * 2) * squash * Math.exp(-3.2 * p);
    const sy = Math.max(0.75, 1 - sq);
    const sx = 1 / sy;
    return {
      y: toY - rebound,
      scaleX: sx,
      scaleY: sy,
      landed: true,
      opacity: 1,
    };
  }

  // Pure rest: zero subpixel jitter
  return { y: toY, scaleX: 1, scaleY: 1, landed: true, opacity: 1 };
}

/**
 * Parabolic projectile motion between (x0, y0) and (x1, y1) with arc apex lift.
 */
export function parabolicArc(
  t: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  arcLift: number,
): { x: number; y: number } {
  const c = Math.max(0, Math.min(1, t));
  const x = x0 + (x1 - x0) * c;
  // Parabolic arc peaking around c=0.45
  const linearY = y0 + (y1 - y0) * c;
  const arc = 4 * c * (1 - c) * arcLift;
  return { x, y: linearY - arc };
}

/**
 * Deterministic particle generator using Remotion's seeded `random()`.
 * Produces stable, non-flickering particle descriptors across threads.
 */
export interface SeededParticleSpec {
  readonly id: number;
  readonly rx: number; // 0..1
  readonly ry: number; // 0..1
  readonly rSize: number; // 0..1
  readonly rPhase: number; // 0..1
  readonly rSpeed: number; // 0..1
  readonly rRot: number; // 0..1
}

export function createSeededParticles(seedPrefix: string, count: number): readonly SeededParticleSpec[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    rx: random(`${seedPrefix}-x-${id}`),
    ry: random(`${seedPrefix}-y-${id}`),
    rSize: random(`${seedPrefix}-s-${id}`),
    rPhase: random(`${seedPrefix}-p-${id}`),
    rSpeed: random(`${seedPrefix}-v-${id}`),
    rRot: random(`${seedPrefix}-r-${id}`),
  }));
}

/**
 * Smoothly interpolates numeric coordinate arrays (e.g., Bézier control points)
 * so SVG shapes morph seamlessly without popping or teleporting.
 */
export function lerpNumbers(a: readonly number[], b: readonly number[], t: number): number[] {
  const k = Math.max(0, Math.min(1, t));
  return a.map((av, idx) => {
    const bv = b[idx] ?? av;
    return av + (bv - av) * k;
  });
}

/**
 * Rotate a 2D point around pivot (px, py) by angleDeg (clockwise in SVG coords).
 */
export function rotatePoint(
  x: number,
  y: number,
  px: number,
  py: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = x - px;
  const dy = y - py;
  return {
    x: px + dx * cos - dy * sin,
    y: py + dx * sin + dy * cos,
  };
}
