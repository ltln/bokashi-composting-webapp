import { interpolateColors, useCurrentFrame } from "remotion";
import { AluminiumCan, BinRig, CAN_SLOTS, StageCanvas } from "../components/BinRig";
import { VoAudioTrack } from "../components/VoAudioTrack";
import { Bracket, PaperBall } from "../components/props";
import { EASE, clampInterp, createSeededParticles, gravityDrop, segProgress } from "../physics";
import { S1, S2, STEP1_TL, localFrame } from "../timeline";
import { TOKENS } from "../tokens";
import { mapBoardFrame, type BoardLocale } from "../voAlignment";

/** 15 crumpled newspaper balls filling every gap between the 2 rows of cans (natural depth variation). */
const PAPER_BALLS = [
  // Lower gaps between row 0 cans (y ≈ 240.5–242)
  { cx: 109, cy: 241.2, r: 4.7, rot: -18 },
  { cx: 135, cy: 241.8, r: 4.4, rot: 24 },
  { cx: 161, cy: 240.8, r: 4.8, rot: -12 },
  { cx: 187, cy: 241.6, r: 4.5, rot: 32 },
  { cx: 213, cy: 241.0, r: 4.6, rot: -26 },
  // Upper gaps between & over row 1 cans (natural height & radius variation)
  { cx: 97.5, cy: 231.4, r: 4.3, rot: 14 },
  { cx: 110.2, cy: 228.9, r: 4.8, rot: -28 },
  { cx: 123.5, cy: 230.9, r: 4.4, rot: 19 },
  { cx: 135.8, cy: 229.1, r: 4.9, rot: -10 },
  { cx: 149.4, cy: 231.2, r: 4.3, rot: 35 },
  { cx: 162.1, cy: 228.8, r: 4.8, rot: -22 },
  { cx: 175.3, cy: 231.0, r: 4.5, rot: 11 },
  { cx: 188.0, cy: 229.2, r: 4.9, rot: -31 },
  { cx: 201.4, cy: 231.1, r: 4.4, rot: 22 },
  { cx: 217.5, cy: 230.6, r: 4.5, rot: -15 },
] as const;

const PAPER_SEEDS = createSeededParticles("step1-paper", PAPER_BALLS.length);

const MARKERS = [
  { n: 1, cx: 276, cy: 252, line: [224, 252, 267, 252] as const },
  { n: 2, cx: 276, cy: 226, line: [216, 230, 267, 226] as const },
  { n: 3, cx: 276, cy: 152, line: [246, 152, 267, 152] as const },
] as const;

export function Step1({ locale = "vi", voiced = false }: { locale?: BoardLocale; voiced?: boolean }) {
  const rawFrame = useCurrentFrame();
  const frame = mapBoardFrame(rawFrame, "Step1", locale, voiced);
  const f1 = localFrame(frame, 1);
  const f2 = localFrame(frame, 2);

  // Subtle newspaper layer fade-in during sub-step 1 + slight squash when cardboard lands in s2
  const newspaperOpacity = clampInterp(
    frame,
    [S1 + STEP1_TL.paperLayerFadeStart, S1 + STEP1_TL.paperLayerFadeEnd],
    [0, 1],
    EASE.smooth,
  );

  // Sub-step 2 cardboard drop + elastic cushion compression
  const cartonDrop = gravityDrop(
    f2,
    STEP1_TL.cartonAnticipationEnd,
    STEP1_TL.cartonImpact - STEP1_TL.cartonAnticipationEnd,
    88,
    221.5,
    {
      bouncePx: 2.2,
      bounceFrames: 24,
      squashAmount: 0.04,
      anticipationPx: 5,
      anticipationFrames: 18,
    },
  );
  const cartonVisible = f2 >= STEP1_TL.cartonEnter;
  const cartonOpacity = cartonVisible
    ? clampInterp(f2, [STEP1_TL.cartonEnter, STEP1_TL.cartonEnter + 16], [0, 1], EASE.out)
    : 0;

  // Cushion compression when cardboard hits paper bed at f2 = cartonImpact
  const impactOffset = f2 - STEP1_TL.cartonImpact;
  const bedCompress =
    impactOffset >= 0 && impactOffset <= 28
      ? Math.sin((impactOffset / 28) * Math.PI) * Math.exp((-2.2 * impactOffset) / 28) * 2.2
      : 0;
  const newspaperSquashY = 1 - bedCompress * 0.025;
  const binSquashY = 1 - bedCompress * 0.004;

  // Hint outline in s1 (frames 270..539) smoothly dissolves before s2
  const hintFadeIn = segProgress(f1, STEP1_TL.cartonHintIn - 16, STEP1_TL.cartonHintIn + 14, EASE.out);
  const hintFadeOut = 1 - segProgress(f1, STEP1_TL.cartonHintOut - 18, STEP1_TL.cartonHintOut + 12, EASE.in);
  const hintOpacity = f1 >= 0 && f2 < 0 ? Math.min(hintFadeIn, hintFadeOut) * 0.65 : 0;
  const hintBob = hintOpacity > 0 ? Math.sin(f1 * 0.1) * 2.2 : 0;

  // Active sub-step index (0, 1, 2) for smooth marker color transition
  const activeStep = frame >= S2 ? 2 : frame >= S1 ? 1 : 0;

  return (
    <>
      <VoAudioTrack boardId="Step1" locale={locale} voiced={voiced} />
      <StageCanvas>
      <BinRig
        idPrefix="step1"
        cans="none"
        newspaperOpacity={newspaperOpacity}
        newspaperSquashY={newspaperSquashY}
        squashY={binSquashY}
        overlay={
          <>
            <Bracket x={59} y1={226} y2={262} text="10–20%" />
            <g fontSize="10" fontWeight="700" textAnchor="middle">
              {MARKERS.map((m) => {
                const idx = m.n - 1;
                const transitionStart = idx * 270;
                // Smoothly blend marker color over 18 frames on step boundaries
                const stateColor =
                  idx < activeStep
                    ? TOKENS.primary
                    : idx === activeStep
                      ? idx === 0
                        ? TOKENS.accent
                        : interpolateColors(
                            clampInterp(frame, [transitionStart, transitionStart + 18], [0, 1], EASE.smooth),
                            [0, 1],
                            [TOKENS.surface, TOKENS.accent],
                          )
                      : TOKENS.surface;
                const doneBlend =
                  idx < activeStep
                    ? clampInterp(frame, [activeStep * 270, activeStep * 270 + 18], [0, 1], EASE.smooth)
                    : idx === 2 && f2 >= STEP1_TL.cartonSettleEnd
                      ? clampInterp(f2, [STEP1_TL.cartonSettleEnd, STEP1_TL.cartonSettleEnd + 22], [0, 1], EASE.smooth)
                      : 0;
                const isComplete = idx < activeStep || (idx === 2 && f2 >= STEP1_TL.cartonSettleEnd);
                const circleFill = isComplete
                  ? interpolateColors(doneBlend, [0, 1], [TOKENS.accent, TOKENS.primary])
                  : stateColor;
                const strokeColor = isComplete
                  ? idx === 2 && f2 < STEP1_TL.cartonSettleEnd + 22
                    ? interpolateColors(doneBlend, [0, 1], [TOKENS.accent, TOKENS.primary])
                    : TOKENS.primary
                  : idx === activeStep
                    ? TOKENS.accent
                    : TOKENS.brown;
                const textFill = idx <= activeStep ? TOKENS.surface : TOKENS.brownDark;
                const [x1, y1, x2, y2] = m.line;
                const pulseScale =
                  idx === activeStep && frame < transitionStart + 26
                    ? 1 + Math.sin(clampInterp(frame, [transitionStart, transitionStart + 26], [0, Math.PI])) * 0.14
                    : 1;

                return (
                  <g key={m.n}>
                    <path
                      d={`M${x1} ${y1} L${x2} ${y2}`}
                      strokeWidth="1.2"
                      strokeDasharray={idx > activeStep ? "2.5 2.5" : undefined}
                      stroke={strokeColor}
                    />
                    <g transform={`translate(${m.cx}, ${m.cy}) scale(${pulseScale.toFixed(4)}) translate(${-m.cx}, ${-m.cy})`}>
                      <circle
                        cx={m.cx}
                        cy={m.cy}
                        r="8"
                        fill={circleFill}
                        stroke={strokeColor}
                        strokeWidth={idx > activeStep ? "1.3" : "1"}
                      />
                      <text x={m.cx} y={m.cy + 3.5} fill={textFill}>
                        {m.n}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          </>
        }
      >
        {/* Sub-step 0: 9 crushed aluminium cans falling into 2 staggered rows */}
        {CAN_SLOTS.map((c, i) => {
          const isRow1 = c.row === 1;
          const start = isRow1
            ? STEP1_TL.canRow1Start + (i - 5) * STEP1_TL.canStagger
            : STEP1_TL.canRow0Start + i * STEP1_TL.canStagger;
          const drop = gravityDrop(frame, start, STEP1_TL.canFallDur, 42, c.y, {
            bouncePx: 3.2,
            bounceFrames: 18,
            squashAmount: 0.12,
            anticipationPx: 3,
            anticipationFrames: 8,
          });
          // Gentle entry tilt that settles flat to 0° upon impact
          const rotTilt =
            drop.landed
              ? 0
              : clampInterp(frame, [start, start + STEP1_TL.canFallDur], [i % 2 === 0 ? -7 : 7, 0], EASE.in);
          return (
            <AluminiumCan
              key={c.id}
              x={c.x}
              y={drop.y + (isRow1 ? bedCompress * 0.35 : 0)}
              fill={c.fill}
              showTabs
              rotation={rotTilt}
              scaleX={drop.scaleX}
              scaleY={drop.scaleY}
              opacity={drop.opacity}
            />
          );
        })}

        {/* Sub-step 1: 15 crumpled newspaper balls filling all gaps */}
        {f1 >= 0 &&
          PAPER_BALLS.map((b, i) => {
            const seed = PAPER_SEEDS[i]!;
            const start = STEP1_TL.paperStart + i * STEP1_TL.paperStagger;
            const drop = gravityDrop(f1, start, STEP1_TL.paperFallDur, 52 + seed.ry * 14, b.cy, {
              bouncePx: 2.5,
              bounceFrames: 15,
              squashAmount: 0.14,
              anticipationPx: 2.5,
              anticipationFrames: 6,
            });
            const spin = drop.landed
              ? b.rot
              : b.rot + clampInterp(f1, [start, start + STEP1_TL.paperFallDur], [(seed.rRot - 0.5) * 90, 0]);
            return (
              <PaperBall
                key={i}
                cx={b.cx}
                cy={drop.y + bedCompress * 0.6}
                r={b.r}
                rot={spin}
                scaleX={drop.scaleX}
                scaleY={drop.scaleY}
                opacity={drop.opacity}
              />
            );
          })}

        {/* Sub-step 1: dashed cardboard target guide */}
        {hintOpacity > 0.01 && (
          <g opacity={hintOpacity}>
            <rect
              x="76"
              y={150 + hintBob}
              width="168"
              height="5"
              rx="1.5"
              fill="none"
              stroke={TOKENS.brown}
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            <path
              d={`M160 ${162 + hintBob} L160 ${208 + hintBob * 0.4} M154 ${202 + hintBob * 0.4} L160 ${209 + hintBob * 0.4} L166 ${202 + hintBob * 0.4}`}
              fill="none"
              stroke={TOKENS.brown}
              strokeWidth="1.5"
              strokeDasharray="3 3"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Sub-step 2: flat corrugated cardboard sheet settling onto the false bottom */}
        {cartonVisible && (
          <g
            opacity={cartonOpacity}
            transform={`translate(160, ${cartonDrop.y + 5}) scale(${cartonDrop.scaleX.toFixed(4)}, ${cartonDrop.scaleY.toFixed(4)}) translate(-160, ${-(cartonDrop.y + 5)})`}
          >
            <rect
              x="74"
              y={cartonDrop.y}
              width="172"
              height="5.5"
              rx="1.5"
              fill={TOKENS.illo.cardboard}
              stroke={TOKENS.brown}
              strokeWidth="1"
            />
            <line
              x1="78"
              y1={cartonDrop.y + 2.75}
              x2="242"
              y2={cartonDrop.y + 2.75}
              stroke={TOKENS.illo.cardboardLine}
              strokeWidth="1"
              strokeDasharray="3.5 3.5"
              opacity={0.8}
            />
          </g>
        )}
      </BinRig>
    </StageCanvas>
    </>
  );
}
