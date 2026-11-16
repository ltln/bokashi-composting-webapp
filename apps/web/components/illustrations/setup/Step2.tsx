import { BinBase, useSvgId } from "../BinBase";
import { OrganicPattern } from "./OrganicPattern";
import type { StepIllustrationProps } from "./types";

/** EM powder grains falling from the bottle. [cx, cy, delay s] */
const GRAINS = [
  [120, 112, 0], [138, 113, 0.3], [156, 112, 0.9], [172, 113, 0.5], [190, 112, 1.2],
  [206, 113, 0.2], [146, 112, 1.5], [198, 113, 0.8], [128, 113, 1.1], [214, 112, 1.4],
] as const;
/** Chopped scraps falling onto layer 2 (sub-step 0). [x, y, w, delay s, class] */
const SCRAPS = [
  [108, 146, 9, 0, "fill-bk-illo-organic-leaf"], [136, 147, 7, 0.4, "fill-bk-illo-organic-peel"],
  [160, 146, 9, 0.9, "fill-bk-illo-organic-green"], [186, 147, 7, 0.2, "fill-bk-illo-organic-peel"],
  [208, 146, 9, 0.7, "fill-bk-illo-organic-leaf"], [122, 148, 6, 1.2, "fill-bk-illo-bran"],
  [174, 148, 6, 1.4, "fill-bk-illo-bran"],
] as const;

/**
 * Step 2, "Cơ chất nạp theo lớp" (Step2 board). Two compacted layers are always
 * there; sub-steps: 0 chopped scraps fall onto layer 2, 1 the third layer
 * spreads out (3–5 cm), 2 EM powder is sprinkled from the shaking bottle,
 * 3 a press plate compacts the layer, with the dashed slot for the next one.
 */
export function Step2({ active, paused, label }: StepIllustrationProps) {
  const patternId = `${useSvgId()}-org`;
  const fill = `url(#${patternId})`;
  return (
    <BinBase
      label={label}
      paused={paused}
      newspaper
      cardboard
      canTabs={false}
      outside={
        <defs>
          <OrganicPattern id={patternId} />
        </defs>
      }
      overlay={
        <>
          {active === 2 && (
            <g className="motion-safe:animate-shake" style={{ transformOrigin: "226px 30px" }}>
              <rect x="214" y="12" width="24" height="36" rx="6" fill="#F3E5B8" strokeWidth="1.2" className="stroke-bk-brown" />
              <rect x="217" y="6" width="18" height="8" rx="2" className="fill-bk-primary" />
              <text x="226" y="34" textAnchor="middle" fontSize="9" fontWeight="700" className="fill-bk-brown-dark">EM</text>
            </g>
          )}
          <path d="M66 82 L59 82 L59 226 L66 226" fill="none" strokeWidth="1.2" className="stroke-bk-muted" />
          <text x="55" y="152" textAnchor="end" fontSize="10" className="fill-bk-illo-label">~70%</text>
          <path d="M252 154 L262 154 M252 190 L262 190 M257 154 L257 190" fill="none" strokeWidth="1.2" className="stroke-bk-muted" />
          <text x="265" y="170" fontSize="10" className="fill-bk-illo-label">3–5</text>
          <text x="265" y="182" fontSize="10" className="fill-bk-illo-label">cm</text>
        </>
      }
    >
      <rect x="70" y="190" width="180" height="36" fill={fill} />
      <rect x="70" y="190" width="180" height="2.5" className="fill-bk-illo-cardboard-line" />
      <rect x="70" y="154" width="180" height="36" fill={fill} />
      <rect x="70" y="154" width="180" height="2.5" className="fill-bk-illo-cardboard-line" />

      {active === 0 && (
        <g>
          {SCRAPS.map(([x, y, w, delay, cls], i) => (
            <rect
              key={i}
              x={x}
              y={y}
              width={w}
              height="4"
              rx="1.5"
              className={`${cls} motion-safe:animate-sprinkle`}
              style={delay ? { animationDelay: `${delay}s` } : undefined}
            />
          ))}
        </g>
      )}

      {active >= 1 && (
        <g
          className={active === 1 ? "motion-safe:animate-spread" : undefined}
          style={active === 1 ? { transformBox: "fill-box", transformOrigin: "bottom" } : undefined}
          opacity={active >= 2 ? 0.92 : undefined}
        >
          <rect x="70" y="114" width="180" height="40" fill={fill} />
          <rect x="70" y="112" width="180" height="2.5" opacity="0.6" className="fill-bk-illo-cardboard-line" />
        </g>
      )}

      {active === 2 && (
        <g className="fill-bk-illo-cardboard-line">
          {GRAINS.map(([cx, cy, delay], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="1.6"
              className="motion-safe:animate-sprinkle"
              style={delay ? { animationDelay: `${delay}s` } : undefined}
            />
          ))}
        </g>
      )}

      {active === 3 && (
        <g className="motion-safe:animate-press">
          <rect x="96" y="104" width="128" height="8" rx="3" className="fill-bk-brown" />
          <rect x="150" y="90" width="20" height="14" rx="3" className="fill-bk-brown-dark" />
        </g>
      )}
      {active >= 2 && (
        <rect x="70" y="82" width="180" height="32" fill="none" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" className="stroke-bk-muted" />
      )}
    </BinBase>
  );
}
