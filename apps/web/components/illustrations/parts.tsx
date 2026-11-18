/**
 * Shared illustration props: the objects every board draws (bin lid, EM bottle,
 * press plate, pot + sprout, watering can, bag collar) plus the annotation
 * helpers. Each one owns its coordinates and its animation, so a board can
 * never draw a detached lid or grains raining far from the bottle.
 *
 * Rules (keep them when adding a prop):
 * - one geometry per object — the same bin lid, bottle and pot everywhere;
 * - emitters draw their own output: the bottle emits the bran, the can emits
 *   the drops, so they always start at the mouth;
 * - annotations use `bk-illo-label` at 10 px and `bk-muted` leader lines;
 * - animate `transform`/`opacity` only, always behind `motion-safe:`.
 */
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { delay } from "./faq/shared";

/** Bin lid states. `off` draws nothing (lid taken away). */
export type LidState = "off" | "open" | "ajar" | "sealed" | "sealing";

/**
 * The bin lid, always in bin coordinates (y 30). `open` floats 24 px above the
 * rim, `ajar` is hinged open on the left corner, `sealing` drops into place.
 */
export function Lid({ state }: { state: LidState }) {
  if (state === "off") return null;
  const shell = (
    <>
      <rect x="62" y="30" width="196" height="12" rx="5" className="fill-bk-primary" />
      <rect x="146" y="24" width="28" height="7" rx="3" className="fill-bk-illo-lid-handle" />
    </>
  );
  if (state === "open") return <g style={{ transform: "translateY(-24px)" }}>{shell}</g>;
  if (state === "ajar") return <g transform="rotate(-6 62 42)">{shell}</g>;
  return <g className={state === "sealing" ? "motion-safe:animate-lidSeal" : undefined}>{shell}</g>;
}

/** Dimension bracket on the left of the bin: "10–20%", "~70%". */
export function Bracket({ x, y1, y2, text, gap = 7 }: { x: number; y1: number; y2: number; text: string; gap?: number }) {
  return (
    <g>
      <path
        d={`M${x + gap} ${y1} L${x} ${y1} L${x} ${y2} L${x + gap} ${y2}`}
        fill="none"
        strokeWidth="1.2"
        className="stroke-bk-muted"
      />
      <text x={x - 4} y={(y1 + y2) / 2 + 3.5} textAnchor="end" fontSize="10" className="fill-bk-illo-label">
        {text}
      </text>
    </g>
  );
}

/** Leader line + one or more text lines, e.g. "vùng hở", "Pha loãng ~1:100". */
export function LeaderLabel({
  from,
  to,
  lines,
  anchor = "start",
}: {
  from: [number, number];
  to: [number, number];
  lines: readonly string[];
  anchor?: "start" | "end";
}) {
  const top = to[1] - (lines.length - 1) * 6;
  return (
    <g fontSize="10">
      <path d={`M${from[0]} ${from[1]} L${to[0]} ${to[1]}`} strokeWidth="1" className="stroke-bk-muted" />
      {lines.map((t, i) => (
        <text
          key={t}
          x={to[0] + (anchor === "start" ? 2 : -2)}
          y={top + i * 12 + 3.5}
          textAnchor={anchor}
          className="fill-bk-illo-label"
        >
          {t}
        </text>
      ))}
    </g>
  );
}

/**
 * Leader line + a bold, coloured title and an optional plain second line
 * ("Lon nhôm / bóp dẹp", "Bọt khí / còn kẹt"). `at` is the title baseline;
 * the second line sits 11 px below it.
 */
export function Callout({
  path,
  at,
  title,
  sub,
  titleClassName = "fill-bk-illo-label",
  anchor = "start",
  plain,
  className,
  style,
}: {
  path?: string;
  at: [number, number];
  title: string;
  sub?: string;
  titleClassName?: string;
  anchor?: "start" | "end";
  /** Regular weight title (a plain two-line label). */
  plain?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <g fontSize="10" className={className} style={style}>
      {path && <path d={path} strokeWidth="1" className="stroke-bk-muted" />}
      <text x={at[0]} y={at[1]} textAnchor={anchor} fontWeight={plain ? undefined : "700"} className={titleClassName}>
        {title}
      </text>
      {sub && (
        <text x={at[0]} y={at[1] + 11} textAnchor={anchor} className="fill-bk-illo-label">
          {sub}
        </text>
      )}
    </g>
  );
}

/**
 * A hand seen from above, smoothing towards +x (fingers point right), in a
 * green sleeve. Drawn around (cx, cy) at `scale` (the step 3 board uses 0.6).
 */
export function Hand({ cx, cy, scale = 1 }: { cx: number; cy: number; scale?: number }) {
  const shapes = (
    <>
      <path d="M-12 -16 Q-20 -12.5 -26 -12 L-66 -13.5 L-66 13.5 L-26 12 Q-20 12.5 -12 16 Z" />
      <rect x="-22" y="-19" width="40" height="38" rx="12" />
      <rect x="6" y="-18.6" width="38" height="8.6" rx="4.3" transform="rotate(-5 6 -14.3)" />
      <rect x="6" y="-8.9" width="43" height="8.8" rx="4.4" />
      <rect x="6" y="0.9" width="40" height="8.6" rx="4.3" transform="rotate(4 6 5.2)" />
      <rect x="4" y="10.4" width="31" height="7.6" rx="3.8" transform="rotate(10 4 14.2)" />
      <rect x="-18" y="-21.5" width="27" height="10" rx="5" transform="rotate(-42 -18 -16.5)" />
    </>
  );
  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale})`}>
      {/* Outline pass (stroked), then the fill pass on top, so overlaps show no seams. */}
      <g strokeWidth="2.2" strokeLinejoin="round" className="fill-bk-illo-skin-outline stroke-bk-illo-skin-outline">
        {shapes}
      </g>
      <g className="fill-bk-illo-skin">{shapes}</g>
      <path
        d="M-80 -17 L-46 -16 Q-43 -16 -43 -13 L-43 13 Q-43 16 -46 16 L-80 17 Z"
        strokeWidth="1.76"
        strokeLinejoin="round"
        className="fill-bk-primary stroke-bk-illo-lid-handle"
      />
      <path d="M-49 -15.5 L-49 15.5" strokeWidth="1.2" className="stroke-bk-illo-lid-handle" />
    </g>
  );
}

/** Bran grains falling from a bottle's mouth: cx offsets from the mouth centre. */
const GRAIN_OFFSETS = [-30, -16, -2, 10, 22, 32] as const;

/**
 * Shaker of bokashi bran, 32×46 at (x, y). `grainY` draws the bran raining from
 * the mouth down onto that surface line; `shaking` rocks the bottle in place.
 */
export function Bottle({
  x,
  y,
  shaking,
  grainY,
}: {
  x: number;
  y: number;
  shaking?: boolean;
  grainY?: number;
}) {
  const mouthX = x + 16;
  return (
    <g>
      <g
        className={shaking ? "motion-safe:animate-shake" : undefined}
        style={{ transformOrigin: `${mouthX}px ${y + 23}px` }}
      >
        <rect x={x} y={y} width="32" height="46" rx="7" strokeWidth="1.2" className="fill-bk-illo-bottle stroke-bk-brown" />
        <rect x={x + 4} y={y - 6} width="24" height="9" rx="3" className="fill-bk-primary" />
        <text x={mouthX} y={y + 27} textAnchor="middle" fontSize="11" fontWeight="700" className="fill-bk-brown-dark">
          EM
        </text>
      </g>
      {grainY !== undefined && (
        <g className="fill-bk-illo-cardboard-line">
          {GRAIN_OFFSETS.map((dx, i) => (
            <circle
              key={dx}
              cx={mouthX + dx}
              cy={grainY}
              r="1.7"
              className="motion-safe:animate-sprinkle"
              style={delay(i * 0.22)}
            />
          ))}
        </g>
      )}
    </g>
  );
}

/** Compacted press plate, 128 wide, top edge at y; the knob sits above it. */
export function PressPlate({ cx = 160, y }: { cx?: number; y: number }) {
  return (
    <g className="motion-safe:animate-press">
      <rect x={cx - 64} y={y} width="128" height="8" rx="3" className="fill-bk-brown" />
      <rect x={cx - 10} y={y - 14} width="20" height="14" rx="3" className="fill-bk-brown-dark" />
    </g>
  );
}

/**
 * Potted sprout, 70 wide: (x, y) is the top-left of the rim. `w` scales it, so
 * the 320×280 boards and the 150×140 compare boards share one drawing.
 * `soilMound` heaps the soil over the rim, for a pot being filled; the sprout
 * always grows out of the soil either way. The sprout pulses (`animate-sprout`).
 */
export function PotSprout({ x, y, w = 70, soilMound }: { x: number; y: number; w?: number; soilMound?: boolean }) {
  const s = w / 70;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M3 7 L61 7 L53 48 L11 48 Z" className="fill-bk-illo-pot" />
      <rect x="-3" y="0" width="70" height="7" rx="2" className="fill-bk-illo-pot-rim" />
      {soilMound ? (
        <ellipse cx="32" cy="4" rx="27" ry="6.5" className="fill-bk-illo-organic" />
      ) : (
        <rect x="6" y="2" width="52" height="4" className="fill-bk-illo-organic" />
      )}
      <g className="motion-safe:animate-sprout" style={{ transformBox: "fill-box", transformOrigin: "bottom" }}>
        <path d="M32 2 V-16" strokeWidth="2.4" strokeLinecap="round" className="stroke-bk-primary" />
        <path d="M32 -8 C24 -10 20 -16 20 -20 C26 -20 31 -16 32 -8 Z" className="fill-bk-illo-organic-leaf" />
        <path d="M32 -11 C40 -13 44 -19 44 -23 C38 -23 33 -19 32 -11 Z" className="fill-bk-leaf" />
      </g>
    </g>
  );
}

/**
 * Spout tip of the watering can, relative to its (x, y). Place the pot so its
 * soil sits under `x + TIP.dx`, `y + TIP.dy`. The can is drawn already tilted.
 */
export const WATERING_CAN_TIP = { dx: 70, dy: 12 } as const;

/** Watering can, 81×57 locally, tilted as if pouring. `pouring` adds the drops. */
export function WateringCan({ x, y, pouring }: { x: number; y: number; pouring?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g transform="rotate(20 17 19)">
        <path d="M2 4 Q17 -12 32 4" fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-bk-illo-metal-dark" />
        <rect x="0" y="0" width="34" height="38" rx="8" strokeWidth="2" className="fill-bk-illo-metal stroke-bk-illo-metal-dark" />
        <path d="M32 8 L64 -6" strokeWidth="5" strokeLinecap="round" className="stroke-bk-illo-metal-dark" />
        <circle cx="64" cy="-6" r="4.5" className="fill-bk-illo-metal-dark" />
      </g>
      {pouring && (
        <g fill="none" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="3 2.5" className="stroke-bk-illo-water">
          <path d="M66 20 q3 5 0 8 q-3 -3 0 -8z" className="motion-safe:animate-fall" />
          <path d="M72 26 q3 5 0 8 q-3 -3 0 -8z" className="motion-safe:animate-fall" style={delay(0.4)} />
          <path d="M62 32 q3 5 0 8 q-3 -3 0 -8z" className="motion-safe:animate-fall" style={delay(0.8)} />
        </g>
      )}
    </g>
  );
}

/**
 * Plastic-bag collar hanging over the rim. One path per state so every board
 * draws the same bag: `up` flipped up (surface exposed), `open` draped open at
 * the top, `flat` smoothed across the rim, `lip` edge lying on the surface,
 * `gap` edge lifted where the seal is broken.
 */
export type BagCollarState = "up" | "open" | "flat" | "lip" | "gap" | "smoothing";

const BAG_PATHS: Record<BagCollarState, string> = {
  up: "M68 44 Q70 26 104 22 L190 18",
  open: "M68 44 Q76 46 79 58 L80 80 Q160 73 240 80 L241 58 Q244 46 252 44",
  flat: "M68 44 Q74 56 80 80 L240 80 Q246 56 252 44",
  lip: "M68 44 Q76 46 79 58 L80 80 L242 80",
  gap: "M68 44 Q76 46 79 58 L80 80 L190 80 Q199 79 201 70",
  // Step 3: left side already smoothed flat, a bubble of air still trapped near the right wall.
  smoothing: "M68 44 Q76 46 79 58 L80 80 L212 80 Q218 79 221 74 Q229 67 236 74 Q240 77 240 80 L241 58 Q244 46 252 44",
};

export function BagCollar({
  state,
  strong,
  className,
}: {
  state: BagCollarState;
  /** Darker outline, for the bag being worked on (step 3 smoothing). */
  strong?: boolean;
  className?: string;
}) {
  return (
    <path
      d={BAG_PATHS[state]}
      fill="none"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(strong ? "stroke-bk-illo-bag-strong" : "stroke-bk-illo-bag", className)}
    />
  );
}
