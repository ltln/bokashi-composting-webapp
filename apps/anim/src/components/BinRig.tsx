import type { ReactNode } from "react";
import { COMP_HEIGHT, COMP_WIDTH, STAGE_VIEW } from "../timeline";
import { FONT_FAMILY, TOKENS } from "../tokens";

/** Crushed aluminium cans forming the 2-row false bottom (logical 320×280 coords). */
export const CAN_SLOTS = [
  // Row 0 (bottom, sitting on floor y=257 → rect top y=247)
  { id: 0, x: 97, y: 247, fill: TOKENS.illo.canRed, row: 0 },
  { id: 1, x: 123, y: 247, fill: TOKENS.illo.canBlue, row: 0 },
  { id: 2, x: 149, y: 247, fill: TOKENS.illo.canYellow, row: 0 },
  { id: 3, x: 175, y: 247, fill: TOKENS.illo.canGreen, row: 0 },
  { id: 4, x: 201, y: 247, fill: TOKENS.illo.canPurple, row: 0 },
  // Row 1 (top, resting on row 0 → rect top y=236)
  { id: 5, x: 110, y: 236, fill: TOKENS.illo.canBlue, row: 1 },
  { id: 6, x: 136, y: 236, fill: TOKENS.illo.canRed, row: 1 },
  { id: 7, x: 162, y: 236, fill: TOKENS.illo.canPurple, row: 1 },
  { id: 8, x: 188, y: 236, fill: TOKENS.illo.canYellow, row: 1 },
] as const;

export const BIN_PIVOT = { x: 229, y: 257 } as const;
export const BIN_INNER_PATH = "M77 52 L91 257 L229 257 L243 52 Z";
export const BIN_CLIP_PATH = "M77 -120 L243 -120 L243 52 L229 257 L91 257 L77 52 Z";
export const BIN_WALL_PATH = "M72 48 L86 262 L234 262 L248 48";

/**
 * Outer 1920×1080 canvas with seamless `surfaceTint` background (#E8EFE2)
 * and optional logical 320×280 viewport transform + subtle camera offset.
 */
export function StageCanvas({
  children,
  rawCoords = false,
  camX = 0,
  camY = 0,
  camScale = 1,
}: {
  children: ReactNode;
  rawCoords?: boolean;
  camX?: number;
  camY?: number;
  camScale?: number;
}) {
  const tx = STAGE_VIEW.offsetX + camX * STAGE_VIEW.scale;
  const ty = STAGE_VIEW.offsetY + camY * STAGE_VIEW.scale;
  const s = STAGE_VIEW.scale * camScale;

  return (
    <svg
      width={COMP_WIDTH}
      height={COMP_HEIGHT}
      viewBox={`0 0 ${COMP_WIDTH} ${COMP_HEIGHT}`}
      style={{
        display: "block",
        backgroundColor: TOKENS.surfaceTint,
        fontFamily: FONT_FAMILY,
        shapeRendering: "geometricPrecision",
      }}
    >
      {rawCoords ? (
        children
      ) : (
        <g transform={`translate(${tx.toFixed(3)}, ${ty.toFixed(3)}) scale(${s.toFixed(4)})`}>
          {children}
        </g>
      )}
    </svg>
  );
}

/** Deterministic tiled organic food-waste pattern for the bin interior. */
export function OrganicPatternDef({ id }: { id: string }) {
  return (
    <pattern id={id} width="28" height="18" patternUnits="userSpaceOnUse">
      <rect width="28" height="18" fill={TOKENS.illo.organic} />
      <rect x="2" y="3" width="6.5" height="3.2" rx="1.2" fill={TOKENS.illo.organicLeaf} />
      <circle cx="14" cy="6" r="2.1" fill={TOKENS.illo.organicPeel} />
      <rect x="19" y="11" width="5.5" height="3" rx="1.2" fill={TOKENS.illo.organicGreen} />
      <circle cx="7" cy="13" r="1.7" fill={TOKENS.illo.bran} />
      <rect x="21.5" y="2" width="3.5" height="2" rx="0.8" fill={TOKENS.illo.branDark} />
      <circle cx="12" cy="15.2" r="1" fill={TOKENS.illo.branLight} />
      <circle cx="25" cy="8" r="1" fill={TOKENS.illo.branLight} />
    </pattern>
  );
}

/** A single crushed aluminium can with metallic rim caps, waist crease, and specular highlight. */
export function AluminiumCan({
  x,
  y,
  fill,
  showTabs = true,
  rotation = 0,
  scaleX = 1,
  scaleY = 1,
  opacity = 1,
}: {
  x: number;
  y: number;
  fill: string;
  showTabs?: boolean;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
}) {
  const cx = x + 11;
  const cy = y + 10; // pivot at bottom edge for squash/stretch
  return (
    <g
      opacity={opacity}
      transform={`translate(${cx}, ${cy}) rotate(${rotation.toFixed(3)}) scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)}) translate(${-cx}, ${-cy})`}
    >
      {/* Subtle crush shadow under can */}
      <rect x={x + 1} y={y + 0.5} width="20" height="9.5" rx="3.8" fill={fill} />
      {/* Top specular highlight */}
      <rect x={x + 4} y={y + 1.5} width="14" height="2" rx="1" fill={TOKENS.surface} opacity={0.26} />
      {/* Crushed waist crease lines */}
      <path
        d={`M${x + 8} ${y + 2.5} L${x + 9.5} ${y + 7.5} M${x + 13.5} ${y + 2.5} L${x + 12} ${y + 7.5}`}
        stroke={TOKENS.ink}
        strokeOpacity={0.16}
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      {showTabs && (
        <>
          <rect x={x} y={y} width="3.2" height="10" rx="1.5" fill={TOKENS.illo.canRim} />
          <rect x={x + 18.8} y={y} width="3.2" height="10" rx="1.5" fill={TOKENS.illo.canRim} />
          <rect x={x + 0.6} y={y + 1.2} width="1" height="7.6" rx="0.5" fill={TOKENS.surface} opacity={0.5} />
        </>
      )}
    </g>
  );
}

export interface BinRigProps {
  idPrefix: string;
  /** Tilt angle clockwise in degrees around bottom-right corner `(229, 257)`. */
  tiltDeg?: number;
  /** Subtle vertical squash/recoil on the bin when heavy press or lid snap happens. */
  squashY?: number;
  /** Floor shadow horizontal stretch / shift when tilted. */
  shadowShiftX?: number;
  /** Static cans visibility (or custom cans inside children). */
  cans?: "none" | "static";
  canTabs?: boolean;
  /** Flat newspaper underlay behind cans. */
  newspaperOpacity?: number;
  newspaperColor?: string;
  newspaperSquashY?: number;
  /** Underlay between newspaper and cans (e.g., leachate pool). */
  underlay?: ReactNode;
  /** Static cardboard strip at y=226..230.5. */
  cardboard?: boolean;
  cardboardY?: number;
  /** Interior clipped content (rubbish layers, falling items, press plate, mold...). */
  children?: ReactNode;
  /** Outside clip, under walls (bag collar overhanging rim, hand/spoon behind rim...). */
  outside?: ReactNode;
  /** Over walls and handles (lid, EM bottle, brackets, leader labels...). */
  overlay?: ReactNode;
}

/**
 * Coherent 10L DIY Bokashi bin rig in 320×280 logical coordinates.
 * Consistent geometry, wall weight (7), rim handles, and layer order across all boards.
 */
export function BinRig({
  idPrefix,
  tiltDeg = 0,
  squashY = 1,
  shadowShiftX = 0,
  cans = "static",
  canTabs = false,
  newspaperOpacity = 0,
  newspaperColor = TOKENS.illo.paper,
  newspaperSquashY = 1,
  underlay,
  cardboard = false,
  cardboardY = 226,
  children,
  outside,
  overlay,
}: BinRigProps) {
  const clipId = `${idPrefix}-bin-clip`;
  const squashX = 1 / Math.sqrt(Math.max(0.85, squashY));
  // Ground shadow adjusts smoothly when the bin tilts
  const shadowRx = Math.max(76, 104 - Math.abs(tiltDeg) * 1.4);
  const shadowCx = 160 + shadowShiftX + tiltDeg * 1.8;

  return (
    <g>
      {/* Dynamic floor shadow */}
      <ellipse cx={shadowCx} cy={266} rx={shadowRx} ry={7} fill={TOKENS.border} />

      <g
        transform={
          tiltDeg !== 0 || squashY !== 1
            ? `translate(${BIN_PIVOT.x}, ${BIN_PIVOT.y}) rotate(${tiltDeg.toFixed(3)}) scale(${squashX.toFixed(4)}, ${squashY.toFixed(4)}) translate(${-BIN_PIVOT.x}, ${-BIN_PIVOT.y})`
            : undefined
        }
      >
        <defs>
          <clipPath id={clipId}>
            <path d={BIN_CLIP_PATH} />
          </clipPath>
        </defs>

        {/* Interior cavity */}
        <path d={BIN_INNER_PATH} fill={TOKENS.illo.binInner} />

        {/* Clipped interior layers */}
        <g clipPath={`url(#${clipId})`}>
          {newspaperOpacity > 0 && (
            <g
              opacity={newspaperOpacity}
              transform={
                newspaperSquashY !== 1
                  ? `translate(160, 257) scale(1, ${newspaperSquashY.toFixed(4)}) translate(-160, -257)`
                  : undefined
              }
            >
              <rect x="70" y="230" width="180" height="30" fill={newspaperColor} />
            </g>
          )}
          {underlay}
          {cans === "static" &&
            CAN_SLOTS.map((c) => (
              <AluminiumCan key={c.id} x={c.x} y={c.y} fill={c.fill} showTabs={canTabs} />
            ))}
          {cardboard && (
            <g>
              <rect x="70" y={cardboardY} width="180" height="4.5" fill={TOKENS.illo.cardboard} />
              <line
                x1="70"
                y1={cardboardY + 2.25}
                x2="250"
                y2={cardboardY + 2.25}
                stroke={TOKENS.illo.cardboardLine}
                strokeWidth="0.9"
                strokeDasharray="3 4"
                opacity={0.75}
              />
            </g>
          )}
          {children}
        </g>

        {/* Under-wall elements (e.g. bag collar overhanging rim) */}
        {outside}

        {/* Outer walls & handles (fixed 7-unit line weight, rounded bottom corners) */}
        <path
          d={BIN_WALL_PATH}
          fill="none"
          stroke={TOKENS.illo.binWall}
          strokeWidth="7"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Rim bevel line */}
        <path
          d="M72 48 L86 262 L234 262 L248 48"
          fill="none"
          stroke={TOKENS.surface}
          strokeOpacity={0.25}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* Rim handles */}
        <rect x="64" y="43" width="16" height="8" rx="3" fill={TOKENS.illo.binHandle} />
        <rect x="66" y="44.2" width="12" height="1.8" rx="0.9" fill={TOKENS.surface} opacity={0.25} />
        <rect x="240" y="43" width="16" height="8" rx="3" fill={TOKENS.illo.binHandle} />
        <rect x="242" y="44.2" width="12" height="1.8" rx="0.9" fill={TOKENS.surface} opacity={0.25} />

        {/* Overlay elements (lid, labels, brackets, bottle) */}
        {overlay}
      </g>
    </g>
  );
}
