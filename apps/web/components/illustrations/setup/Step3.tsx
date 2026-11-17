import { BinBase, useSvgId } from "../BinBase";
import { BagCollar, Bracket, Callout, Hand, Lid } from "../parts";
import { delay } from "../faq/shared";
import { OrganicPattern } from "./OrganicPattern";
import type { StepIllustrationProps } from "./types";

/** Air still trapped under the bag near the right wall, drifting out. [cx, cy, rx, ry, delay s] */
const TRAPPED = [[225, 75.5, 4, 2.6, 0], [232, 76.5, 3, 2, 0.7]] as const;
/** Air escaping over the rim. [cx, r, delay s] */
const PUFFS = [[246, 2.6, 0], [251, 2, 0.6], [243, 1.8, 1.2]] as const;

/**
 * Step 3, "Khóa yếm khí" (Step3 board). The bin is full; sub-steps:
 * 0 the plastic bag is laid over the surface; 1 a hand smooths it from the
 * centre to the wall: the left half already lies flat, the trapped bubbles
 * drift right and escape over the rim; 2 the lid closes on the flat bag.
 */
export function Step3({ active, paused, label }: StepIllustrationProps) {
  const patternId = `${useSvgId()}-org`;
  const smoothing = active === 1;
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
          {active === 0 && (
            <g className="motion-safe:animate-hover">
              <BagCollar state="open" />
            </g>
          )}
          {smoothing && (
            <>
              <BagCollar state="smoothing" strong />
              <g className="motion-safe:animate-nudge">
                <Hand cx={183} cy={67.5} scale={0.6} />
              </g>
              <path
                d="M186 40 L228 40 M222 35 L228 40 L222 45"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="stroke-bk-accent"
              />
            </>
          )}
          {active === 2 && <BagCollar state="flat" />}
        </>
      }
      overlay={
        <>
          <Lid state={active === 2 ? "sealing" : "open"} />
          <Bracket x={59} y1={82} y2={226} text="~70%" />
          {smoothing && (
            <>
              <g fill="none" strokeWidth="1.3" className="stroke-bk-illo-bag-strong">
                {PUFFS.map(([cx, r, d]) => (
                  <circle key={cx} cx={cx} cy="38" r={r} className="motion-safe:animate-puff" style={delay(d)} />
                ))}
              </g>
              <text x="207" y="32" textAnchor="middle" fontSize="10" fontWeight="700" className="fill-bk-accent-dark">
                Miết ra mép
              </text>
              <text x="160" y="97" textAnchor="middle" fontSize="9" fontWeight="600" className="fill-bk-surface">
                miết từ tâm ra hai bên
              </text>
              <Callout path="M75 50 L52 40" at={[48, 38]} anchor="end" plain title="Túi nilon" />
              <Callout path="M112 80 L52 74" at={[48, 70]} anchor="end" plain title="Đã miết" sub="phẳng" />
              <Callout path="M230 77 L261 92" at={[263, 96]} plain title="Bọt khí" sub="còn kẹt" />
              <Callout path="M252 30 L261 22" at={[263, 17]} plain title="Khí thoát" sub="ra ngoài" />
            </>
          )}
        </>
      }
    >
      <rect x="70" y="82" width="180" height="144" fill={`url(#${patternId})`} />
      {[190, 154, 118, 82].map((y) => (
        <rect key={y} x="70" y={y} width="180" height="2.5" className="fill-bk-illo-cardboard-line" />
      ))}
      {active === 0 && (
        <g className="motion-safe:animate-settle">
          <path d="M80 80 C120 74 200 74 240 80 L240 88 C200 82 120 82 80 88 Z" className="fill-bk-illo-water-pale" opacity="0.95" />
          <path d="M92 84 Q160 78 228 84" fill="none" strokeWidth="1.2" className="stroke-bk-illo-bag" opacity="0.7" />
        </g>
      )}
      {smoothing && (
        <g strokeWidth="1.1" className="fill-bk-surface stroke-bk-illo-bag-strong">
          {TRAPPED.map(([cx, cy, rx, ry, d]) => (
            <ellipse key={cx} cx={cx} cy={cy} rx={rx} ry={ry} className="motion-safe:animate-drift" style={delay(d)} />
          ))}
        </g>
      )}
    </BinBase>
  );
}
