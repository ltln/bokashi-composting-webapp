import { BinBase, useSvgId } from "../BinBase";
import { OrganicPattern } from "../setup/OrganicPattern";
import type { StepIllustrationProps } from "../setup/types";
import { BagCollar, Callout, Lid } from "../parts";
import { Fly, RubbishBody, delay } from "./shared";

/** Maggots at the gap in the bag. [x, y, w, delay s] */
const MAGGOTS = [[206, 77, 9, 0], [219, 78, 9, 0.3], [230, 76.5, 8, 0.55]] as const;
/** EM grains falling over the gap. [cx, delay s] */
const GRAINS = [[208, 0], [216, 0.4], [224, 0.8], [232, 0.2], [212, 1.1], [228, 0.6]] as const;
/** Flies around the lid gap. [x, y, delay s] */
const FLIES = [[246, 30, 0], [266, 20, 0.4], [230, 12, 0.8], [280, 40, 0.2]] as const;

/**
 * FAQ 2, "Ruồi giấm và giòi" (Faq2 board). Sub-steps: 0 EM bran is sprinkled
 * over the exposed patch where maggots wiggle (labelled: bag edge lifted,
 * maggots at the gap), flies buzz around the tilted
 * lid (the board's frame), 1 the bag edge is smoothed against the wall (arrow;
 * patch is covered), 2 the lid is checked: it sits flat and the flies stay out.
 */
export function Faq2({ active, paused, label }: StepIllustrationProps) {
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
          <BagCollar state={active === 0 ? "gap" : "lip"} />
          {active === 1 && (
            <g
              fill="none"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="stroke-bk-accent motion-safe:animate-hop"
            >
              <path d="M204 64 L236 64 M230 59 L236 64 L230 69" />
            </g>
          )}
        </>
      }
      overlay={
        <>
          <Lid state={active === 2 ? "sealing" : "ajar"} />
          {FLIES.slice(0, active === 2 ? 2 : 4).map(([x, y, d]) => (
            <g key={x} className="motion-safe:animate-buzz" style={delay(d)}>
              <Fly x={x} y={y} />
            </g>
          ))}
          {active === 0 && (
            <>
              <Callout path="M200 70 L180 62" at={[177, 64]} anchor="end" title="Mép túi bị bong" titleClassName="fill-bk-faq-maggots-fg" />
              <Callout path="M242 82 L262 100" at={[264, 108]} title="Giòi ở" sub="vùng hở" titleClassName="fill-bk-accent-dark" />
            </>
          )}
          <Callout path="M225 10 L232 13" at={[222, 8]} anchor="end" title="Ruồi giấm" />
        </>
      }
    >
      <RubbishBody fill={`url(#${patternId})`} />
      <rect x="70" y="82" width={active === 0 ? 134 : 180} height="2.5" className="fill-bk-illo-cardboard-line" />
      <rect x="202" y="80" width="40" height="5" rx="2" opacity="0.7" className="fill-bk-illo-cardboard-line" />
      {active === 0 && (
        <>
          <g strokeWidth="0.8" className="fill-bk-illo-bran-light stroke-bk-brown">
            {MAGGOTS.map(([x, y, w, d]) => (
              <rect key={x} x={x} y={y} width={w} height="4" rx="2" className="svg-box motion-safe:animate-wiggle" style={delay(d)} />
            ))}
          </g>
          <g className="fill-bk-illo-cardboard-line">
            {GRAINS.map(([cx, d]) => (
              <circle key={cx} cx={cx} cy="74" r="1.8" className="motion-safe:animate-fall" style={delay(d)} />
            ))}
          </g>
        </>
      )}
    </BinBase>
  );
}
