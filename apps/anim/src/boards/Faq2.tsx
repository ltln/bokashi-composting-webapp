import { useCurrentFrame } from "remotion";
import { BinRig, OrganicPatternDef, StageCanvas } from "../components/BinRig";
import { VoAudioTrack } from "../components/VoAudioTrack";
import {
  BagCollar,
  FruitFly,
  LeaderLabel,
  Lid,
  Maggot,
  MotionArrow,
  RubbishBody,
  SmoothHand,
  Spoon,
} from "../components/props";
import { EASE, clampInterp, createSeededParticles, segProgress } from "../physics";
import { FAQ2_TL, S1, S2, localFrame } from "../timeline";
import { TOKENS } from "../tokens";
import { mapBoardFrame, type BoardLocale } from "../voAlignment";

const MAGGOTS = [
  { x: 205, y: 76.8, w: 9, phase: 0 },
  { x: 218, y: 77.6, w: 9.5, phase: 1.9 },
  { x: 230, y: 76.2, w: 8.2, phase: 3.4 },
] as const;

const FLIES = [
  { bx: 252, by: 31, ax: 9, ay: 4.5, fx: 0.075, fy: 0.11, ph: 0.2, stayInS1: true },
  { bx: 270, by: 24, ax: 10, ay: 4.5, fx: 0.065, fy: 0.09, ph: 1.8, stayInS1: true },
  { bx: 238, by: 20, ax: 8, ay: 4.0, fx: 0.08, fy: 0.1, ph: 3.1, stayInS1: false },
  { bx: 280, by: 39, ax: 7.5, ay: 4.5, fx: 0.07, fy: 0.12, ph: 4.5, stayInS1: false },
] as const;

const EM_GRAINS = createSeededParticles("faq2-em", 22);

export function Faq2({ locale = "vi", voiced = false }: { locale?: BoardLocale; voiced?: boolean }) {
  const rawFrame = useCurrentFrame();
  const frame = mapBoardFrame(rawFrame, "Faq2", locale, voiced);
  const f0 = localFrame(frame, 0);
  const f1 = localFrame(frame, 1);
  const f2 = localFrame(frame, 2);

  // Lid hinge angle: ajar (-6deg) during s0 & s1 -> anticipation lift (-9deg) -> snap shut (0deg) in s2
  const lidHinge = (() => {
    if (frame < S2) return -6;
    if (f2 < FAQ2_TL.lidAnticipationStart) return -6;
    if (f2 < FAQ2_TL.lidDropStart) {
      return clampInterp(f2, [FAQ2_TL.lidAnticipationStart, FAQ2_TL.lidDropStart], [-6, -9.2], EASE.inOut);
    }
    if (f2 < FAQ2_TL.lidImpact) {
      return clampInterp(f2, [FAQ2_TL.lidDropStart, FAQ2_TL.lidImpact], [-9.2, 0], EASE.in);
    }
    if (f2 < FAQ2_TL.lidSettleEnd) {
      const p = (f2 - FAQ2_TL.lidImpact) / (FAQ2_TL.lidSettleEnd - FAQ2_TL.lidImpact);
      return -Math.abs(Math.sin(p * Math.PI * 1.5)) * 1.4 * Math.exp(-3.2 * p);
    }
    return 0;
  })();

  const lidSquashY =
    f2 >= FAQ2_TL.lidImpact && f2 < FAQ2_TL.lidSettleEnd
      ? 1 - Math.sin(((f2 - FAQ2_TL.lidImpact) / (FAQ2_TL.lidSettleEnd - FAQ2_TL.lidImpact)) * Math.PI * 2) * 0.06
      : 1;

  // Bag collar morphs smoothly from "gap" to "lip" during s1
  const smoothT = frame >= S1 ? segProgress(f1, FAQ2_TL.smoothStart, FAQ2_TL.smoothEnd, EASE.inOut) : 0;

  // EM grains poured onto exposed gap in s0 (frames 48..188)
  const branCover = clampInterp(frame, [FAQ2_TL.emSprinkleStart + 20, FAQ2_TL.emCoverDone], [0, 1], EASE.smooth);
  const maggotMotionAmp = 1 - branCover;

  // "vùng hở" leader label in s0, fades out cleanly before s1 hand enters
  const gapLabelOp =
    clampInterp(f0, [14, 34], [0, 1], EASE.out) *
    (1 - clampInterp(frame, [S1 - 24, S1], [0, 1], EASE.in));

  // Spoon emitter in s0 over the exposed patch (enters cleanly -> 2 shakes -> exits before s1)
  const spoonVisS0 =
    f0 >= 26 && f0 <= 215
      ? clampInterp(f0, [26, 46], [0, 1], EASE.out) * (1 - clampInterp(f0, [192, 215], [0, 1], EASE.in))
      : 0;
  const spoonX =
    f0 < 48
      ? clampInterp(f0, [26, 48], [268, 218], EASE.out)
      : f0 > 190
        ? clampInterp(f0, [190, 215], [218, 272], EASE.in)
        : 218;
  const spoonTiltS0 =
    f0 >= FAQ2_TL.emSprinkleStart && f0 <= FAQ2_TL.emSprinkleEnd
      ? -24 * Math.sin(((f0 - FAQ2_TL.emSprinkleStart) / 36) * Math.PI) * 0.5 - 14
      : 0;
  const spoonBranS0 = clampInterp(f0, [FAQ2_TL.emSprinkleStart, FAQ2_TL.emSprinkleEnd], [1, 0.1]);

  // Hand & smoothing arrow in s1 (descends from rim top)
  const handOp =
    f1 >= FAQ2_TL.handEnter && f1 <= FAQ2_TL.handExit
      ? clampInterp(f1, [FAQ2_TL.handEnter, FAQ2_TL.handEnter + 16], [0, 1], EASE.out) *
        (1 - clampInterp(f1, [FAQ2_TL.handExit - 22, FAQ2_TL.handExit], [0, 1], EASE.in))
      : 0;
  const handX = clampInterp(smoothT, [0, 1], [198, 236]);
  const handY =
    f1 < FAQ2_TL.smoothStart
      ? clampInterp(f1, [FAQ2_TL.handEnter, FAQ2_TL.smoothStart], [42, 78], EASE.out)
      : f1 > FAQ2_TL.smoothEnd
        ? clampInterp(f1, [FAQ2_TL.smoothEnd, FAQ2_TL.handExit], [78, 42], EASE.in)
        : 78;

  const arrowOp =
    f1 >= FAQ2_TL.smoothStart - 8 && f1 <= FAQ2_TL.smoothEnd + 16
      ? clampInterp(f1, [FAQ2_TL.smoothStart - 8, FAQ2_TL.smoothStart + 10], [0, 1]) *
        (1 - clampInterp(f1, [FAQ2_TL.smoothEnd, FAQ2_TL.smoothEnd + 16], [0, 1]))
      : 0;

  return (
    <>
      <VoAudioTrack boardId="Faq2" locale={locale} voiced={voiced} />
      <StageCanvas>
      <BinRig
        idPrefix="faq2"
        newspaperOpacity={1}
        cardboard
        squashY={lidSquashY}
        outside={
          <>
            <defs>
              <OrganicPatternDef id="faq2-org" />
            </defs>
            <BagCollar fromState="gap" toState="lip" t={smoothT} />
            {arrowOp > 0.01 && <MotionArrow x1={202} y1={63} x2={236} y2={63} opacity={arrowOp} />}
            {spoonVisS0 > 0.01 && (
              <Spoon tipX={spoonX} tipY={56} tiltDeg={spoonTiltS0} branFill={spoonBranS0} opacity={spoonVisS0} />
            )}
            {handOp > 0.01 && <SmoothHand x={handX} y={handY} opacity={handOp} />}
          </>
        }
        overlay={
          <>
            <Lid hingeDeg={lidHinge} squashY={lidSquashY} />
            {gapLabelOp > 0.01 && (
              <LeaderLabel from={[240, 81]} to={[258, 104]} lines={locale === "en" ? ["open gap"] : ["vùng hở"]} opacity={gapLabelOp} />
            )}
            {/* Fruit flies buzzing around rim gap -> fleeing when lid locks shut */}
            {FLIES.map((fly, i) => {
              const tExitS1 = !fly.stayInS1 && f1 >= 0 ? segProgress(f1, 40, 150, EASE.inOut) : 0;
              const tFleeS2 = fly.stayInS1 && f2 >= FAQ2_TL.flyFleeStart ? segProgress(f2, FAQ2_TL.flyFleeStart, FAQ2_TL.flyFleeEnd, EASE.in) : 0;

              const dx = Math.sin(frame * fly.fx + fly.ph) * fly.ax;
              const dy = Math.cos(frame * fly.fy + fly.ph * 1.3) * fly.ay;
              // Tangent velocity for coherent fly heading tilt
              const vx = Math.cos(frame * fly.fx + fly.ph) * fly.ax * fly.fx;
              const vy = -Math.sin(frame * fly.fy + fly.ph * 1.3) * fly.ay * fly.fy;
              const headingTilt = (Math.atan2(vy, vx) * 180) / Math.PI * 0.25;

              // In s2 right before flee, flies bump gently off closed lid at y~27
              const bumpY =
                fly.stayInS1 && f2 >= FAQ2_TL.lidImpact && f2 < FAQ2_TL.flyFleeStart
                  ? Math.abs(Math.sin(((f2 - FAQ2_TL.lidImpact) / 25) * Math.PI)) * -6
                  : 0;

              const x = fly.bx + dx + tExitS1 * 38 + tFleeS2 * (i % 2 === 0 ? 44 : 26);
              const y = fly.by + dy + bumpY - tExitS1 * 12 - tFleeS2 * 18;
              const op = (1 - tExitS1) * (1 - tFleeS2);
              return (
                <FruitFly
                  key={i}
                  x={x}
                  y={y}
                  wingPhase={frame * 1.55 + i * 1.2}
                  tiltDeg={headingTilt}
                  opacity={op}
                />
              );
            })}
          </>
        }
      >
        <RubbishBody patternId="faq2-org" topY={82} topLineWidth={204} />

        {/* Existing bran strip on left covered zone (x=70..204) */}
        <rect x="70" y="81.5" width="134" height="3" fill={TOKENS.illo.cardboardLine} />

        {/* Maggots wiggling in exposed patch (x=204..242) before EM powder covers them */}
        {MAGGOTS.map((m, i) => {
          const stretch = 1 + Math.sin(frame * 0.19 + m.phase) * 0.14 * maggotMotionAmp;
          const maggotOp = 1 - clampInterp(branCover, [0.55, 0.95], [0, 1]);
          return <Maggot key={i} x={m.x} y={m.y} w={m.w} stretchX={stretch} opacity={maggotOp} />;
        })}

        {/* EM bran pile accumulating over the exposed gap */}
        {branCover > 0.01 && (
          <path
            d={`M202 82 Q222 ${(82 - 7.5 * branCover).toFixed(2)} 242 82 Z`}
            fill={TOKENS.illo.cardboardLine}
            stroke={TOKENS.illo.bran}
            strokeWidth="0.6"
            opacity={clampInterp(branCover, [0, 0.25], [0.4, 0.96])}
          />
        )}

        {/* EM powder grains pouring down into the exposed gap during s0 */}
        {f0 >= FAQ2_TL.emSprinkleStart &&
          f0 <= FAQ2_TL.emSprinkleEnd + 18 &&
          EM_GRAINS.map((g) => {
            const age = f0 - FAQ2_TL.emSprinkleStart - g.rPhase * 65;
            if (age < 0 || age > 42) return null;
            const t = age / 42;
            const x = 205 + g.rx * 34;
            const y = 57 + 23 * (t * t);
            const op =
              clampInterp(t, [0, 0.15], [0, 1]) *
              (1 - clampInterp(t, [0.85, 1], [0, 1])) *
              (1 - clampInterp(f0, [FAQ2_TL.emSprinkleEnd, FAQ2_TL.emSprinkleEnd + 18], [0, 1]));
            return (
              <circle
                key={g.id}
                cx={x}
                cy={y}
                r={1.3 + g.rSize * 0.8}
                fill={g.id % 3 === 0 ? TOKENS.illo.bran : TOKENS.illo.cardboardLine}
                opacity={op}
              />
            );
          })}

        {/* Smooth sealed plastic coat laid over right gap in s1 */}
        {smoothT > 0.02 && (
          <path
            d={`M200 81.5 L${(200 + 42 * smoothT).toFixed(1)} 81.5`}
            stroke={TOKENS.illo.bag}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        )}
      </BinRig>
    </StageCanvas>
    </>
  );
}
