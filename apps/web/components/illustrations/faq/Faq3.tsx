import { BinBase, useSvgId } from "../BinBase";
import { OrganicPattern } from "../setup/OrganicPattern";
import type { StepIllustrationProps } from "../setup/types";
import { RubbishBody, delay } from "./shared";

/** Liquid drops seeping down through the rubbish. [x, y, delay s] */
const DROPS = [[118, 110, 0], [150, 100, 0.7], [182, 112, 1.3], [206, 104, 1.9]] as const;
/** Paper balls already in the bin (cy offset by the board). [cx, cy] */
const BASE_BALLS = [[108, 241], [134, 241.5], [160, 241], [186, 241.5], [212, 241]] as const;
const STILL_BALLS = [[100, 77], [114, 78], [128, 77], [142, 78]] as const;
/** Paper balls dropping onto the surface. [cx, cy, delay s] */
const DROP_BALLS = [[156, 77, 0], [170, 78, 0.4], [184, 77, 0.8]] as const;
/** Scraps of the next layer. [x, delay s, class] */
const SCRAPS = [
  [108, 0, "fill-bk-illo-organic-leaf"], [136, 0.4, "fill-bk-illo-organic-peel"],
  [160, 0.9, "fill-bk-illo-organic-green"], [186, 0.2, "fill-bk-illo-organic-peel"],
  [208, 0.7, "fill-bk-illo-organic-leaf"],
] as const;

/**
 * FAQ 3, "Đọng dịch rỉ" (Faq3 board). Sub-steps: 0 liquid seeps down and the
 * false bottom (cans + newspaper) soaks it up, 1 dry paper balls are laid on
 * top (the board's frame), 2 the paper stays and a wrung-out layer of scraps
 * falls on it.
 */
export function Faq3({ active, paused, label }: StepIllustrationProps) {
  const patternId = `${useSvgId()}-org`;
  return (
    <BinBase
      label={label}
      paused={paused}
      newspaper
      newspaperClassName="fill-[#DCE5EA]"
      underlay={<rect x="70" y="248" width="180" height="12" fill="#4F9BD3" opacity="0.55" />}
      cardboard
      canTabs={false}
      outside={
        <>
          <defs>
            <OrganicPattern id={patternId} />
          </defs>
          <path d="M68 44 Q70 26 104 22 L190 18" fill="none" strokeWidth="2.6" strokeLinecap="round" className="stroke-bk-illo-bag" />
        </>
      }
      overlay={
        <>
          {active === 0 && (
            <rect
              x="88"
              y="224"
              width="144"
              height="36"
              rx="6"
              fill="none"
              stroke="#1F5C94"
              strokeWidth="1.6"
              strokeDasharray="5 3"
              className="motion-safe:animate-pulse"
            />
          )}
          <g fontSize="10" fill="#1F4D6E">
            <path d="M232 242 L256 230" strokeWidth="1" stroke="#1F5C94" />
            <text x="258" y="222">Đáy giả</text>
            <text x="258" y="234">hút dịch</text>
            {active === 1 && (
              <>
                <path d="M190 76 L256 70" strokeWidth="1" className="stroke-bk-muted" />
                <text x="258" y="66" className="fill-bk-illo-label">Giấy báo</text>
                <text x="258" y="78" className="fill-bk-illo-label">khô</text>
              </>
            )}
          </g>
        </>
      }
    >
      <g fill="#B9C6CF" stroke="#8597A3" strokeWidth="0.9">
        {BASE_BALLS.map(([cx, cy]) => (
          <circle key={cx} cx={cx} cy={cy} r="4.5" />
        ))}
      </g>
      <RubbishBody fill={`url(#${patternId})`} />
      <rect x="70" y="82" width="180" height="2.5" className="fill-bk-illo-cardboard-line" />
      {active <= 1 && (
        <g fill="#6DB3E8">
          {DROPS.map(([x, y, d]) => (
            <path key={x} d={`M${x} ${y} q3 5 0 7 q-3 -2 0 -7z`} className="motion-safe:animate-seep" style={delay(d)} />
          ))}
        </g>
      )}
      {active >= 1 && (
        <g fill="#F4F0E6" stroke="#B4AC9C" strokeWidth="0.9">
          {STILL_BALLS.map(([cx, cy]) => (
            <circle key={cx} cx={cx} cy={cy} r="4.5" />
          ))}
          {DROP_BALLS.map(([cx, cy, d]) => (
            <circle
              key={cx}
              cx={cx}
              cy={cy}
              r="4.5"
              className={active === 1 ? "motion-safe:animate-faqDrop" : undefined}
              style={active === 1 ? delay(d) : undefined}
            />
          ))}
        </g>
      )}
      {active === 2 &&
        SCRAPS.map(([x, d, cls]) => (
          <rect key={x} x={x} y="62" width="9" height="4" rx="1.5" className={`${cls} motion-safe:animate-fall`} style={delay(d)} />
        ))}
    </BinBase>
  );
}
