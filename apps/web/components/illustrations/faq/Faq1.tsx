import { BinBase, useSvgId } from "../BinBase";
import { OrganicPattern } from "../setup/OrganicPattern";
import type { StepIllustrationProps } from "../setup/types";
import { BagCollar, Lid, PressPlate } from "../parts";
import { RubbishBody, delay } from "./shared";

/** EM grains falling from the spoon. [cx, delay s] */
const GRAINS = [[176, 0], [182, 0.35], [188, 0.7], [179, 1], [185, 0.5]] as const;
/** Smell wisps rising from the bag's left opening. [x, y, delay s] */
const WISPS = [[86, 66, 0], [96, 68, 0.9], [106, 66, 1.8]] as const;

/**
 * FAQ 1, "Thùng bốc mùi hôi thối" (Faq1 board). Sub-steps: 0 the lid is off and
 * the bag flipped up (smell wisps rise), 1 a spoon of EM bran is sprinkled
 * (the board's frame), 2 a press plate compacts the rubbish, 3 the bag is
 * smoothed flat and the lid goes on.
 */
export function Faq1({ active, paused, label }: StepIllustrationProps) {
  const patternId = `${useSvgId()}-org`;
  const wisps = active <= 1 ? WISPS : active === 2 ? WISPS.slice(0, 1) : [];
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
          <BagCollar state={active < 3 ? "up" : "flat"} />
          {active === 1 && (
            <g>
              <path d="M252 34 L192 58" strokeWidth="4" strokeLinecap="round" className="stroke-bk-brown" />
              <ellipse cx="183" cy="61" rx="11" ry="5" strokeWidth="1" transform="rotate(-22 183 61)" className="fill-bk-illo-metal stroke-bk-illo-metal-dark" />
              <ellipse cx="183" cy="60" rx="7" ry="2.6" transform="rotate(-22 183 60)" className="fill-bk-illo-cardboard-line" />
            </g>
          )}
          <g fill="none" strokeWidth="2.2" strokeLinecap="round" className="stroke-bk-illo-organic-leaf">
            {wisps.map(([x, y, d]) => (
              <path key={x} d={`M${x} ${y} q-5 -5 0 -10 t0 -10`} className="motion-safe:animate-rise" style={delay(d)} />
            ))}
          </g>
        </>
      }
      overlay={
        <>
          {active === 1 && (
            <g>
              <rect x="214" y="20" width="70" height="20" rx="10" className="fill-bk-accent" />
              <text x="249" y="34" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#FFFFFF">2–3 muỗng</text>
            </g>
          )}
          <Lid state={active === 3 ? "sealing" : "open"} />
        </>
      }
    >
      <RubbishBody fill={`url(#${patternId})`} />
      <rect x="70" y="80" width="180" height="4" className="fill-bk-illo-cardboard-line" />
      {active === 1 && (
        <g className="fill-bk-illo-cardboard-line">
          {GRAINS.map(([cx, d]) => (
            <circle key={cx} cx={cx} cy="76" r="1.8" className="motion-safe:animate-fall" style={delay(d)} />
          ))}
        </g>
      )}
      {active === 2 && <PressPlate y={66} />}
    </BinBase>
  );
}
