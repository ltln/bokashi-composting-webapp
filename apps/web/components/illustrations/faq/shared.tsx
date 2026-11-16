import type { CSSProperties } from "react";

/** Delay style helper for staggered animations (0 = no style). */
export function delay(s: number): CSSProperties | undefined {
  return s ? { animationDelay: `${s}s` } : undefined;
}

/** Layer separator lines of the compacted rubbish (y of each 2.5 px line). */
const LAYER_LINES = [190, 154, 118] as const;

/**
 * The rubbish body shared by FAQ 1–3: the organic texture from y 82 to 226 and
 * the pale layer lines. `fill` is `url(#pattern)`. The top line is drawn by
 * each board (its width and y differ).
 */
export function RubbishBody({ fill }: { fill: string }) {
  return (
    <>
      <rect x="70" y="82" width="180" height="144" fill={fill} />
      {LAYER_LINES.map((y) => (
        <rect key={y} x="70" y={y} width="180" height="2.5" className="fill-bk-illo-cardboard-line" />
      ))}
    </>
  );
}

/** Check mark path (24×24 box). */
export const CHECK_PATH = "M5 12l5 5 9-10";
/** Cross path (24×24 box). */
export const CROSS_PATH = "M6 6l12 12M18 6L6 18";

/** A fly: wings + body, in the 320×280 viewBox. Wrap in a buzzing <g>. */
export function Fly({ x, y }: { x: number; y: number }) {
  return (
    <>
      <ellipse cx={x} cy={y} rx="4" ry="5" opacity="0.85" className="fill-bk-illo-fly-wing" />
      <ellipse cx={x} cy={y + 4} rx="3.2" ry="2.2" className="fill-bk-illo-fly-body" />
    </>
  );
}
