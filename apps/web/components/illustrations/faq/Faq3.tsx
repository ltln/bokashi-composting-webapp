import { BinBase, useSvgId } from "../BinBase";
import { OrganicPattern } from "../setup/OrganicPattern";
import type { StepIllustrationProps } from "../setup/types";
import { cn } from "@/lib/cn";
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
 * FAQ 3, "Đọng dịch rỉ". Sub-steps: 0 open the lid and check — leachate pools
 * above the false bottom ("Dịch dềnh quá mặt lon"), 1 the bin tilts and the
 * excess leachate pours through the rim into a bucket standing outside, 2 the
 * bin is upright again: dry paper balls drop in and a wrung-out layer of
 * scraps falls on them.
 */
export function Faq3({ active, paused, label }: StepIllustrationProps) {
  const patternId = `${useSvgId()}-org`;
  return (
    <div className="relative h-full w-full">
      {/* Tilt (origin = bin floor) only while pouring; 0.78 keeps the rotated 300×262 SVG inside the canvas. */}
      <div
        className={cn(
          "h-full w-full origin-bottom transition-transform duration-700",
          active === 1 && "rotate-[10deg] scale-[0.78]",
        )}
      >
        <BinBase
          label={label}
          paused={paused}
          newspaper
          newspaperClassName="fill-[#DCE5EA]"
          underlay={
            <rect
              x="70"
              y="248"
              width="180"
              height="12"
              fill="#4F9BD3"
              opacity="0.55"
              className="transition-transform duration-700"
              style={
                active === 1
                  ? { transform: "scaleY(0.35)", transformBox: "fill-box", transformOrigin: "bottom" }
                  : undefined
              }
            />
          }
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
                <>
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
                  <g fontSize="10" fill="#1F4D6E">
                    <path d="M232 242 L256 230" strokeWidth="1" stroke="#1F5C94" />
                    <text x="258" y="222">Dịch dềnh</text>
                    <text x="258" y="234">quá mặt lon</text>
                  </g>
                </>
              )}
              {active === 2 && (
                <g fontSize="10" fill="#1F4D6E">
                  <path d="M190 76 L256 70" strokeWidth="1" className="stroke-bk-muted" />
                  <text x="258" y="66" className="fill-bk-illo-label">Giấy báo</text>
                  <text x="258" y="78" className="fill-bk-illo-label">khô</text>
                </g>
              )}
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
          {active === 2 && (
            <g fill="#F4F0E6" stroke="#B4AC9C" strokeWidth="0.9">
              {STILL_BALLS.map(([cx, cy]) => (
                <circle key={cx} cx={cx} cy={cy} r="4.5" />
              ))}
              {DROP_BALLS.map(([cx, cy, d]) => (
                <circle key={cx} cx={cx} cy={cy} r="4.5" className="motion-safe:animate-faqDrop" style={delay(d)} />
              ))}
            </g>
          )}
          {active === 2 &&
            SCRAPS.map(([x, d, cls]) => (
              <rect key={x} x={x} y="62" width="9" height="4" rx="1.5" className={`${cls} motion-safe:animate-fall`} style={delay(d)} />
            ))}
        </BinBase>
      </div>
      {active === 1 && (
        <>
          {/* Pour stream from the tilted rim's top-right corner into the bucket. */}
          <svg viewBox="0 0 320 280" aria-hidden="true" className="absolute inset-0 h-full w-full">
            <path d="M276 110 Q296 152 282 202" fill="none" stroke="#4F9BD3" strokeWidth="5" strokeLinecap="round" className="motion-safe:animate-pulse" />
          </svg>
          {/* Bucket stays upright as a sibling of the tilting wrapper. */}
          <svg viewBox="0 0 64 56" aria-hidden="true" className="absolute bottom-[5%] right-[1%] w-[22%]">
            <path d="M10 16 L54 16 L48 52 L16 52 Z" className="fill-bk-illo-bin-wall" stroke="#8597A3" strokeWidth="2" strokeLinejoin="round" />
            <rect x="12" y="18" width="40" height="6" rx="2" fill="#4F9BD3" opacity="0.7" />
            <path d="M14 16 Q32 2 50 16" fill="none" stroke="#8597A3" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </>
      )}
    </div>
  );
}
