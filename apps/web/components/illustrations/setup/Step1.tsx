import { BinBase } from "../BinBase";
import { Bracket, Callout } from "../parts";
import { delay } from "../faq/shared";
import type { StepIllustrationProps } from "./types";

/** Newspaper balls filling the gaps, in the order they drop in. [cx, cy] */
const PAPER = [
  [108, 241], [134, 241.5], [160, 241], [186, 241.5], [212, 241],
  [99, 230], [112, 229], [125, 230.5], [138, 229], [151, 230], [164, 229.5], [177, 230],
  [190, 229], [203, 230], [216, 229.5],
] as const;

const BALL = "fill-bk-illo-paper stroke-bk-illo-paper-edge";

/** Fade-in for a callout `s` seconds into the sub-step that introduces it. */
const fadeIn = (now: boolean, s: number) =>
  now ? { className: "motion-safe:animate-fadeIn", style: delay(s) } : {};

/**
 * Step 1, "Tầng đáy giả" (Main board). One sequence per sub-step:
 * 0 the cans fall in one by one, turning from upright to lying flat;
 * 1 newspaper balls drop into the gaps one by one; 2 the cardboard sheet
 * settles on top and a dashed outline marks the finished false bottom.
 * Each part's callout fades in once it has landed. Every animation plays
 * once (the player's epoch key replays them).
 */
export function Step1({ active, paused, label }: StepIllustrationProps) {
  return (
    <BinBase
      label={label}
      paused={paused}
      cans={active === 0 ? "drop" : "static"}
      overlay={
        <>
          <Bracket x={59} y1={229} y2={262} text="10–20%" />
          <Callout
            path="M222 253 L258 262"
            at={[261, 260]}
            title="Lon nhôm"
            sub="bóp dẹp"
            titleClassName="fill-bk-primary-dark"
            {...fadeIn(active === 0, 0.86)}
          />
          {active >= 1 && (
            <Callout
              path="M220 236 L258 236"
              at={[261, 232]}
              title="Giấy báo"
              sub="vo viên"
              titleClassName="fill-bk-accent-dark"
              {...fadeIn(active === 1, 0.61)}
            />
          )}
          {active >= 2 && (
            <Callout
              path="M224 228 L258 206"
              at={[261, 204]}
              title="Bìa carton"
              sub="phủ lên trên"
              titleClassName="fill-bk-brown-dark"
              {...fadeIn(active === 2, 0.96)}
            />
          )}
          {/* Inset: an upright can is crushed flat before it goes in. */}
          <g>
            <rect x="2" y="10" width="58" height="46" rx="10" className="fill-bk-surface" />
            <rect x="8" y="18" width="9" height="20" rx="3" className="fill-bk-illo-can-red" />
            <rect x="8" y="18" width="9" height="3" rx="1.5" className="fill-bk-illo-can-rim" />
            <path
              d="M21 28 L30 28 M26.5 24.5 L30 28 L26.5 31.5"
              fill="none"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="stroke-bk-accent"
            />
            <rect x="33" y="25" width="22" height="7" rx="3" className="fill-bk-illo-can-red" />
            <rect x="33" y="25" width="3" height="7" rx="1.5" className="fill-bk-illo-can-rim" />
            <rect x="52" y="25" width="3" height="7" rx="1.5" className="fill-bk-illo-can-rim" />
            <text x="31" y="51" textAnchor="middle" fontSize="9.5" fontWeight="600" className="fill-bk-illo-label">
              bóp dẹp
            </text>
          </g>
        </>
      }
    >
      {active >= 1 && (
        <g strokeWidth="0.9" className={BALL}>
          {PAPER.map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="4.5"
              className={active === 1 ? "motion-safe:animate-ballIn" : undefined}
              style={active === 1 ? delay(0.15 + i * 0.19) : undefined}
            />
          ))}
        </g>
      )}
      {active >= 2 && (
        <>
          <g className={active === 2 ? "motion-safe:animate-cartonIn" : undefined} style={active === 2 ? delay(0.14) : undefined}>
            <rect x="70" y="225.5" width="180" height="5" className="fill-bk-illo-cardboard" />
            <path d="M70 228 L250 228" strokeWidth="0.8" strokeDasharray="3 2" className="stroke-bk-brown" />
          </g>
          <rect
            x="88"
            y="223"
            width="144"
            height="36"
            rx="6"
            fill="none"
            strokeWidth="1.8"
            strokeDasharray="5 3"
            className={`stroke-bk-primary ${active === 2 ? "motion-safe:animate-fadeIn" : ""}`}
            style={active === 2 ? delay(1.36) : undefined}
          />
        </>
      )}
    </BinBase>
  );
}
