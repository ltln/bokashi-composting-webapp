import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Rows of aluminium cans of the false bottom. */
const CANS = [
  // bottom row
  { x: 97, y: 247, fill: "fill-bk-illo-can-red", row: 0 },
  { x: 123, y: 247, fill: "fill-bk-illo-can-blue", row: 0 },
  { x: 149, y: 247, fill: "fill-bk-illo-can-yellow", row: 0 },
  { x: 175, y: 247, fill: "fill-bk-illo-can-green", row: 0 },
  { x: 201, y: 247, fill: "fill-bk-illo-can-purple", row: 0 },
  // top row
  { x: 110, y: 236, fill: "fill-bk-illo-can-blue", row: 1 },
  { x: 136, y: 236, fill: "fill-bk-illo-can-red", row: 1 },
  { x: 162, y: 236, fill: "fill-bk-illo-can-purple", row: 1 },
  { x: 188, y: 236, fill: "fill-bk-illo-can-yellow", row: 1 },
] as const;

export interface BinBaseProps {
  /** Accessible description of the whole illustration (Vietnamese, from content/). */
  label: string;
  /**
   * Content drawn INSIDE the bin, clipped to its interior (rubbish layers, paper
   * balls, bubbles…). Painted after the cans/newspaper and before the walls.
   * Coordinates are in the 320×280 viewBox; the interior spans x 77–243 and
   * y 52–257 (slanted walls), the floor is y 257.
   */
  children?: ReactNode;
  /**
   * Content drawn outside the clip but UNDER the walls (e.g. the bag that
   * overhangs the rim).
   */
  outside?: ReactNode;
  /**
   * Content drawn OVER the walls and handles (lid, EM bottle, dimension
   * brackets, callout numbers, text labels).
   */
  overlay?: ReactNode;
  /**
   * The false-bottom can layer.
   * - "none": not drawn
   * - "static": drawn at rest (default)
   * - "drop": every can falls in one after another, turning from upright to
   *   lying flat (`motion-safe:animate-canIn`, staggered 0.39 s; plays once)
   */
  cans?: "none" | "static" | "drop";
  /** Draw the pull-tab highlights on the cans (step 1 board does, steps 2-3 don't). Default true. */
  canTabs?: boolean;
  /** Draw the newspaper layer as one flat band (y 230–260) behind the cans. Default false. */
  newspaper?: boolean;
  /** Fill class of the newspaper band. Default "fill-bk-illo-paper" (FAQ 3 uses a wet tint). */
  newspaperClassName?: string;
  /** Drawn between the newspaper band and the cans (FAQ 3's pooled liquid). Clipped to the interior. */
  underlay?: ReactNode;
  /** Draw the cardboard strip on top of the newspaper (y 226–230.5). Default false. */
  cardboard?: boolean;
  /** Freeze CSS animations inside the SVG. The AnimationStage does this for the whole canvas already. */
  paused?: boolean;
  className?: string;
}

/**
 * The shared bin cross-section (viewBox 0 0 320 280) used by every setup step
 * and by the FAQ illustrations: soil shadow, bin interior + clip path, walls,
 * rim handles, and the optional can / newspaper / cardboard layers.
 *
 * Layers, bottom to top: shadow → interior → [newspaper, cans, cardboard,
 * `children`] clipped to the interior → `outside` → walls + handles →
 * `overlay`.
 *
 * Clip-path ids come from `useId()`, so any number of instances can share a
 * page. If you need a pattern too, derive its id the same way (see
 * `useSvgId`). Animate children only with `transform` and `opacity`.
 *
 * @example
 *   <BinBase label="Mặt cắt thùng" cans="static" newspaper cardboard overlay={<g>…</g>}>
 *     <rect x="70" y="190" width="180" height="36" /> {/* clipped to the bin *\/}
 *   </BinBase>
 */
export function BinBase({
  label,
  children,
  outside,
  overlay,
  cans = "static",
  canTabs = true,
  newspaper = false,
  newspaperClassName = "fill-bk-illo-paper",
  underlay,
  cardboard = false,
  paused = false,
  className,
}: BinBaseProps) {
  const clipId = `${useSvgId()}-clip`;
  return (
    <svg
      viewBox="0 0 320 280"
      role="img"
      aria-label={label}
      className={cn("block h-full w-full", paused && "anim-paused", className)}
    >
      <defs>
        <clipPath id={clipId}>
          <path d="M77 0 L243 0 L243 52 L229 257 L91 257 L77 52 Z" />
        </clipPath>
      </defs>
      <ellipse cx="160" cy="266" rx="104" ry="7" className="fill-bk-border" />
      <path d="M77 52 L91 257 L229 257 L243 52 Z" className="fill-bk-illo-bin-inner" />
      <g clipPath={`url(#${clipId})`}>
        {newspaper && <rect x="70" y="230" width="180" height="30" className={newspaperClassName} />}
        {underlay}
        {cans !== "none" &&
          CANS.map((c, i) => {
            const falling = cans === "drop";
            return (
              <g
                key={i}
                className={falling ? "svg-box motion-safe:animate-canIn" : undefined}
                style={falling ? { animationDelay: `${(0.2 + i * 0.39).toFixed(2)}s` } : undefined}
              >
                <rect x={c.x} y={c.y} width="22" height="10" rx="4" className={c.fill} />
                {canTabs && (
                  <>
                    <rect x={c.x} y={c.y} width="3" height="10" rx="1.5" className="fill-bk-illo-can-rim" />
                    <rect x={c.x + 19} y={c.y} width="3" height="10" rx="1.5" className="fill-bk-illo-can-rim" />
                  </>
                )}
              </g>
            );
          })}
        {cardboard && <rect x="70" y="226" width="180" height="4.5" className="fill-bk-illo-cardboard" />}
        {children}
      </g>
      {outside}
      <path
        d="M72 48 L86 262 L234 262 L248 48"
        fill="none"
        strokeWidth="7"
        strokeLinejoin="round"
        className="stroke-bk-illo-bin-wall"
      />
      <rect x="64" y="43" width="16" height="8" rx="3" className="fill-bk-illo-bin-handle" />
      <rect x="240" y="43" width="16" height="8" rx="3" className="fill-bk-illo-bin-handle" />
      {overlay}
    </svg>
  );
}

/**
 * A DOM-safe unique id prefix for SVG `id`s (clipPath, pattern, mask). `useId()`
 * returns values like ":r1:" whose colons are awkward inside `url(#…)`.
 */
export function useSvgId(): string {
  return `bk${useId().replace(/:/g, "")}`;
}
