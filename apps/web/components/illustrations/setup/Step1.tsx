import { BinBase } from "../BinBase";
import { Bracket } from "../parts";
import type { StepIllustrationProps } from "./types";

/** Newspaper balls resting on the cans (static). [cx, cy] */
const PAPER_STATIC = [
  [108, 241], [134, 241.5], [160, 241], [186, 241.5], [212, 241],
  [99, 230], [112, 229], [125, 230.5], [138, 229], [151, 230], [164, 229.5], [177, 230],
] as const;
/** Balls that are being dropped into the gaps. [cx, cy, delay s] */
const PAPER_DROP = [[196, 230, 0], [210, 229.5, 0.6], [222, 230, 1.2]] as const;

const BALL = "fill-bk-illo-paper stroke-bk-illo-paper-edge";

type Marker = { cx: number; cy: number; line: [number, number, number, number]; n: number };
const MARKERS: Marker[] = [
  { n: 1, cx: 276, cy: 252, line: [222, 252, 268, 252] },
  { n: 2, cx: 276, cy: 226, line: [214, 230, 268, 226] },
  { n: 3, cx: 276, cy: 152, line: [246, 152, 268, 152] },
];

/**
 * Step 1, "Tầng đáy giả" (Main board). Sub-steps:
 * 0 cans (top row drops in), 1 newspaper balls drop into the gaps,
 * 2 a cardboard sheet settles on top. The numbered callouts turn
 * green (done) → orange (current) → outlined (upcoming).
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
          <g fontSize="10" fontWeight="700" textAnchor="middle">
            {MARKERS.map((m) => {
              const state = m.n - 1 < active ? "done" : m.n - 1 === active ? "current" : "upcoming";
              const [x1, y1, x2, y2] = m.line;
              return (
                <g key={m.n}>
                  <path
                    d={`M${x1} ${y1} L${x2} ${y2}`}
                    strokeWidth="1"
                    strokeDasharray={state === "upcoming" ? "2 2" : undefined}
                    className={state === "done" ? "stroke-bk-primary" : state === "current" ? "stroke-bk-accent" : "stroke-bk-brown"}
                  />
                  <circle
                    cx={m.cx}
                    cy={m.cy}
                    r="8"
                    className={
                      state === "done"
                        ? "fill-bk-primary"
                        : state === "current"
                          ? "fill-bk-accent"
                          : "fill-bk-surface stroke-bk-brown"
                    }
                  />
                  <text
                    x={m.cx}
                    y={m.cy + 3.5}
                    className={state === "upcoming" ? "fill-bk-brown-dark" : "fill-bk-surface"}
                  >
                    {m.n}
                  </text>
                </g>
              );
            })}
          </g>
        </>
      }
    >
      {active >= 1 && (
        <g>
          <g strokeWidth="0.9" className={BALL}>
            {PAPER_STATIC.map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="4.5" />
            ))}
          </g>
          {PAPER_DROP.map(([cx, cy, delay], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="4.5"
              strokeWidth="0.9"
              className={`${BALL} ${active === 1 ? "motion-safe:animate-drop" : ""}`}
              style={delay ? { animationDelay: `${delay}s` } : undefined}
            />
          ))}
        </g>
      )}
      {active === 1 && (
        <>
          <g className="motion-safe:animate-hover" opacity="0.55">
            <rect x="74" y="150" width="172" height="5" rx="1.5" fill="none" strokeWidth="1.4" strokeDasharray="4 3" className="stroke-bk-brown" />
          </g>
          <path d="M160 162 L160 210 M154 204 L160 211 L166 204" fill="none" strokeWidth="1.4" strokeDasharray="3 3" opacity="0.6" className="stroke-bk-brown" />
        </>
      )}
      {active >= 2 && (
        <g className={active === 2 ? "motion-safe:animate-settle" : undefined}>
          <rect x="74" y="219" width="172" height="5" rx="1.5" strokeWidth="1" className="fill-bk-illo-cardboard stroke-bk-brown" />
        </g>
      )}
    </BinBase>
  );
}
