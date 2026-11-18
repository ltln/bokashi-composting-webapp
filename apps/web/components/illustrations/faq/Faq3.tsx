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
      {/*
       * Tilt (origin = bin floor) only while pouring; 0.78 keeps the rotated
       * 300×262 SVG inside the canvas. The same transform is set inline so the
       * reduced-motion final frame is the tilted bin too — otherwise the stream
       * would start in mid-air and miss the bucket.
       */}
      <div
        className={cn(
          "relative h-full w-full origin-bottom",
          active === 1 && "motion-safe:animate-tilt",
          active === 2 && "motion-safe:animate-untilt",
        )}
        style={active === 1 ? { transform: "rotate(10deg) scale(.78)" } : undefined}
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
      </div>
      {active === 1 && (
        /*
         * Bucket on the floor to the right; its water level rises as the
         * leachate pours in. It sits clear of the bin's wall so the stream falls
         * beside the bin instead of running along it.
         */
        <svg viewBox="0 0 320 280" aria-hidden="true" className="absolute inset-0 h-full w-full">
          <ellipse cx="273" cy="263" rx="30" ry="4" className="fill-bk-border" />
          <ellipse cx="273" cy="200" rx="28" ry="6" strokeWidth="1.5" className="fill-bk-illo-water-pale stroke-bk-illo-metal-dark" />
          {/*
           * The stream is drawn in world coords, between the back rim and the
           * bucket body, so it is visible entering the mouth and then disappears
           * behind the front rim. It leaves the tilted lip (the wrapper's
           * rotate(10°) scale(.78) puts it at ~(262, 114)) and drifts right as
           * it falls.
           */}
          <g className="motion-safe:animate-pour">
            <path
              d="M259.7 116.0 L260.3 121.9 L261.2 127.8 L262.2 133.5 L263.1 139.2 L263.9 144.9 L264.5 150.6 L264.9 156.3 L265.1 162.2 L265.3 168.1 L265.8 174.1 L266.5 180.0 L267.4 185.8 L268.4 191.5 L269.6 201.4 L274.9 200.8 L274.2 190.8 L273.6 184.9 L272.9 179.1 L272.1 173.4 L271.6 167.7 L271.2 162.0 L271.1 156.2 L271.2 150.3 L271.2 144.4 L271.0 138.4 L270.5 132.4 L269.8 126.5 L269.0 120.8 L268.3 115.0 Z"
              opacity="0.92"
              className="fill-bk-illo-water-light"
            />
          </g>
          <path d="M245 200 L301 200 L293 262 L253 262 Z" strokeWidth="2" strokeLinejoin="round" className="fill-bk-illo-metal stroke-bk-illo-metal-dark" />
          <rect
            x="255"
            y="202"
            width="36"
            height="58"
            opacity="0.8"
            className="fill-bk-illo-water motion-safe:animate-fillUp"
            style={{ transformBox: "fill-box", transformOrigin: "bottom" }}
          />
          {/* Foam + spray where the stream meets the water. */}
          <g className="motion-safe:animate-pour">
            <ellipse cx="272" cy="198.4" rx="6.5" ry="1.5" opacity="0.8" className="fill-bk-illo-water-light motion-safe:animate-pulse" />
            <g className="fill-bk-illo-water-light">
              <path d="M265 194 q2.2 3.6 0 5.4 q-2.2 -1.8 0 -5.4z" className="motion-safe:animate-fall" />
              <path d="M279 194 q2.2 3.6 0 5.4 q-2.2 -1.8 0 -5.4z" className="motion-safe:animate-fall" style={delay(0.6)} />
            </g>
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
