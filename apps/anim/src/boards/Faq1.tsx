import { useCurrentFrame } from "remotion";
import { BinRig, OrganicPatternDef, StageCanvas } from "../components/BinRig";
import {
  BagCollar,
  Lid,
  PressPlate,
  RubbishBody,
  SmoothHand,
  Spoon,
} from "../components/props";
import { EASE, clampInterp, createSeededParticles, segProgress } from "../physics";
import { FAQ1_TL, S1, S2, S3, localFrame } from "../timeline";
import { TOKENS } from "../tokens";

const EM_GRAINS = createSeededParticles("faq1-em", 20);
const SMELL_MOTES = createSeededParticles("faq1-motes", 10);
const WISPS = [
  { x: 92, y: 74, phase: 0, amp: 4.5 },
  { x: 112, y: 72, phase: 1.7, amp: 5.2 },
  { x: 136, y: 75, phase: 3.1, amp: 4.0 },
  { x: 162, y: 74, phase: 4.4, amp: 4.8 },
] as const;

const BUBBLES_S3 = [
  { x0: 148, xExit: 84, cy: 86, dir: -1, stagger: 0 },
  { x0: 126, xExit: 83, cy: 87, dir: -1, stagger: 12 },
  { x0: 172, xExit: 236, cy: 86, dir: 1, stagger: 4 },
  { x0: 194, xExit: 237, cy: 87, dir: 1, stagger: 16 },
] as const;

export function Faq1() {
  const frame = useCurrentFrame();
  const f0 = localFrame(frame, 0);
  const f1 = localFrame(frame, 1);
  const f2 = localFrame(frame, 2);
  const f3 = localFrame(frame, 3);

  // Lid: closed -> opens with subtle bounce in s0 -> stays open until s3 -> snaps shut in s3
  const lidY = (() => {
    if (frame < S3) {
      if (f0 < FAQ1_TL.lidOpenStart) return 0;
      if (f0 < FAQ1_TL.lidOpenEnd) {
        return clampInterp(f0, [FAQ1_TL.lidOpenStart, FAQ1_TL.lidOpenEnd], [0, -24], EASE.backOut);
      }
      return -24;
    }
    if (f3 < FAQ1_TL.lidCloseStart) return -24;
    if (f3 < FAQ1_TL.lidCloseImpact) {
      // Slight anticipation lift (-24 -> -28) then firm downward close
      if (f3 < FAQ1_TL.lidCloseStart + 14) {
        return clampInterp(f3, [FAQ1_TL.lidCloseStart, FAQ1_TL.lidCloseStart + 14], [-24, -28], EASE.inOut);
      }
      return clampInterp(f3, [FAQ1_TL.lidCloseStart + 14, FAQ1_TL.lidCloseImpact], [-28, 0], EASE.in);
    }
    if (f3 < FAQ1_TL.lidCloseEnd) {
      const p = (f3 - FAQ1_TL.lidCloseImpact) / (FAQ1_TL.lidCloseEnd - FAQ1_TL.lidCloseImpact);
      return -Math.abs(Math.sin(p * Math.PI * 1.5)) * 2 * Math.exp(-3 * p);
    }
    return 0;
  })();

  // Bag collar: flat -> up (s0) -> holds up (s1, s2) -> flips down flat (s3)
  const bagProps = (() => {
    if (frame < S3) {
      const flipUp = segProgress(f0, FAQ1_TL.bagFlipStart, FAQ1_TL.bagFlipEnd, EASE.inOut);
      return { fromState: "flat" as const, toState: "up" as const, t: flipUp, tailOp: 1 - flipUp };
    }
    const flipDown = segProgress(f3, FAQ1_TL.bagCloseStart, FAQ1_TL.bagCloseEnd, EASE.inOut);
    return { fromState: "up" as const, toState: "flat" as const, t: flipDown, tailOp: flipDown };
  })();

  // Smell intensity: rises after lid opens, dims across 3 EM spoon shakes in s1, gone in s2
  const smellRise = segProgress(f0, 26, 75, EASE.out);
  const smellReduceS1 = f1 >= 0 ? clampInterp(f1, [50, 210], [1, 0.3], EASE.smooth) : 1;
  const smellReduceS2 = f2 >= 0 ? clampInterp(f2, [30, 120], [0.3, 0], EASE.out) : 1;
  const smellIntensity = frame >= S3 ? 0 : smellRise * smellReduceS1 * smellReduceS2;

  // Sub-step 1: Spoon enters, tips 3 rhythmic pours ("2–3 muỗng"), exits cleanly
  const spoonVis =
    f1 >= 0 && f1 <= FAQ1_TL.spoonExitEnd
      ? clampInterp(f1, [0, FAQ1_TL.spoonReady], [0, 1], EASE.out) *
        (1 - clampInterp(f1, [FAQ1_TL.spoonExitStart, FAQ1_TL.spoonExitEnd], [0, 1], EASE.in))
      : 0;
  const badgeOp =
    f1 >= 8 && f1 <= FAQ1_TL.spoonExitEnd - 12
      ? clampInterp(f1, [8, 28], [0, 1], EASE.out) *
        (1 - clampInterp(f1, [FAQ1_TL.spoonExitStart - 6, FAQ1_TL.spoonExitEnd - 12], [0, 1], EASE.in))
      : 0;
  const spoonSlideX =
    f1 < FAQ1_TL.spoonReady
      ? clampInterp(f1, [0, FAQ1_TL.spoonReady], [250, 184], EASE.backOut)
      : f1 > FAQ1_TL.spoonExitStart
        ? clampInterp(f1, [FAQ1_TL.spoonExitStart, FAQ1_TL.spoonExitEnd], [184, 256], EASE.in)
        : 184 + Math.sin(clampInterp(f1, [30, 190], [0, Math.PI * 2])) * 12;

  // 3 distinct shake/tilt pulses
  const shakeTilt = (() => {
    if (f1 < FAQ1_TL.pour1Start || f1 > 194) return 0;
    const p1 = Math.sin(segProgress(f1, 30, 74) * Math.PI);
    const p2 = Math.sin(segProgress(f1, 84, 128) * Math.PI);
    const p3 = Math.sin(segProgress(f1, 138, 182) * Math.PI);
    return -(p1 + p2 + p3) * 26;
  })();
  const branInSpoon = f1 >= 0 ? clampInterp(f1, [32, 185], [1, 0.08], EASE.smooth) : 1;
  const emCoat = frame >= S1 ? clampInterp(f1, [46, 188], [0, 3.2], EASE.smooth) : 0;

  // Sub-step 2: PressPlate compacts rubbish from y=82 down to y=87 (then stays compacted at 84)
  const pressVis =
    f2 >= 0 && f2 <= FAQ1_TL.pressExitEnd
      ? clampInterp(f2, [0, 18], [0, 1], EASE.out) *
        (1 - clampInterp(f2, [FAQ1_TL.pressExitEnd - 22, FAQ1_TL.pressExitEnd], [0, 1], EASE.in))
      : 0;
  const p1 = f2 >= 0 ? Math.sin(segProgress(f2, 34, 72) * Math.PI) : 0;
  const p2 = f2 >= 0 ? segProgress(f2, 96, 126, EASE.out) : 0;
  const compressDepth =
    frame < S2
      ? 0
      : frame < S3
        ? Math.max(p1 * 0.7, p2) * 5.2
        : 3.5; // stays neatly compacted after pressing
  const pressY = (() => {
    if (f2 < 24) return clampInterp(f2, [0, 24], [38, 68], EASE.out);
    if (f2 < 34) return clampInterp(f2, [24, 34], [68, 63], EASE.inOut);
    if (f2 < 54) return clampInterp(f2, [34, 54], [63, 76], EASE.in);
    if (f2 < 82) return clampInterp(f2, [54, 82], [76, 68], EASE.out);
    if (f2 < 108) return clampInterp(f2, [82, 108], [68, 78], EASE.inOut);
    if (f2 < 152) return 78;
    return clampInterp(f2, [152, FAQ1_TL.pressExitEnd], [78, 38], EASE.out);
  })();

  // Sub-step 3: Hand smooths bag across y=82 pushing out trapped bubbles
  const handOp =
    f3 >= FAQ1_TL.smoothStart && f3 <= FAQ1_TL.smoothEnd + 16
      ? clampInterp(f3, [FAQ1_TL.smoothStart, FAQ1_TL.smoothStart + 14], [0, 1]) *
        (1 - clampInterp(f3, [FAQ1_TL.smoothEnd, FAQ1_TL.smoothEnd + 16], [0, 1]))
      : 0;
  const handX =
    f3 < 125
      ? clampInterp(f3, [FAQ1_TL.smoothStart, 125], [160, 102], EASE.inOut)
      : clampInterp(f3, [125, FAQ1_TL.smoothEnd], [160, 218], EASE.inOut);
  const handY =
    f3 < FAQ1_TL.smoothStart + 16
      ? clampInterp(f3, [FAQ1_TL.smoothStart, FAQ1_TL.smoothStart + 16], [30, 79], EASE.out)
      : f3 > FAQ1_TL.smoothEnd - 12
        ? clampInterp(f3, [FAQ1_TL.smoothEnd - 12, FAQ1_TL.smoothEnd + 16], [79, 30], EASE.in)
        : 79;

  return (
    <StageCanvas>
      <BinRig
        idPrefix="faq1"
        newspaperOpacity={1}
        cardboard
        squashY={1 - compressDepth * 0.0014}
        outside={
          <>
            <defs>
              <OrganicPatternDef id="faq1-org" />
            </defs>
            <BagCollar
              fromState={bagProps.fromState}
              toState={bagProps.toState}
              t={bagProps.t}
              rightTail="flat"
              rightTailOpacity={bagProps.tailOp}
            />
            {/* Continuous swirling smell wisps */}
            {smellIntensity > 0.01 && (
              <g fill="none" strokeWidth="2.1" strokeLinecap="round" opacity={smellIntensity}>
                {WISPS.map((w, idx) => {
                  const wave1 = Math.sin(frame * 0.09 + w.phase) * w.amp;
                  const wave2 = Math.cos(frame * 0.08 + w.phase) * w.amp;
                  const lift = (frame * 0.35 + idx * 9) % 12;
                  const x = w.x;
                  const y0 = w.y - lift * 0.3;
                  return (
                    <path
                      key={w.x}
                      d={`M${x} ${y0.toFixed(1)} C${(x - 6 + wave1).toFixed(1)} ${(y0 - 11).toFixed(1)}, ${(x + 6 + wave2).toFixed(1)} ${(y0 - 21).toFixed(1)}, ${(x + wave1 * 0.6).toFixed(1)} ${(y0 - 31).toFixed(1)}`}
                      stroke={idx % 2 === 0 ? TOKENS.olive : TOKENS.illo.organicLeaf}
                      opacity={0.78}
                    />
                  );
                })}
                {SMELL_MOTES.map((m) => {
                  const age = (frame + m.rPhase * 60) % 60;
                  const t = age / 60;
                  const cx = 86 + m.rx * 84 + Math.sin(t * Math.PI * 2 + m.rPhase * 6) * 5;
                  const cy = 72 - t * 36;
                  const op = Math.sin(t * Math.PI) * 0.65;
                  return <circle key={m.id} cx={cx} cy={cy} r={1.2 + m.rSize} fill={TOKENS.olive} opacity={op} />;
                })}
              </g>
            )}

            {/* Sub-step 1: Spoon + EM grains (placed cleanly below top pill) */}
            {spoonVis > 0.01 && (
              <Spoon tipX={spoonSlideX} tipY={64} tiltDeg={shakeTilt} branFill={branInSpoon} opacity={spoonVis} />
            )}
            {handOp > 0.01 && <SmoothHand x={handX} y={handY} flip={handX < 160} opacity={handOp} />}
          </>
        }
        overlay={
          <>
            {badgeOp > 0.01 && (
              <g opacity={badgeOp}>
                <rect x="220" y="10" width="76" height="21" rx="10.5" fill={TOKENS.accent} />
                <text x="258" y="24" textAnchor="middle" fontSize="10.5" fontWeight="700" fill={TOKENS.surface}>
                  2–3 muỗng
                </text>
              </g>
            )}
            <Lid yOffset={lidY} />
          </>
        }
      >
        <RubbishBody patternId="faq1-org" topY={82 + compressDepth} />

        {/* EM bran coat on rubbish surface */}
        {emCoat > 0.05 && (
          <rect
            x="70"
            y={82 + compressDepth - emCoat}
            width="180"
            height={emCoat}
            fill={TOKENS.illo.cardboardLine}
            opacity={0.94}
          />
        )}

        {/* Sub-step 1: EM grains falling cleanly from spoon bowl across 3 shakes */}
        {f1 >= FAQ1_TL.pour1Start &&
          f1 <= 198 &&
          EM_GRAINS.map((g) => {
            const waveIdx = g.id % 3;
            const waveStart = waveIdx === 0 ? 36 : waveIdx === 1 ? 90 : 144;
            const age = f1 - waveStart - g.rPhase * 10;
            if (age < 0 || age > 32) return null;
            const t = age / 32;
            const x = spoonSlideX + (g.rx - 0.5) * 44 * t + (g.rx - 0.5) * 8;
            const y = 60 + 21 * (t * t);
            const op = clampInterp(t, [0, 0.15], [0, 1]) * (1 - clampInterp(t, [0.8, 1], [0, 1]));
            return (
              <circle
                key={g.id}
                cx={x}
                cy={y}
                r={1.3 + g.rSize * 0.8}
                fill={g.id % 2 === 0 ? TOKENS.illo.bran : TOKENS.illo.cardboardLine}
                opacity={op}
              />
            );
          })}

        {/* Sub-step 2: PressPlate */}
        {pressVis > 0.01 && <PressPlate y={pressY} opacity={pressVis} />}

        {/* Sub-step 3: Flat plastic bag surface + air bubbles squeezed out */}
        {frame >= S3 && (
          <>
            <path
              d={`M80 ${82 + compressDepth} Q160 ${80 + compressDepth} 240 ${82 + compressDepth}`}
              fill="none"
              stroke={TOKENS.illo.bag}
              strokeWidth="1.5"
              opacity={bagProps.t}
            />
            {BUBBLES_S3.map((b, i) => {
              const pushT = segProgress(f3, FAQ1_TL.smoothStart + b.stagger * 0.5, FAQ1_TL.smoothEnd - 10, EASE.inOut);
              const cx = b.x0 + (b.xExit - b.x0) * pushT;
              const rise = pushT > 0.72 ? clampInterp(pushT, [0.72, 1], [0, -18]) : 0;
              const op = bagProps.t * (1 - clampInterp(pushT, [0.8, 1], [0, 1]));
              if (op <= 0.01) return null;
              return (
                <ellipse
                  key={i}
                  cx={cx}
                  cy={b.cy + rise}
                  rx="4.8"
                  ry="2.6"
                  fill={TOKENS.surface}
                  stroke={TOKENS.illo.bag}
                  strokeWidth="0.9"
                  opacity={op}
                />
              );
            })}
          </>
        )}
      </BinRig>
    </StageCanvas>
  );
}
