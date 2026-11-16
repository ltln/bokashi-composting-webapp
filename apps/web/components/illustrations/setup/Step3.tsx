import { BinBase, useSvgId } from "../BinBase";
import { BagCollar, Bracket, Lid } from "../parts";
import { OrganicPattern } from "./OrganicPattern";
import type { StepIllustrationProps } from "./types";

/** Air bubbles squeezed out sideways. [cx, cy, rx, ry, dir, delay s] */
const BUBBLES = [
  [140, 87, 6, 3.5, "L", 0], [118, 88, 4, 2.5, "L", 0.5],
  [178, 87, 6, 3.5, "R", 0.2], [200, 88, 4, 2.5, "R", 0.8],
] as const;

/**
 * Step 3, "Khóa yếm khí" (Step3 board). The bin is full; sub-steps:
 * 0 the plastic bag is laid over the surface, 1 it is smoothed from the
 * centre outwards (hand, arrows, bubbles leaving), 2 the lid closes.
 */
export function Step3({ active, paused, label }: StepIllustrationProps) {
  const patternId = `${useSvgId()}-org`;
  return (
    <BinBase
      label={label}
      paused={paused}
      newspaper
      cardboard
      canTabs={false}
      outside={
        <>
          <defs>
            <OrganicPattern id={patternId} />
          </defs>
          <g className={active === 0 ? "motion-safe:animate-hover" : undefined}>
            <BagCollar state="open" />
          </g>
          {active === 1 && (
            <>
              <g fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="stroke-bk-accent">
                <path d="M152 64 L104 64 M110 59 L104 64 L110 69" />
                <path d="M168 64 L216 64 M210 59 L216 64 L210 69" />
              </g>
              <ellipse cx="160" cy="64" rx="7" ry="5" strokeWidth="1" className="fill-bk-illo-skin stroke-bk-illo-skin-line" />
            </>
          )}
        </>
      }
      overlay={
        <>
          <Lid state={active === 2 ? "sealing" : "open"} />
          <Bracket x={59} y1={82} y2={226} text="~70%" />
        </>
      }
    >
      <rect x="70" y="82" width="180" height="144" fill={`url(#${patternId})`} />
      {[190, 154, 118, 82].map((y) => (
        <rect key={y} x="70" y={y} width="180" height="2.5" className="fill-bk-illo-cardboard-line" />
      ))}
      <g className={active === 0 ? "motion-safe:animate-settle" : undefined}>
        <path d="M80 80 C120 74 200 74 240 80 L240 88 C200 82 120 82 80 88 Z" className="fill-bk-illo-water-pale" opacity="0.95" />
        <path d="M92 84 Q160 78 228 84" fill="none" strokeWidth="1.2" className="stroke-bk-illo-bag" opacity="0.7" />
      </g>
      {active === 1 && (
        <g strokeWidth="1" className="fill-bk-surface stroke-bk-illo-bag">
          {BUBBLES.map(([cx, cy, rx, ry, dir, delay], i) => (
            <ellipse
              key={i}
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              className={dir === "L" ? "motion-safe:animate-outL" : "motion-safe:animate-outR"}
              style={delay ? { animationDelay: `${delay}s` } : undefined}
            />
          ))}
        </g>
      )}
    </BinBase>
  );
}
