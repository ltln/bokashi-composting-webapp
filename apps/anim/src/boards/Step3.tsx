import { useCurrentFrame } from "remotion";
import { BinRig, OrganicPatternDef, StageCanvas } from "../components/BinRig";
import { BagCollar, Bracket, Lid, MotionArrow, RubbishBody, SmoothHand } from "../components/props";
import { EASE, clampInterp, segProgress } from "../physics";
import { STEP3_TL, localFrame } from "../timeline";
import { TOKENS } from "../tokens";

/** Trapped air bubbles squeezed outward symmetrically by hand smoothing. */
const AIR_BUBBLES = [
  { x0: 145, xExit: 84, cy: 87.5, rx: 6.5, ry: 3.4, dir: -1, stagger: 0 },
  { x0: 126, xExit: 83, cy: 88.5, rx: 4.8, ry: 2.8, dir: -1, stagger: 16 },
  { x0: 112, xExit: 82, cy: 87.8, rx: 3.6, ry: 2.2, dir: -1, stagger: 32 },
  { x0: 175, xExit: 236, cy: 87.5, rx: 6.5, ry: 3.4, dir: 1, stagger: 6 },
  { x0: 194, xExit: 237, cy: 88.5, rx: 4.8, ry: 2.8, dir: 1, stagger: 22 },
  { x0: 208, xExit: 238, cy: 87.8, rx: 3.6, ry: 2.2, dir: 1, stagger: 38 },
] as const;

export function Step3() {
  const frame = useCurrentFrame();
  const f0 = localFrame(frame, 0);
  const f1 = localFrame(frame, 1);
  const f2 = localFrame(frame, 2);

  // Sub-step 0: plastic bag sheet lowers onto the rubbish surface with soft wave settle
  const sheetDropT = segProgress(f0, STEP3_TL.sheetEnter, STEP3_TL.sheetImpact, EASE.out);
  const sheetYOffset = clampInterp(sheetDropT, [0, 1], [-22, 0]);
  const sheetSettleWave =
    f0 >= STEP3_TL.sheetImpact && f0 < STEP3_TL.sheetSettleEnd
      ? Math.sin(((f0 - STEP3_TL.sheetImpact) / (STEP3_TL.sheetSettleEnd - STEP3_TL.sheetImpact)) * Math.PI * 2) *
        2.2 *
        (1 - (f0 - STEP3_TL.sheetImpact) / (STEP3_TL.sheetSettleEnd - STEP3_TL.sheetImpact))
      : 0;
  const bagTransition = f1 >= 0 ? segProgress(f1, STEP3_TL.sweepStart, STEP3_TL.sweepEnd, EASE.inOut) : 0;

  // Center bulge under the plastic sheet flattens cleanly as air bubbles leave in s1
  const sheetCenterDome = 6 * (1 - bagTransition);

  // Sub-step 1: Hand enters center, presses down, sweeps outward left then right
  const handOp =
    f1 >= STEP3_TL.handEnter && f1 <= STEP3_TL.handExit
      ? clampInterp(f1, [STEP3_TL.handEnter, STEP3_TL.handEnter + 16], [0, 1], EASE.out) *
        (1 - clampInterp(f1, [STEP3_TL.handExit - 22, STEP3_TL.handExit], [0, 1], EASE.in))
      : 0;
  // Two smooth outward sweeps: left sweep (34..102), reset/right sweep (102..175)
  const handX = (() => {
    if (f1 < STEP3_TL.sweepStart) return 160;
    if (f1 < 102) return clampInterp(f1, [STEP3_TL.sweepStart, 102], [160, 98], EASE.inOut);
    if (f1 < 118) return clampInterp(f1, [102, 118], [98, 160], EASE.out);
    if (f1 < STEP3_TL.sweepEnd) return clampInterp(f1, [118, STEP3_TL.sweepEnd], [160, 222], EASE.inOut);
    return 222;
  })();
  const handY = (() => {
    if (f1 < STEP3_TL.handPress) return clampInterp(f1, [STEP3_TL.handEnter, STEP3_TL.handPress], [28, 79], EASE.out);
    if (f1 >= 100 && f1 <= 120) {
      return 79 - Math.sin(clampInterp(f1, [100, 120], [0, Math.PI])) * 9;
    }
    if (f1 > STEP3_TL.sweepEnd) return clampInterp(f1, [STEP3_TL.sweepEnd, STEP3_TL.handExit], [79, 28], EASE.in);
    return 79;
  })();

  // Arrows show direction during s1
  const arrowsOp =
    f1 >= STEP3_TL.sweepStart - 8 && f1 <= STEP3_TL.sweepEnd + 18
      ? clampInterp(f1, [STEP3_TL.sweepStart - 8, STEP3_TL.sweepStart + 10], [0, 1]) *
        (1 - clampInterp(f1, [STEP3_TL.sweepEnd, STEP3_TL.sweepEnd + 18], [0, 1]))
      : 0;

  // Sub-step 2: Lid anticipation lift -> inertial snap shut -> small rim recoil
  const lidY = (() => {
    if (f2 < 0) return -24;
    if (f2 < STEP3_TL.lidAnticipationStart) return -24;
    if (f2 < STEP3_TL.lidDropStart) {
      return clampInterp(f2, [STEP3_TL.lidAnticipationStart, STEP3_TL.lidDropStart], [-24, -29], EASE.inOut);
    }
    if (f2 < STEP3_TL.lidImpact) {
      return clampInterp(f2, [STEP3_TL.lidDropStart, STEP3_TL.lidImpact], [-29, 0], EASE.in);
    }
    if (f2 < STEP3_TL.lidSettleEnd) {
      const p = (f2 - STEP3_TL.lidImpact) / (STEP3_TL.lidSettleEnd - STEP3_TL.lidImpact);
      return -Math.abs(Math.sin(p * Math.PI * 1.5)) * 2.2 * Math.exp(-3 * p);
    }
    return 0;
  })();
  const lidImpactP =
    f2 >= STEP3_TL.lidImpact && f2 < STEP3_TL.lidSettleEnd
      ? (f2 - STEP3_TL.lidImpact) / (STEP3_TL.lidSettleEnd - STEP3_TL.lidImpact)
      : 1;
  const lidSquashY =
    f2 >= STEP3_TL.lidImpact && f2 < STEP3_TL.lidSettleEnd
      ? 1 - Math.sin(lidImpactP * Math.PI * 2) * 0.08 * Math.exp(-3.5 * lidImpactP)
      : 1;
  const binSquashY =
    f2 >= STEP3_TL.lidImpact && f2 < STEP3_TL.lidSettleEnd
      ? 1 - Math.sin(lidImpactP * Math.PI) * 0.008 * Math.exp(-3 * lidImpactP)
      : 1;

  return (
    <StageCanvas>
      <BinRig
        idPrefix="step3"
        newspaperOpacity={1}
        cardboard
        squashY={binSquashY}
        outside={
          <>
            <defs>
              <OrganicPatternDef id="step3-org" />
            </defs>
            <BagCollar
              fromState="open"
              toState="flat"
              t={bagTransition}
              rightTail={bagTransition > 0.5 ? "flat" : "open"}
              yOffset={f0 < STEP3_TL.sheetImpact ? sheetYOffset * 0.35 : 0}
            />
          </>
        }
        overlay={
          <>
            <Bracket x={59} y1={82} y2={226} text="~70%" />
            {arrowsOp > 0.01 && (
              <g opacity={arrowsOp}>
                <MotionArrow x1={148} y1={63} x2={102} y2={63} />
                <MotionArrow x1={172} y1={63} x2={218} y2={63} />
              </g>
            )}
            {handOp > 0.01 && <SmoothHand x={handX} y={handY} flip={handX < 160} opacity={handOp} />}
            <Lid yOffset={lidY} squashY={lidSquashY} />
          </>
        }
      >
        <RubbishBody patternId="step3-org" topY={82} />

        {/* Plastic sheet resting on top of rubbish surface */}
        <g transform={`translate(0, ${(sheetYOffset + sheetSettleWave).toFixed(2)})`}>
          <path
            d={`M80 80 C120 ${(80 - sheetCenterDome).toFixed(2)}, 200 ${(80 - sheetCenterDome).toFixed(2)}, 240 80 L240 87 C200 ${(87 - sheetCenterDome * 0.5).toFixed(2)}, 120 ${(87 - sheetCenterDome * 0.5).toFixed(2)}, 80 87 Z`}
            fill={TOKENS.illo.waterPale}
            opacity={0.94}
          />
          <path
            d={`M86 83 Q160 ${(83 - sheetCenterDome * 0.8).toFixed(2)} 234 83`}
            fill="none"
            stroke={TOKENS.illo.bag}
            strokeWidth="1.2"
            opacity={0.75}
          />
        </g>

        {/* Trapped air bubbles that appear after sheet lands and slide smoothly out to the walls in s1 */}
        {AIR_BUBBLES.map((b, i) => {
          const appearOp = clampInterp(f0, [STEP3_TL.sheetImpact - 10, STEP3_TL.sheetImpact + 18], [0, 1]);
          const pushStart = (b.dir < 0 ? STEP3_TL.sweepStart : 118) + b.stagger * 0.65;
          const pushEnd = pushStart + 58;
          const slideT = f1 >= 0 ? segProgress(f1, pushStart, pushEnd, EASE.inOut) : 0;
          const cx = b.x0 + (b.xExit - b.x0) * slideT;
          // Bubble lifts gently up the wall as it escapes past the rim
          const riseY = slideT > 0.72 ? clampInterp(slideT, [0.72, 1], [0, -24], EASE.in) : 0;
          const escapeFade = 1 - clampInterp(slideT, [0.82, 1], [0, 1]);
          // Subtle squeeze elongation while being pushed
          const stretch = 1 + Math.sin(slideT * Math.PI) * 0.25;
          const op = appearOp * escapeFade;
          if (op <= 0.01) return null;
          return (
            <ellipse
              key={i}
              cx={cx}
              cy={b.cy + riseY + sheetYOffset}
              rx={b.rx * stretch}
              ry={b.ry / Math.sqrt(stretch)}
              fill={TOKENS.surface}
              stroke={TOKENS.illo.bag}
              strokeWidth="1.05"
              opacity={op}
            />
          );
        })}
      </BinRig>
    </StageCanvas>
  );
}
