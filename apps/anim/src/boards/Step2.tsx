import { useCurrentFrame } from "remotion";
import { BinRig, OrganicPatternDef, StageCanvas } from "../components/BinRig";
import { Bottle, Bracket, PressPlate, SmoothHand, getBottleMouth } from "../components/props";
import { EASE, clampInterp, createSeededParticles, parabolicArc, segProgress } from "../physics";
import { S1, S2, S3, STEP2_TL, localFrame } from "../timeline";
import { TOKENS } from "../tokens";

/** Chopped organic pieces tossed into Layer 3 during sub-step 0. */
const SCRAP_PIECES = [
  { x0: 142, x1: 112, y1: 150, w: 9, h: 4.5, color: TOKENS.illo.organicLeaf, isCircle: false },
  { x0: 156, x1: 135, y1: 146, w: 7, h: 7, color: TOKENS.illo.organicPeel, isCircle: true },
  { x0: 162, x1: 158, y1: 142, w: 10, h: 4.5, color: TOKENS.illo.organicGreen, isCircle: false },
  { x0: 170, x1: 182, y1: 147, w: 7, h: 7, color: TOKENS.illo.organicPeel, isCircle: true },
  { x0: 178, x1: 204, y1: 150, w: 9, h: 4.5, color: TOKENS.illo.organicLeaf, isCircle: false },
  { x0: 152, x1: 146, y1: 138, w: 8, h: 4.2, color: TOKENS.illo.organicLeaf, isCircle: false },
  { x0: 168, x1: 172, y1: 138, w: 8, h: 4.2, color: TOKENS.illo.organicGreen, isCircle: false },
  { x0: 160, x1: 160, y1: 134, w: 6.5, h: 6.5, color: TOKENS.illo.organicPeel, isCircle: true },
  { x0: 148, x1: 124, y1: 148, w: 7.5, h: 4, color: TOKENS.illo.organicGreen, isCircle: false },
  { x0: 174, x1: 194, y1: 148, w: 7.5, h: 4, color: TOKENS.illo.organicLeaf, isCircle: false },
] as const;

const SQUEEZE_DROPS = createSeededParticles("step2-squeeze", 6);
const EM_GRAINS = createSeededParticles("step2-em", 22);
const SCRAP_SEEDS = createSeededParticles("step2-scraps", SCRAP_PIECES.length);

export function Step2() {
  const frame = useCurrentFrame();
  const f0 = localFrame(frame, 0);
  const f1 = localFrame(frame, 1);
  const f2 = localFrame(frame, 2);
  const f3 = localFrame(frame, 3);

  // Layer 3 evolves smoothly across all 4 sub-steps:
  // s0: loose mound grows in center (y=154 → peak y=132)
  // s1: mound spreads outward across full bin width into fluffy 3–5 cm layer (y=114..154)
  // s2: EM bran coat settles on top surface (y=112..114)
  // s3: PressPlate compresses Layer 3 down from y=114 → y=120 with elastic rebound
  const moundBuild = clampInterp(f0, [STEP2_TL.moundBuildStart, STEP2_TL.moundBuildEnd], [0, 1], EASE.out);
  const spreadT = f1 >= 0 ? segProgress(f1, STEP2_TL.spreaderStart, STEP2_TL.spreaderEnd, EASE.inOut) : 0;

  // Layer 3 compaction in s3
  const p1 = f3 >= 0 ? Math.sin(segProgress(f3, 36, 76) * Math.PI) : 0;
  const p2 = f3 >= 0 ? segProgress(f3, STEP2_TL.press2Down - 18, STEP2_TL.press2Down + 12, EASE.out) : 0;
  const pressPush = f3 >= 0 ? Math.max(p1 * 0.65, p2) : 0;
  const compressedTopY = 114 + pressPush * 6.5; // 114 → 120.5

  // Top surface curve of Layer 3:
  // In s0: flat edges at y=154, center dome rises by moundBuild * 22px (to y=132)
  // In s1: edges rise from 154 → 114 as center levels from 132 → 114
  const edgeY = f1 < 0 ? 154 : clampInterp(spreadT, [0, 1], [154, 114], EASE.smooth);
  const centerY =
    f1 < 0
      ? 154 - moundBuild * 22
      : f3 < 0
        ? clampInterp(spreadT, [0, 1], [132, 114], EASE.smooth)
        : compressedTopY;
  const layerEdgeY = f3 < 0 ? edgeY : compressedTopY;

  // Sub-step 0: compact scrap bundle squeezed above mouth -> drops water first, then scraps fall
  const squeezeBundleOp =
    f0 >= 0 && f0 <= STEP2_TL.squeezeEnd + 26
      ? clampInterp(f0, [0, 14], [0, 1], EASE.out) *
        (1 - clampInterp(f0, [STEP2_TL.squeezeEnd, STEP2_TL.squeezeEnd + 26], [0, 1], EASE.in))
      : 0;
  const squeezeCompress =
    f0 >= 0 && f0 <= STEP2_TL.squeezeEnd + 18
      ? Math.sin(clampInterp(f0, [10, STEP2_TL.squeezeEnd], [0, Math.PI * 2])) * 0.14
      : 0;
  const squeezeOp =
    f0 < STEP2_TL.squeezeEnd + 18
      ? clampInterp(f0, [STEP2_TL.squeezeStart, STEP2_TL.squeezeStart + 10], [0, 1]) *
        (1 - clampInterp(f0, [STEP2_TL.squeezeEnd, STEP2_TL.squeezeEnd + 18], [0, 1]))
      : 0;

  // Sub-step 1: Hand enters cleanly from above bin rim (y=28 -> 114) and spreads scraps outward
  const spreaderVis =
    f1 >= STEP2_TL.spreaderEnter && f1 <= STEP2_TL.spreaderExit
      ? clampInterp(f1, [STEP2_TL.spreaderEnter, STEP2_TL.spreaderEnter + 14], [0, 1], EASE.out) *
        (1 - clampInterp(f1, [STEP2_TL.spreaderExit - 18, STEP2_TL.spreaderExit], [0, 1], EASE.in))
      : 0;
  const spreadSweep =
    f1 >= 0
      ? Math.sin(segProgress(f1, STEP2_TL.spreaderStart, STEP2_TL.spreaderEnd, EASE.inOut) * Math.PI * 2) * 52
      : 0;
  const spreaderY =
    f1 >= 0
      ? clampInterp(f1, [STEP2_TL.spreaderEnter, STEP2_TL.spreaderStart], [28, 114], EASE.out) -
        clampInterp(f1, [STEP2_TL.spreaderEnd, STEP2_TL.spreaderExit], [0, 82], EASE.in)
      : 28;

  // Sub-step 2: EM Bottle entrance (`scale 0.96 -> 1`), 3 shakes, exit
  const bottleVis =
    f2 >= 0 && f2 <= STEP2_TL.bottleExitEnd
      ? clampInterp(f2, [0, 24], [0, 1], EASE.out) *
        (1 - clampInterp(f2, [STEP2_TL.bottleExitStart, STEP2_TL.bottleExitEnd], [0, 1], EASE.in))
      : 0;
  const bottleScale = clampInterp(f2, [0, 24], [0.96, 1], EASE.out);
  const bottleEnterY = clampInterp(f2, [0, 26], [-8, 12], EASE.out);
  const bottleExitY = clampInterp(f2, [STEP2_TL.bottleExitStart, STEP2_TL.bottleExitEnd], [0, -18], EASE.in);
  const bottleY = bottleEnterY + bottleExitY;
  // Tilts upside down (-122deg → mouth faces down-left into bin) + 3 rhythmic shakes
  const baseTilt =
    f2 < STEP2_TL.bottleReady
      ? clampInterp(f2, [8, STEP2_TL.bottleReady], [0, -126], EASE.inOut)
      : f2 <= STEP2_TL.shakeEnd
        ? -126 + Math.sin(((f2 - STEP2_TL.shakeStart) / (STEP2_TL.shakeEnd - STEP2_TL.shakeStart)) * Math.PI * 6) * 11
        : clampInterp(f2, [STEP2_TL.shakeEnd, STEP2_TL.bottleExitEnd], [-126, 0], EASE.inOut);
  const bottleX = 152 + Math.sin(clampInterp(f2, [STEP2_TL.shakeStart, STEP2_TL.shakeEnd], [0, Math.PI * 2])) * 14;
  const mouth = getBottleMouth(bottleX, bottleY, baseTilt);

  // Bran coat accumulation on top of Layer 3
  const branThick = frame >= S2 ? clampInterp(f2, [45, 200], [0, 3], EASE.smooth) : 0;

  // Sub-step 3: PressPlate vertical choreography with anticipation & 2-beat compression
  const pressVis =
    f3 >= 0 && f3 <= STEP2_TL.pressExitEnd
      ? clampInterp(f3, [0, 20], [0, 1], EASE.out) *
        (1 - clampInterp(f3, [STEP2_TL.pressExitStart + 18, STEP2_TL.pressExitEnd], [0, 1], EASE.in))
      : 0;
  const pressY = (() => {
    if (f3 < 0) return 60;
    if (f3 < 26) return clampInterp(f3, [0, 26], [62, 102], EASE.out);
    if (f3 < 36) return clampInterp(f3, [26, 36], [102, 97], EASE.inOut); // anticipation lift
    if (f3 < 56) return clampInterp(f3, [36, 56], [97, 111], EASE.in); // press 1
    if (f3 < 86) return clampInterp(f3, [56, 86], [111, 102], EASE.out); // release
    if (f3 < 112) return clampInterp(f3, [86, 112], [102, 113], EASE.inOut); // press 2 deep
    if (f3 < 155) return 113; // hold compressed
    return clampInterp(f3, [155, STEP2_TL.pressExitEnd], [113, 62], EASE.out);
  })();

  // Dashed slot for next layer fades in cleanly after press exits
  const nextSlotOp = f3 >= STEP2_TL.nextLayerSlotStart ? clampInterp(f3, [STEP2_TL.nextLayerSlotStart, 240], [0, 0.58], EASE.out) : 0;
  const highlight3to5 = f1 >= 20 && frame < S2;

  return (
    <StageCanvas>
      <BinRig
        idPrefix="step2"
        newspaperOpacity={1}
        cardboard
        squashY={1 - p1 * 0.004 - p2 * 0.005}
        outside={
          <defs>
            <OrganicPatternDef id="step2-org" />
          </defs>
        }
        overlay={
          <>
            <Bracket x={59} y1={82} y2={226} text="~70%" />
            {/* 3–5 cm Layer 3 thickness dimension on the right (aligns directly with Layer 3 y=114..154) */}
            <g>
              <path
                d="M252 114 L262 114 M252 154 L262 154 M257 114 L257 154"
                fill="none"
                stroke={highlight3to5 ? TOKENS.accent : TOKENS.muted}
                strokeWidth={highlight3to5 ? "1.6" : "1.2"}
              />
              <text
                x="265"
                y="131"
                fontSize="10"
                fontWeight={highlight3to5 ? "700" : "500"}
                fill={highlight3to5 ? TOKENS.accentDark : TOKENS.illo.label}
              >
                3–5
              </text>
              <text
                x="265"
                y="143"
                fontSize="10"
                fontWeight={highlight3to5 ? "700" : "500"}
                fill={highlight3to5 ? TOKENS.accentDark : TOKENS.illo.label}
              >
                cm
              </text>
            </g>

            {/* Sub-step 2: EM Bottle emitting grains directly from its rotated mouth */}
            {bottleVis > 0.01 && (
              <Bottle x={bottleX} y={bottleY} tiltDeg={baseTilt} scale={bottleScale} opacity={bottleVis} />
            )}

            {/* Sub-step 0: Organic scrap bundle gently squeezed above bin opening -> drops excess water */}
            {squeezeBundleOp > 0.01 && (
              <g
                opacity={squeezeBundleOp}
                transform={`translate(160, 24) scale(${(1 - squeezeCompress).toFixed(4)}, ${(1 + squeezeCompress).toFixed(4)}) translate(-160, -24)`}
              >
                <ellipse cx="160" cy="24" rx="18" ry="10" fill={TOKENS.illo.organic} />
                <rect x="147" y="19" width="11" height="4.5" rx="2" fill={TOKENS.illo.organicLeaf} />
                <circle cx="166" cy="22" r="3.2" fill={TOKENS.illo.organicPeel} />
                <rect x="157" y="26" width="10" height="4" rx="1.8" fill={TOKENS.illo.organicGreen} />
              </g>
            )}
            {squeezeOp > 0.01 &&
              SQUEEZE_DROPS.map((d) => {
                const cy = 32 + ((f0 * (1.2 + d.rSpeed * 0.5) + d.rPhase * 30) % 34);
                const cx = 148 + d.rx * 24;
                return (
                  <path
                    key={d.id}
                    d={`M${cx.toFixed(1)} ${cy.toFixed(1)} q2.2 3.8 0 5.5 q-2.2 -1.7 0 -5.5z`}
                    fill={TOKENS.illo.waterLight}
                    opacity={squeezeOp * 0.88}
                  />
                );
              })}
          </>
        }
      >
        {/* Existing compacted Layers 1 & 2 */}
        <rect x="70" y="190" width="180" height="36" fill="url(#step2-org)" />
        <rect x="70" y="190" width="180" height="2.5" fill={TOKENS.illo.cardboardLine} />
        <rect x="70" y="154" width="180" height="36" fill="url(#step2-org)" />
        <rect x="70" y="154" width="180" height="2.5" fill={TOKENS.illo.cardboardLine} />

        {/* Dynamic Layer 3: mound in s0 -> continuous spread in s1 -> compressed in s3 */}
        {(moundBuild > 0.01 || frame >= S1) && (
          <g>
            <path
              d={`M70 ${layerEdgeY.toFixed(2)} Q160 ${(2 * centerY - layerEdgeY).toFixed(2)} 250 ${layerEdgeY.toFixed(2)} L250 154 L70 154 Z`}
              fill="url(#step2-org)"
            />
            {branThick > 0.05 && (
              <path
                d={`M70 ${(layerEdgeY - branThick).toFixed(2)} Q160 ${(2 * (centerY - branThick) - (layerEdgeY - branThick)).toFixed(2)} 250 ${(layerEdgeY - branThick).toFixed(2)} L250 ${layerEdgeY.toFixed(2)} Q160 ${(2 * centerY - layerEdgeY).toFixed(2)} 70 ${layerEdgeY.toFixed(2)} Z`}
                fill={TOKENS.illo.cardboardLine}
                opacity={0.92}
              />
            )}
          </g>
        )}

        {/* Sub-step 0: Chopped organic waste pieces arcing & settling onto the growing mound */}
        {f0 >= 0 &&
          f0 < S1 &&
          SCRAP_PIECES.map((p, i) => {
            const start = STEP2_TL.scrapStart + i * STEP2_TL.scrapStagger;
            const t = segProgress(f0, start, start + STEP2_TL.scrapFallDur, EASE.in);
            if (t <= 0) return null;
            const pos = parabolicArc(t, p.x0, 32, p.x1, p.y1, 14);
            const rot = (SCRAP_SEEDS[i]!.rRot - 0.5) * 140 * (1 - t);
            // Fade softly into mound once spread starts
            const fadeIntoLayer = 1 - clampInterp(spreadT, [0, 0.35], [0, 1]);
            const op = clampInterp(f0, [start, start + 6], [0, 1]) * fadeIntoLayer;
            return p.isCircle ? (
              <circle key={i} cx={pos.x} cy={pos.y} r={p.w / 2} fill={p.color} opacity={op} />
            ) : (
              <rect
                key={i}
                x={pos.x - p.w / 2}
                y={pos.y - p.h / 2}
                width={p.w}
                height={p.h}
                rx="1.5"
                transform={`rotate(${rot.toFixed(1)} ${pos.x.toFixed(1)} ${pos.y.toFixed(1)})`}
                fill={p.color}
                opacity={op}
              />
            );
          })}

        {/* Sub-step 1: Hand gently spreading the mound flat */}
        {spreaderVis > 0.01 && (
          <SmoothHand x={160 + spreadSweep} y={spreaderY} tiltDeg={spreadSweep * 0.18} opacity={spreaderVis} />
        )}

        {/* Sub-step 2: EM bran particles pouring straight from bottle mouth down onto Layer 3 surface */}
        {f2 >= STEP2_TL.shakeStart &&
          f2 <= STEP2_TL.bottleExitStart + 18 &&
          EM_GRAINS.map((g) => {
            const period = 36 + g.rSpeed * 12;
            const cycleFrame = f2 - STEP2_TL.shakeStart;
            if (cycleFrame < 0) return null;
            const age = (cycleFrame + g.rPhase * period) % period;
            const progress = age / period;
            const startX = mouth.x + (g.rx - 0.5) * 8;
            const startY = mouth.y + 3;
            const targetX = 160 + (g.rx - 0.5) * 116;
            const targetY = 113;
            const x = startX + (targetX - startX) * progress;
            // Gravity fall: y accelerates quadratically
            const y = startY + (targetY - startY) * (progress * progress);
            const activeEmit = f2 <= STEP2_TL.shakeEnd ? 1 : 1 - clampInterp(f2, [STEP2_TL.shakeEnd, STEP2_TL.bottleExitStart + 16], [0, 1]);
            const op =
              activeEmit *
              clampInterp(progress, [0, 0.12], [0, 1]) *
              (1 - clampInterp(progress, [0.85, 1], [0, 1]));
            return (
              <circle
                key={g.id}
                cx={x}
                cy={y}
                r={1.3 + g.rSize * 0.9}
                fill={g.id % 3 === 0 ? TOKENS.illo.bran : TOKENS.illo.cardboardLine}
                opacity={op}
              />
            );
          })}

        {/* Sub-step 3: PressPlate compressing Layer 3 */}
        {pressVis > 0.01 && <PressPlate y={pressY} opacity={pressVis} />}

        {/* Sub-step 3: Dashed outline indicating slot for next layer */}
        {nextSlotOp > 0.01 && (
          <rect
            x="76"
            y="84"
            width="168"
            height="34"
            fill="none"
            stroke={TOKENS.muted}
            strokeWidth="1.2"
            strokeDasharray="3.5 3.5"
            opacity={nextSlotOp}
          />
        )}
      </BinRig>
    </StageCanvas>
  );
}
