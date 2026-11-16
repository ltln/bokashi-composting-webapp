import { BinBase, useSvgId } from "../BinBase";
import { OrganicPattern } from "../setup/OrganicPattern";
import type { StepIllustrationProps } from "../setup/types";
import { RubbishBody, delay } from "./shared";

/** EM grains falling from the spoon. [cx, delay s] */
const GRAINS = [[176, 0], [182, 0.35], [188, 0.7], [179, 1], [185, 0.5]] as const;
/** Smell wisps. [x, y, delay s] */
const WISPS = [[104, 40, 0], [124, 42, 0.9], [144, 40, 1.8]] as const;

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
          {active < 3 ? (
            <path d="M68 44 Q70 26 104 22 L190 18" fill="none" strokeWidth="2.6" strokeLinecap="round" className="stroke-bk-illo-bag" />
          ) : (
            <path d="M68 44 Q74 56 80 80 L240 80 Q246 56 252 44" fill="none" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="stroke-bk-illo-bag" />
          )}
          {active === 1 && (
            <g>
              <path d="M252 34 L192 58" strokeWidth="4" strokeLinecap="round" className="stroke-bk-brown" />
              <ellipse cx="183" cy="61" rx="11" ry="5" strokeWidth="1" transform="rotate(-22 183 61)" fill="#CBD2D6" stroke="#8D989E" />
              <ellipse cx="183" cy="60" rx="7" ry="2.6" transform="rotate(-22 183 60)" className="fill-bk-illo-cardboard-line" />
            </g>
          )}
          <g fill="none" strokeWidth="2.2" strokeLinecap="round" stroke="#8FA33A">
            {wisps.map(([x, y, d]) => (
              <path key={x} d={`M${x} ${y} q-5 -5 0 -10 t0 -10`} className="motion-safe:animate-rise" style={delay(d)} />
            ))}
          </g>
        </>
      }
      overlay={
        <>
          {active <= 1 && (
            <g>
              <rect x="266" y="214" width="36" height="48" rx="7" fill="#F3E5B8" strokeWidth="1.2" className="stroke-bk-brown" />
              <rect x="270" y="207" width="28" height="9" rx="3" className="fill-bk-primary" />
              <text x="284" y="243" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-bk-brown-dark">EM</text>
            </g>
          )}
          {active === 1 && (
            <g>
              <rect x="226" y="62" width="70" height="20" rx="10" className="fill-bk-accent" />
              <text x="261" y="76" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#FFFFFF">2–3 muỗng</text>
            </g>
          )}
          {active === 3 && (
            <g className="motion-safe:animate-lidSeal">
              <rect x="62" y="36" width="196" height="12" rx="5" className="fill-bk-primary" />
              <rect x="146" y="30" width="28" height="7" rx="3" className="fill-bk-faq-disposal-fg" />
            </g>
          )}
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
      {active === 2 && (
        <g className="motion-safe:animate-press">
          <rect x="96" y="66" width="128" height="8" rx="3" className="fill-bk-brown" />
          <rect x="150" y="52" width="20" height="14" rx="3" className="fill-bk-brown-dark" />
        </g>
      )}
    </BinBase>
  );
}
