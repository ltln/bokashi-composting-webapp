import { BinBase, useSvgId } from "../BinBase";
import { OrganicPattern } from "../setup/OrganicPattern";
import type { StepIllustrationProps } from "../setup/types";
import { cn } from "@/lib/cn";
import { LeaderLabel, Lid, PotSprout, WateringCan } from "../parts";
import { RubbishBody, delay } from "./shared";

/** Liquid drops seeping down through the rubbish. [x, y, delay s] */
const DROPS = [[118, 132, 0], [150, 128, 0.7], [182, 134, 1.3], [206, 126, 1.9]] as const;
/** Paper balls already in the bin (cy offset by the board). [cx, cy] */
const BASE_BALLS = [[108, 241], [134, 241.5], [160, 241], [186, 241.5], [212, 241]] as const;

/**
 * FAQ 3, "Đọng dịch rỉ". Sub-steps: 0 open the lid and check — leachate pools
 * above the false bottom ("Dịch dềnh quá mặt lon"), 1 the bin tilts and the
 * excess leachate pours through the rim into a bucket whose water level rises,
 * 2 the bucket is gone: a watering can pours the diluted (~1:100) leachate
 * onto a potted sprout.
 */
export function Faq3({ active, paused, label }: StepIllustrationProps) {
  const patternId = `${useSvgId()}-org`;
  return (
    <div className="relative h-full w-full">
      {/* Tilt (origin = bin floor) only while pouring; 0.78 keeps the rotated 300×262 SVG inside the canvas. */}
      <div
        className={cn(
          "relative h-full w-full origin-bottom",
          active === 1 && "motion-safe:animate-tilt",
          active === 2 && "motion-safe:animate-untilt",
        )}
      >
        <BinBase
          label={label}
          paused={paused}
          newspaper
          newspaperClassName="fill-bk-illo-water-pale"
          underlay={
            <rect
              x="70"
              y="248"
              width="180"
              height="12"
              opacity="0.55"
              className={cn("fill-bk-illo-water transition-none", active >= 1 && "motion-safe:animate-drain")}
              style={{ transformBox: "fill-box", transformOrigin: "bottom" }}
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
              <Lid state={active === 2 ? "sealed" : "open"} />
              {active === 0 && (
                <>
                  <rect
                    x="88"
                    y="224"
                    width="144"
                    height="36"
                    rx="6"
                    fill="none"
                    strokeWidth="1.6"
                    strokeDasharray="5 3"
                    className="stroke-bk-illo-water motion-safe:animate-pulse"
                  />
                  <LeaderLabel from={[232, 242]} to={[258, 226]} lines={["Dịch dềnh", "quá mặt lon"]} />
                </>
              )}
            </>
          }
        >
          <g strokeWidth="0.9" className="fill-bk-illo-metal stroke-bk-illo-metal-dark">
            {BASE_BALLS.map(([cx, cy]) => (
              <circle key={cx} cx={cx} cy={cy} r="4.5" />
            ))}
          </g>
          <RubbishBody fill={`url(#${patternId})`} />
          <rect x="70" y="82" width="180" height="2.5" className="fill-bk-illo-cardboard-line" />
          {active === 0 && (
            <g className="fill-bk-illo-water-light">
              {DROPS.map(([x, y, d]) => (
                <path key={x} d={`M${x} ${y} q3 5 0 7 q-3 -2 0 -7z`} className="motion-safe:animate-seep" style={delay(d)} />
              ))}
            </g>
          )}
        </BinBase>
        {active === 1 && (
          /*
           * The stream lives inside the tilting wrapper (local coords), so it
           * pours from the tilted rim. It waits for the tilt to finish before
           * appearing; the droplets cascade down the arc into the bucket.
           */
          <svg viewBox="0 0 320 280" aria-hidden="true" className="absolute inset-0 h-full w-full">
            <g className="motion-safe:animate-faqDrop" style={delay(0.7)}>
              <path d="M240 52 Q260 96 255 141" fill="none" strokeWidth="5" strokeLinecap="round" className="stroke-bk-illo-water motion-safe:animate-pulse" />
              <g className="fill-bk-illo-water-light">
                <path d="M248 74 q3 5 0 8 q-3 -3 0 -8z" className="motion-safe:animate-fall" />
                <path d="M254 96 q3 5 0 8 q-3 -3 0 -8z" className="motion-safe:animate-fall" style={delay(0.3)} />
                <path d="M256 119 q3 5 0 8 q-3 -3 0 -8z" className="motion-safe:animate-fall" style={delay(0.6)} />
                <path d="M255 136 q3 5 0 8 q-3 -3 0 -8z" className="motion-safe:animate-fall" style={delay(0.9)} />
              </g>
            </g>
          </svg>
        )}
      </div>
      {active === 1 && (
        /* Bucket stands upright beside the bin; its water level rises as the leachate pours in. */
        <svg viewBox="0 0 320 280" aria-hidden="true" className="absolute inset-0 h-full w-full">
          <path d="M228 186 Q252 168 276 186" fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-bk-illo-metal-dark" />
          <ellipse cx="252" cy="186" rx="28" ry="6" strokeWidth="1.5" className="fill-bk-illo-water-pale stroke-bk-illo-metal-dark" />
          <path d="M224 186 L280 186 L272 248 L232 248 Z" strokeWidth="2" strokeLinejoin="round" className="fill-bk-illo-metal stroke-bk-illo-metal-dark" />
          <rect
            x="234"
            y="194"
            width="36"
            height="52"
            opacity="0.8"
            className="fill-bk-illo-water motion-safe:animate-fillUp"
            style={{ animationDelay: "0.7s", transform: "scaleY(.08)", transformBox: "fill-box", transformOrigin: "bottom" }}
          />
          <g className="fill-bk-illo-water-light">
            <path d="M262 174 q3 5 0 8 q-3 -3 0 -8z" className="motion-safe:animate-fall" style={delay(1.0)} />
            <path d="M274 178 q3 5 0 8 q-3 -3 0 -8z" className="motion-safe:animate-fall" style={delay(1.6)} />
          </g>
        </svg>
      )}
      {active === 2 && (
        /* The diluted leachate waters a potted sprout beside the (upright) bin. */
        <svg viewBox="0 0 320 280" aria-hidden="true" className="absolute inset-0 h-full w-full">
          <LeaderLabel from={[262, 122]} to={[266, 98]} lines={["Pha loãng", "~1:100"]} />
          <WateringCan x={220} y={126} pouring />
          <PotSprout x={258} y={208} w={58} />
        </svg>
      )}
    </div>
  );
}
