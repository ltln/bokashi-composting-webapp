import type { ReactNode } from "react";
import { lerpNumbers, rotatePoint } from "../physics";
import { FONT_FAMILY, TOKENS } from "../tokens";

/**
 * Bin lid at rest position `(x=62, y=30, w=196, h=12)`.
 * Supports smooth vertical lift (`yOffset`), hinge tilt around left corner (`hingeDeg`),
 * and subtle impact compression (`squashY`).
 */
export function Lid({
  xOffset = 0,
  yOffset = 0,
  hingeDeg = 0,
  squashY = 1,
  opacity = 1,
}: {
  xOffset?: number;
  yOffset?: number;
  hingeDeg?: number;
  squashY?: number;
  opacity?: number;
}) {
  if (opacity <= 0.005) return null;
  const squashX = 1 / Math.sqrt(Math.max(0.85, squashY));
  return (
    <g
      opacity={opacity}
      transform={`translate(${xOffset.toFixed(3)}, ${yOffset.toFixed(3)}) translate(62, 42) rotate(${hingeDeg.toFixed(3)}) translate(-62, -42) translate(160, 42) scale(${squashX.toFixed(4)}, ${squashY.toFixed(4)}) translate(-160, -42)`}
    >
      {/* Lid handle */}
      <rect x="146" y="23.5" width="28" height="7.5" rx="3.2" fill={TOKENS.illo.lidHandle} />
      <rect x="149" y="24.8" width="22" height="1.6" rx="0.8" fill={TOKENS.surface} opacity={0.22} />
      {/* Main lid shell */}
      <rect x="62" y="30" width="196" height="12" rx="5" fill={TOKENS.primary} />
      {/* Top specular highlight */}
      <rect x="67" y="31.5" width="186" height="2.2" rx="1.1" fill={TOKENS.surface} opacity={0.18} />
      {/* Rim lock lip under edges */}
      <rect x="64" y="39.5" width="192" height="2.5" rx="1.2" fill={TOKENS.primaryDark} opacity={0.45} />
    </g>
  );
}

/**
 * Plastic-bag collar cubic Bézier points `[M x y, C x1 y1 x2 y2 x y, C x1 y1 x2 y2 x y]`
 * (2 cubic segments = 14 numbers) so ANY bag collar state morphs smoothly without jumps.
 */
export type BagCollarState = "up" | "open" | "flat" | "lip" | "gap";

const BAG_CURVES: Record<BagCollarState, readonly number[]> = {
  // Flipped up on left, folded open high above rim
  up: [68, 44, 69, 32, 82, 24, 108, 22, 138, 19.5, 166, 18.5, 192, 18],
  // Draped open down into bin rim (both left and right collars visible)
  open: [68, 44, 76, 46, 79, 58, 80, 80, 130, 74, 190, 74, 240, 80],
  // Smoothed flat against waste surface at y=80
  flat: [68, 44, 74, 56, 78, 70, 80, 80, 133, 80, 187, 80, 240, 80],
  // Smoothed along right wall lip
  lip: [68, 44, 76, 46, 79, 58, 80, 80, 134, 80, 188, 80, 242, 80],
  // Right edge lifted up leaving exposed gap
  gap: [68, 44, 76, 46, 79, 58, 80, 80, 130, 80, 192, 81, 201, 70],
};

/** Right-side overhang tail when state is `open` or `flat`. */
const RIGHT_TAILS: Record<"open" | "flat" | "hidden", readonly number[]> = {
  open: [240, 80, 241, 62, 244, 46, 252, 44],
  flat: [240, 80, 244, 62, 247, 50, 252, 44],
  hidden: [240, 80, 240, 80, 240, 80, 240, 80],
};

function ptsToPath(p: readonly number[]): string {
  return `M${p[0]!.toFixed(2)} ${p[1]!.toFixed(2)} C${p[2]!.toFixed(2)} ${p[3]!.toFixed(2)}, ${p[4]!.toFixed(2)} ${p[5]!.toFixed(2)}, ${p[6]!.toFixed(2)} ${p[7]!.toFixed(2)} C${p[8]!.toFixed(2)} ${p[9]!.toFixed(2)}, ${p[10]!.toFixed(2)} ${p[11]!.toFixed(2)}, ${p[12]!.toFixed(2)} ${p[13]!.toFixed(2)}`;
}

export function BagCollar({
  fromState,
  toState = fromState,
  t = 0,
  rightTail = "none",
  rightTailOpacity = 1,
  yOffset = 0,
}: {
  fromState: BagCollarState;
  toState?: BagCollarState;
  t?: number;
  rightTail?: "none" | "open" | "flat";
  rightTailOpacity?: number;
  yOffset?: number;
}) {
  const pts = lerpNumbers(BAG_CURVES[fromState], BAG_CURVES[toState], t);
  const tailPts = rightTail === "none" ? null : RIGHT_TAILS[rightTail];

  return (
    <g transform={yOffset !== 0 ? `translate(0, ${yOffset.toFixed(2)})` : undefined}>
      <path
        d={ptsToPath(pts)}
        fill="none"
        stroke={TOKENS.illo.bag}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {tailPts && rightTailOpacity > 0.01 && (
        <path
          d={`M${tailPts[0]!.toFixed(2)} ${tailPts[1]!.toFixed(2)} C${tailPts[2]!.toFixed(2)} ${tailPts[3]!.toFixed(2)}, ${tailPts[4]!.toFixed(2)} ${tailPts[5]!.toFixed(2)}, ${tailPts[6]!.toFixed(2)} ${tailPts[7]!.toFixed(2)}`}
          fill="none"
          stroke={TOKENS.illo.bag}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={rightTailOpacity}
        />
      )}
    </g>
  );
}

/** Crumpled newspaper ball with organic silhouette & paper crease lines. */
export function PaperBall({
  cx,
  cy,
  r = 4.6,
  rot = 0,
  scaleX = 1,
  scaleY = 1,
  opacity = 1,
}: {
  cx: number;
  cy: number;
  r?: number;
  rot?: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
}) {
  if (opacity <= 0.01) return null;
  const s = r / 4.5;
  return (
    <g
      opacity={opacity}
      transform={`translate(${cx.toFixed(2)}, ${cy.toFixed(2)}) rotate(${rot.toFixed(2)}) scale(${(s * scaleX).toFixed(4)}, ${(s * scaleY).toFixed(4)})`}
    >
      <path
        d="M-4.3 -0.4 C-4.5 -3.0, -2.0 -4.5, 0.6 -4.3 C3.2 -4.1, 4.6 -2.0, 4.4 0.7 C4.2 3.2, 1.8 4.6, -0.8 4.4 C-3.3 4.2, -4.1 2.2, -4.3 -0.4 Z"
        fill={TOKENS.illo.paper}
        stroke={TOKENS.illo.paperEdge}
        strokeWidth="0.95"
      />
      {/* Folded newspaper crease lines */}
      <path
        d="M-2.2 -1.6 Q0.2 0.2 2.4 -1.2 M-1.4 1.8 Q0.6 0.4 2.1 2.1"
        fill="none"
        stroke={TOKENS.illo.paperEdge}
        strokeWidth="0.75"
        strokeLinecap="round"
      />
    </g>
  );
}

/** Exact mouth center of the EM bottle given top-left `(x, y)` and rotation `tiltDeg`. */
export function getBottleMouth(x: number, y: number, tiltDeg: number): { x: number; y: number } {
  // Bottle rect is (x, y) 32×46, cap at (x+4, y-6, 24×9) → mouth tip center when upright is (x+16, y-6)
  // Rotation pivot is bottle center (x+16, y+23)
  return rotatePoint(x + 16, y - 5, x + 16, y + 23, tiltDeg);
}

/**
 * Bokashi EM shaker bottle, 32×46 body + tapered neck & screw cap.
 * Coherent proportions and exact mouth geometry.
 */
export function Bottle({
  x,
  y,
  tiltDeg = 0,
  scale = 1,
  opacity = 1,
}: {
  x: number;
  y: number;
  tiltDeg?: number;
  scale?: number;
  opacity?: number;
}) {
  if (opacity <= 0.01) return null;
  const cx = x + 16;
  const cy = y + 23;
  return (
    <g
      opacity={opacity}
      transform={`translate(${cx}, ${cy}) rotate(${tiltDeg.toFixed(3)}) scale(${scale.toFixed(4)}) translate(${-cx}, ${-cy})`}
    >
      {/* Bottle shoulder + body */}
      <path
        d={`M${x + 6} ${y + 3} L${x + 26} ${y + 3} Q${x + 32} ${y + 6} ${x + 32} ${y + 13} L${x + 32} ${y + 39} Q${x + 32} ${y + 46} ${x + 25} ${y + 46} L${x + 7} ${y + 46} Q${x} ${y + 46} ${x} ${y + 39} L${x} ${y + 13} Q${x} ${y + 6} ${x + 6} ${y + 3} Z`}
        fill={TOKENS.illo.bottle}
        stroke={TOKENS.brown}
        strokeWidth="1.3"
      />
      {/* Highlight strip */}
      <rect x={x + 4} y={y + 12} width="3" height="28" rx="1.5" fill={TOKENS.surface} opacity={0.45} />
      {/* Green shaker cap */}
      <rect x={x + 6} y={y - 6} width="20" height="9" rx="3" fill={TOKENS.primary} />
      <rect x={x + 8} y={y - 4.5} width="16" height="1.8" rx="0.9" fill={TOKENS.leaf} opacity={0.4} />
      {/* Label band */}
      <rect x={x + 3} y={y + 16} width="26" height="16" rx="3" fill={TOKENS.brownTint} opacity={0.9} />
      <text
        x={cx}
        y={y + 28}
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill={TOKENS.brownDark}
      >
        EM
      </text>
    </g>
  );
}

/**
 * Metal spoon carrying EM bran (`branFill` 0..1).
 * Bowl center is near `(tipX, tipY)` so pouring particles spawn directly from the bowl lip.
 */
export function Spoon({
  tipX,
  tipY,
  tiltDeg = 0,
  branFill = 1,
  opacity = 1,
}: {
  tipX: number;
  tipY: number;
  tiltDeg?: number;
  branFill?: number;
  opacity?: number;
}) {
  if (opacity <= 0.01) return null;
  return (
    <g
      opacity={opacity}
      transform={`translate(${tipX.toFixed(2)}, ${tipY.toFixed(2)}) rotate(${tiltDeg.toFixed(3)})`}
    >
      {/* Handle extending upper-right */}
      <path
        d="M11 -3 L74 -29"
        stroke={TOKENS.illo.metalDark}
        strokeWidth="4.6"
        strokeLinecap="round"
      />
      <path
        d="M12 -3.5 L72 -28.5"
        stroke={TOKENS.illo.metalLight}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Grip tip */}
      <path
        d="M54 -20.5 L74 -29"
        stroke={TOKENS.brown}
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Spoon bowl */}
      <ellipse
        cx="0"
        cy="0"
        rx="12.5"
        ry="5.5"
        transform="rotate(-14)"
        fill={TOKENS.illo.metal}
        stroke={TOKENS.illo.metalDark}
        strokeWidth="1.2"
      />
      {/* EM bran mound inside bowl */}
      {branFill > 0.02 && (
        <g transform={`scale(1, ${branFill.toFixed(3)})`}>
          <path
            d="M-8.5 -0.5 Q0 -7.5 8.5 -0.5 Q0 2.5 -8.5 -0.5 Z"
            transform="rotate(-14)"
            fill={TOKENS.illo.bran}
            stroke={TOKENS.illo.cardboardLine}
            strokeWidth="0.6"
          />
        </g>
      )}
    </g>
  );
}

/** Compacted press plate (`width=128`, top surface at `y`). */
export function PressPlate({
  cx = 160,
  y,
  scaleX = 1,
  scaleY = 1,
  opacity = 1,
}: {
  cx?: number;
  y: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
}) {
  if (opacity <= 0.01) return null;
  return (
    <g
      opacity={opacity}
      transform={`translate(${cx}, ${y + 8}) scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)}) translate(${-cx}, ${-(y + 8)})`}
    >
      {/* Stem + T-handle */}
      <rect x={cx - 4.5} y={y - 16} width="9" height="16" rx="2.5" fill={TOKENS.brownDark} />
      <rect x={cx - 16} y={y - 21} width="32" height="7" rx="3.2" fill={TOKENS.brownDark} />
      <rect x={cx - 13} y={y - 19.8} width="26" height="1.5" rx="0.75" fill={TOKENS.surface} opacity={0.2} />
      {/* Base pressing plate */}
      <rect x={cx - 64} y={y} width="128" height="8" rx="3" fill={TOKENS.brown} />
      <rect x={cx - 61} y={y + 1.2} width="122" height="1.6" rx="0.8" fill={TOKENS.illo.cardboardLine} opacity={0.45} />
    </g>
  );
}

/**
 * Clean, well-proportioned 2D hand smoothing plastic or pressing surface.
 * Anchor `(x, y)` is the palm/fingertip contact center at the bottom edge of the hand.
 */
export function SmoothHand({
  x,
  y,
  tiltDeg = 0,
  flip = false,
  pressSquash = 1,
  opacity = 1,
}: {
  x: number;
  y: number;
  tiltDeg?: number;
  flip?: boolean;
  pressSquash?: number;
  opacity?: number;
}) {
  if (opacity <= 0.01) return null;
  const sx = flip ? -1 : 1;
  return (
    <g
      opacity={opacity}
      transform={`translate(${x.toFixed(2)}, ${y.toFixed(2)}) rotate(${tiltDeg.toFixed(2)}) scale(${sx}, ${pressSquash.toFixed(3)})`}
    >
      {/* Forearm / wrist cuff */}
      <path
        d="M-5 -24 L4 -24 L6 -13 L-6 -13 Z"
        fill={TOKENS.illo.skin}
        stroke={TOKENS.illo.skinLine}
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      {/* Palm + thumb + flat smoothing fingers */}
      <path
        d="M-6 -14 C-10 -12 -12 -7 -12 -3 C-12 -0.5 -10 1 -7 1 L9 1 C12 1 13.5 -1 13 -3.5 C12.5 -6 10 -8 7.5 -9.5 L6 -14 Z"
        fill={TOKENS.illo.skin}
        stroke={TOKENS.illo.skinLine}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Subtle finger separation creases */}
      <path
        d="M-3 -3.5 L-3 0.6 M2 -3.5 L2 0.6 M7 -3.5 L7 0.6"
        stroke={TOKENS.illo.skinLine}
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity={0.7}
      />
    </g>
  );
}

/**
 * Potted terracotta sprout with dynamic stem & unfurling leaf spring (`growth` 0..1.15).
 */
export function PotSprout({
  x,
  y,
  w = 70,
  soilMound = false,
  moundHeight = 1,
  growth = 1,
  swayDeg = 0,
}: {
  x: number;
  y: number;
  w?: number;
  soilMound?: boolean;
  moundHeight?: number;
  growth?: number;
  swayDeg?: number;
}) {
  const s = w / 70;
  const g = Math.max(0.05, growth);
  const leafScale = Math.min(1.12, 0.35 + 0.65 * g);
  const soilTopY = soilMound ? 4 - 5 * moundHeight : 2;

  return (
    <g transform={`translate(${x.toFixed(2)}, ${y.toFixed(2)}) scale(${s.toFixed(4)})`}>
      {/* Pot body */}
      <path d="M3 7 L61 7 L53 48 L11 48 Z" fill={TOKENS.illo.pot} />
      <path d="M9 10 L14 45 L18 45 L14 10 Z" fill={TOKENS.surface} opacity={0.14} />
      {/* Soil */}
      {soilMound ? (
        <ellipse
          cx="32"
          cy="4"
          rx="27"
          ry={(2 + 4.8 * moundHeight).toFixed(2)}
          fill={TOKENS.illo.organic}
        />
      ) : (
        <rect x="6" y="1" width="52" height="5" fill={TOKENS.illo.organic} />
      )}
      {/* Pot rim */}
      <rect x="-3" y="0" width="70" height="7.5" rx="2.2" fill={TOKENS.illo.potRim} />
      <rect x="-1" y="1.2" width="66" height="1.5" rx="0.75" fill={TOKENS.surface} opacity={0.18} />

      {/* Sprout growing out of soil */}
      <g
        transform={`translate(32, ${soilTopY.toFixed(2)}) rotate(${swayDeg.toFixed(2)}) scale(${leafScale.toFixed(4)}, ${g.toFixed(4)})`}
      >
        <path
          d="M0 0 Q1 -10 0 -19"
          fill="none"
          stroke={TOKENS.primary}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M0 -9 C-9 -11 -13 -17 -13 -21.5 C-7 -21.5 -1.5 -17 0 -9 Z"
          fill={TOKENS.illo.organicLeaf}
        />
        <path
          d="M0 -12 C9 -14 13 -20 13 -24.5 C7 -24.5 1.5 -20 0 -12 Z"
          fill={TOKENS.leaf}
          stroke={TOKENS.illo.organicLeaf}
          strokeWidth="0.6"
        />
      </g>
    </g>
  );
}

/**
 * Watering can with dynamic pour tilt (`tiltDeg`, default 20° pouring angle).
 * Exports exact sprinkler rose spout tip coordinates in parent coords!
 */
export function getWateringCanTip(x: number, y: number, tiltDeg = 20): { x: number; y: number } {
  // Local rose tip sits at (65.5, -6) around rotation pivot (17, 19)
  const rotated = rotatePoint(65.5, -6, 17, 19, tiltDeg);
  return { x: x + rotated.x, y: y + rotated.y };
}

export function WateringCan({
  x,
  y,
  tiltDeg = 20,
  scale = 1,
  opacity = 1,
}: {
  x: number;
  y: number;
  tiltDeg?: number;
  scale?: number;
  opacity?: number;
}) {
  if (opacity <= 0.01) return null;
  return (
    <g
      opacity={opacity}
      transform={`translate(${x.toFixed(2)}, ${y.toFixed(2)}) scale(${scale.toFixed(4)}) translate(17, 19) rotate(${tiltDeg.toFixed(2)}) translate(-17, -19)`}
    >
      {/* Top & rear handle */}
      <path
        d="M2 5 Q17 -12 32 5"
        fill="none"
        stroke={TOKENS.illo.metalDark}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M2 9 C-8 10 -9 29 2 31"
        fill="none"
        stroke={TOKENS.illo.metalDark}
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* Spout */}
      <path
        d="M31 19 L63 -5 L65 -8"
        fill="none"
        stroke={TOKENS.illo.metalDark}
        strokeWidth="4.8"
        strokeLinecap="round"
      />
      <path
        d="M31 19 L63 -5"
        fill="none"
        stroke={TOKENS.illo.metal}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Sprinkler rose */}
      <ellipse
        cx="64.5"
        cy="-6"
        rx="4.8"
        ry="3.6"
        transform="rotate(35 64.5 -6)"
        fill={TOKENS.illo.metalDark}
      />
      {/* Can body */}
      <rect
        x="0"
        y="0"
        width="34"
        height="38"
        rx="7.5"
        fill={TOKENS.illo.metal}
        stroke={TOKENS.illo.metalDark}
        strokeWidth="2"
      />
      <rect x="4" y="4" width="4" height="30" rx="2" fill={TOKENS.surface} opacity={0.3} />
    </g>
  );
}

/**
 * Metal bucket on the right of the bin (FAQ 3).
 * Clipped rising water stays strictly inside the trapezoidal walls with dynamic ripples.
 */
export function Bucket({
  idPrefix,
  cx = 274,
  bottomY = 262,
  fillFraction = 0,
  ripplePhase = 0,
  opacity = 1,
  scale = 1,
}: {
  idPrefix: string;
  cx?: number;
  bottomY?: number;
  fillFraction?: number;
  ripplePhase?: number;
  opacity?: number;
  scale?: number;
}) {
  if (opacity <= 0.01) return null;
  const topY = bottomY - 62;
  const clipId = `${idPrefix}-bucket-clip`;
  const clampedFill = Math.max(0, Math.min(0.86, fillFraction));
  const waterTopY = bottomY - clampedFill * 56;
  const waterWidthHalf = 20 + (bottomY - waterTopY) * (8 / 62);
  const ripplePulse = Math.sin(ripplePhase) * 1.4;

  return (
    <g
      opacity={opacity}
      transform={`translate(${cx}, ${bottomY}) scale(${scale.toFixed(4)}) translate(${-cx}, ${-bottomY})`}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={`M${cx - 28} ${topY} L${cx + 28} ${topY} L${cx + 20} ${bottomY} L${cx - 20} ${bottomY} Z`} />
        </clipPath>
      </defs>

      {/* Shadow */}
      <ellipse cx={cx} cy={bottomY + 2} rx="27" ry="4" fill={TOKENS.border} />

      {/* Back rim interior */}
      <ellipse
        cx={cx}
        cy={topY}
        rx="28"
        ry="5.8"
        fill={TOKENS.illo.waterPale}
        stroke={TOKENS.illo.metalDark}
        strokeWidth="1.6"
      />

      {/* Bucket outer body behind front rim */}
      <path
        d={`M${cx - 28} ${topY} L${cx + 28} ${topY} L${cx + 20} ${bottomY} L${cx - 20} ${bottomY} Z`}
        fill={TOKENS.illo.metal}
        stroke={TOKENS.illo.metalDark}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Clipped water volume inside bucket */}
      <g clipPath={`url(#${clipId})`}>
        {clampedFill > 0.01 && (
          <>
            <rect
              x={cx - 30}
              y={waterTopY}
              width="60"
              height={bottomY - waterTopY + 4}
              fill={TOKENS.illo.water}
              opacity={0.85}
            />
            <ellipse
              cx={cx}
              cy={waterTopY}
              rx={waterWidthHalf}
              ry={3.2}
              fill={TOKENS.illo.waterLight}
              opacity={0.95}
            />
            <ellipse
              cx={cx}
              cy={waterTopY}
              rx={Math.max(4, 7 + ripplePulse * 3)}
              ry={1.5}
              fill={TOKENS.surface}
              opacity={0.45}
            />
          </>
        )}
      </g>

      {/* Bucket specular band & ribs */}
      <path
        d={`M${cx - 19} ${topY + 6} L${cx - 13} ${bottomY - 4} L${cx - 9} ${bottomY - 4} L${cx - 14} ${topY + 6} Z`}
        fill={TOKENS.surface}
        opacity={0.22}
      />
      <path
        d={`M${cx - 28} ${topY} L${cx + 28} ${topY} L${cx + 20} ${bottomY} L${cx - 20} ${bottomY} Z`}
        fill="none"
        stroke={TOKENS.illo.metalDark}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Front rim highlight */}
      <path
        d={`M${cx - 28} ${topY} Q${cx} ${topY + 7} ${cx + 28} ${topY}`}
        fill="none"
        stroke={TOKENS.illo.metalDark}
        strokeWidth="2"
      />
    </g>
  );
}

/** Fruit fly with rapid wing-beat oscillation and coherent body orientation. */
export function FruitFly({
  x,
  y,
  wingPhase = 0,
  tiltDeg = 0,
  opacity = 1,
}: {
  x: number;
  y: number;
  wingPhase?: number;
  tiltDeg?: number;
  opacity?: number;
}) {
  if (opacity <= 0.01) return null;
  const wingSpread = 0.65 + 0.35 * Math.sin(wingPhase);
  return (
    <g
      opacity={opacity}
      transform={`translate(${x.toFixed(2)}, ${y.toFixed(2)}) rotate(${tiltDeg.toFixed(2)})`}
    >
      {/* Left & right translucent wings */}
      <ellipse
        cx="-2.2"
        cy="-2.8"
        rx="3.4"
        ry={(4.6 * wingSpread).toFixed(2)}
        transform="rotate(-24 -2.2 -2.8)"
        fill={TOKENS.illo.flyWing}
        stroke={TOKENS.illo.metalDark}
        strokeWidth="0.45"
        opacity={0.88}
      />
      <ellipse
        cx="2.2"
        cy="-2.8"
        rx="3.4"
        ry={(4.6 * wingSpread).toFixed(2)}
        transform="rotate(24 2.2 -2.8)"
        fill={TOKENS.illo.flyWing}
        stroke={TOKENS.illo.metalDark}
        strokeWidth="0.45"
        opacity={0.88}
      />
      {/* Thorax + abdomen */}
      <ellipse cx="0" cy="1.8" rx="3.1" ry="2.1" fill={TOKENS.illo.flyBody} />
      <circle cx="2.7" cy="1.4" r="1.3" fill={TOKENS.illo.flyBody} />
    </g>
  );
}

/** Segmented maggot with gentle peristaltic wiggle. */
export function Maggot({
  x,
  y,
  w = 9,
  stretchX = 1,
  opacity = 1,
}: {
  x: number;
  y: number;
  w?: number;
  stretchX?: number;
  opacity?: number;
}) {
  if (opacity <= 0.01) return null;
  const cx = x + w / 2;
  const cy = y + 2;
  const sy = 1 / Math.sqrt(Math.max(0.7, stretchX));
  return (
    <g
      opacity={opacity}
      transform={`translate(${cx.toFixed(2)}, ${cy.toFixed(2)}) scale(${stretchX.toFixed(4)}, ${sy.toFixed(4)}) translate(${-cx.toFixed(2)}, ${-cy.toFixed(2)})`}
    >
      <rect
        x={x}
        y={y}
        width={w}
        height="4.2"
        rx="2.1"
        fill={TOKENS.illo.branLight}
        stroke={TOKENS.brown}
        strokeWidth="0.85"
      />
      <path
        d={`M${x + w * 0.35} ${y + 0.6} V${y + 3.6} M${x + w * 0.66} ${y + 0.6} V${y + 3.6}`}
        stroke={TOKENS.brown}
        strokeWidth="0.65"
        opacity={0.55}
      />
    </g>
  );
}

/** Dimension bracket on the left of the bin (`10–20%`, `~70%`). */
export function Bracket({
  x,
  y1,
  y2,
  text,
  gap = 7,
  highlight = false,
}: {
  x: number;
  y1: number;
  y2: number;
  text: string;
  gap?: number;
  highlight?: boolean;
}) {
  const stroke = highlight ? TOKENS.accent : TOKENS.muted;
  const fill = highlight ? TOKENS.accentDark : TOKENS.illo.label;
  return (
    <g>
      <path
        d={`M${x + gap} ${y1} L${x} ${y1} L${x} ${y2} L${x + gap} ${y2}`}
        fill="none"
        stroke={stroke}
        strokeWidth={highlight ? "1.6" : "1.2"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x={x - 4}
        y={(y1 + y2) / 2 + 3.5}
        textAnchor="end"
        fontSize="10"
        fontWeight={highlight ? "700" : "500"}
        fill={fill}
      >
        {text}
      </text>
    </g>
  );
}

/** Leader line + 1..N text lines (`vùng hở`, `Dịch dềnh / quá mặt lon`, `Pha loãng / ~1:100`). */
export function LeaderLabel({
  from,
  to,
  lines,
  anchor = "start",
  opacity = 1,
}: {
  from: readonly [number, number];
  to: readonly [number, number];
  lines: readonly string[];
  anchor?: "start" | "end";
  opacity?: number;
}) {
  if (opacity <= 0.01) return null;
  const top = to[1] - (lines.length - 1) * 6;
  return (
    <g opacity={opacity} fontSize="10" fontWeight="500">
      <circle cx={from[0]} cy={from[1]} r="1.6" fill={TOKENS.muted} />
      <path
        d={`M${from[0]} ${from[1]} L${to[0]} ${to[1]}`}
        stroke={TOKENS.muted}
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      {lines.map((t, i) => (
        <text
          key={t}
          x={to[0] + (anchor === "start" ? 3 : -3)}
          y={top + i * 12 + 3.5}
          textAnchor={anchor}
          fill={TOKENS.illo.label}
        >
          {t}
        </text>
      ))}
    </g>
  );
}

/** Full compacted rubbish body used across FAQ 1–3 (`y=82..226`, compressed smoothly by `topOffset`). */
export function RubbishBody({
  patternId,
  topY = 82,
  topLineWidth = 180,
}: {
  patternId: string;
  topY?: number;
  topLineWidth?: number;
}) {
  const height = Math.max(0, 226 - topY);
  return (
    <g>
      <rect x="70" y={topY} width="180" height={height} fill={`url(#${patternId})`} />
      {[190, 154, 118].map((y) => (
        <rect key={y} x="70" y={y} width="180" height="2.5" fill={TOKENS.illo.cardboardLine} />
      ))}
      <rect x="70" y={topY} width={topLineWidth} height="2.5" fill={TOKENS.illo.cardboardLine} />
    </g>
  );
}

/** Accent direction arrow used when smoothing plastic bag or pressing down. */
export function MotionArrow({
  x1,
  y1,
  x2,
  y2,
  color = TOKENS.accent,
  opacity = 1,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  opacity?: number;
}) {
  if (opacity <= 0.01) return null;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const head = 5;
  const px = -uy;
  const py = ux;
  const ax1 = x2 - ux * head + px * head * 0.85;
  const ay1 = y2 - uy * head + py * head * 0.85;
  const ax2 = x2 - ux * head - px * head * 0.85;
  const ay2 = y2 - uy * head - py * head * 0.85;

  return (
    <g
      opacity={opacity}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={`M${x1.toFixed(2)} ${y1.toFixed(2)} L${x2.toFixed(2)} ${y2.toFixed(2)}`} />
      <path d={`M${ax1.toFixed(2)} ${ay1.toFixed(2)} L${x2.toFixed(2)} ${y2.toFixed(2)} L${ax2.toFixed(2)} ${ay2.toFixed(2)}`} />
    </g>
  );
}
