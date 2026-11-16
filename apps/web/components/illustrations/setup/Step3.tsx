import { BinBase, useSvgId } from "../BinBase";
import { OrganicPattern } from "./OrganicPattern";
import type { StepIllustrationProps } from "./types";

/** Air bubbles squeezed out sideways. [cx, cy, rx, ry, dir, delay s] */
const BUBBLES = [
  [140, 77, 6, 3.5, "L", 0], [118, 78, 4, 2.5, "L", 0.5],
  [178, 77, 6, 3.5, "R", 0.2], [200, 78, 4, 2.5, "R", 0.8],
] as const;

/**
 * Step 3, "Khóa yếm khí" (Step3 board). The bin is full; sub-steps:
 * 0 the plastic bag is laid over the surface, 1 it is smoothed from the
 * centre outwards (hand, arrows, bubbles leaving), 2 the lid closes.
 */
export function Step3({ active, paused, label }: StepIllustrationProps) {
  const patternId = `${useSvgId()}-org`;
  const lidClass =
    active === 0 ? undefined : active === 1 ? "motion-safe:animate-lid" : "motion-safe:animate-lidSeal";
  // Static (reduced motion / paused-at-final) lid position: raised, raised a little, closed.
  const lidY = active === 0 ? -24 : active === 1 ? -6 : 0;
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
            <path
              d="M68 44 Q76 46 79 58 L80 80 Q160 73 240 80 L241 58 Q244 46 252 44"
              fill="none"
              strokeWidth="2.6"
              strokeLinejoin="round"
              className="stroke-bk-illo-bag"
            />
          </g>
          {active === 1 && (
            <>
              <g fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="stroke-bk-accent">
                <path d="M152 64 L104 64 M110 59 L104 64 L110 69" />
                <path d="M168 64 L216 64 M210 59 L216 64 L210 69" />
              </g>
              <ellipse cx="160" cy="64" rx="7" ry="5" fill="#F2C9A0" stroke="#C98D5B" strokeWidth="1" />
            </>
          )}
        </>
      }
      overlay={
        <>
          <g
            className={lidClass}
            style={{ transform: `translateY(${lidY}px)` }}
          >
            <rect x="62" y="30" width="196" height="12" rx="5" className="fill-bk-primary" />
            <rect x="146" y="24" width="28" height="7" rx="3" fill="#24563A" />
          </g>
          <path d="M66 82 L59 82 L59 226 L66 226" fill="none" strokeWidth="1.2" className="stroke-bk-muted" />
          <text x="55" y="152" textAnchor="end" fontSize="10" className="fill-bk-illo-label">~70%</text>
        </>
      }
    >
      <rect x="70" y="82" width="180" height="144" fill={`url(#${patternId})`} />
      {[190, 154, 118, 82].map((y) => (
        <rect key={y} x="70" y={y} width="180" height="2.5" className="fill-bk-illo-cardboard-line" />
      ))}
      {active === 1 && (
        <g fill="#FFFFFF" strokeWidth="1" stroke="#8CC1D6">
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
