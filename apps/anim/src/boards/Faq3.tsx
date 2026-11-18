import { useCurrentFrame } from "remotion";
import { BIN_PIVOT, BinRig, OrganicPatternDef, StageCanvas } from "../components/BinRig";
import {
  BagCollar,
  Bucket,
  LeaderLabel,
  Lid,
  PotSprout,
  RubbishBody,
  WateringCan,
  getWateringCanTip,
} from "../components/props";
import {
  EASE,
  clampInterp,
  createSeededParticles,
  parabolicArc,
  rotatePoint,
  segProgress,
} from "../physics";
import { FAQ3_TL, S1, S2, localFrame } from "../timeline";
import { TOKENS } from "../tokens";

const SEEP_DROPS = [
  { x: 118, y0: 128, phase: 0 },
  { x: 150, y0: 124, phase: 0.25 },
  { x: 182, y0: 130, phase: 0.52 },
  { x: 206, y0: 122, phase: 0.78 },
] as const;

const PAPER_BALLS_STATIC = [
  [108, 241],
  [134, 241.5],
  [160, 241],
  [186, 241.5],
  [212, 241],
] as const;

const BUCKET_SPLASH = createSeededParticles("faq3-splash", 10);
const WATER_DROPS = createSeededParticles("faq3-water-can", 14);
const POT_SPLASH = createSeededParticles("faq3-pot-splash", 6);

export function Faq3() {
  const frame = useCurrentFrame();
  const f0 = localFrame(frame, 0);
  const f1 = localFrame(frame, 1);
  const f2 = localFrame(frame, 2);

  // Subtle horizontal camera pan (no scaling down of bin!) so bucket / watering can / pot sit cleanly clear of bin wall
  const camX = (() => {
    if (frame < S1) return 0;
    if (frame < S2) return clampInterp(f1, [0, FAQ3_TL.camPanEnd], [0, -22], EASE.inOut);
    return clampInterp(f2, [0, FAQ3_TL.camReturnEnd], [-22, -28], EASE.inOut);
  })();

  // Lid: opens in s0 -> slides slightly left & tilted back (-12x, -4y, -2.5deg) in s1 to expose pour gap -> closes tight in s2
  const lidY = (() => {
    if (frame < S1) return clampInterp(f0, [0, FAQ3_TL.lidOpenEnd], [0, -22], EASE.backOut);
    if (frame < S2) return clampInterp(f1, [0, FAQ3_TL.lidDropReady], [-22, -4], EASE.inOut);
    return clampInterp(f2, [0, 42], [-4, 0], EASE.out);
  })();
  const lidX = (() => {
    if (frame < S1) return 0;
    if (frame < S2) return clampInterp(f1, [10, FAQ3_TL.lidDropReady + 12], [0, -14], EASE.inOut);
    return clampInterp(f2, [0, 42], [-14, 0], EASE.out);
  })();
  const lidHinge = (() => {
    if (frame < S1) return 0;
    if (frame < S2) return clampInterp(f1, [10, FAQ3_TL.lidDropReady + 12], [0, -2.6], EASE.inOut);
    return clampInterp(f2, [0, 42], [-2.6, 0], EASE.out);
  })();

  // Bin tilt: 0° -> slight anticipation (-0.8°) -> smooth 9.5° pour around bottom-right pivot -> smooth return to 0° in s2
  const tiltDeg = (() => {
    if (frame < S1) return 0;
    if (frame < S2) {
      if (f1 < FAQ3_TL.tiltStart) return 0;
      if (f1 < FAQ3_TL.tiltStart + 10) {
        return clampInterp(f1, [FAQ3_TL.tiltStart, FAQ3_TL.tiltStart + 10], [0, -0.8], EASE.inOut);
      }
      return clampInterp(f1, [FAQ3_TL.tiltStart + 10, FAQ3_TL.tiltPeak], [-0.8, 9.5], EASE.inOut);
    }
    return clampInterp(f2, [FAQ3_TL.untiltStart, FAQ3_TL.untiltEnd], [9.5, 0], EASE.inOut);
  })();

  // Leachate level inside bin: rises above cans (252 -> 225) in s0, drains down (225 -> 249) during pour in s1
  const binPoolTopY = (() => {
    if (frame < S1) return clampInterp(f0, [16, FAQ3_TL.levelRiseEnd], [250, 224], EASE.smooth);
    if (frame < S2) return clampInterp(f1, [FAQ3_TL.pourStart, FAQ3_TL.pourEnd], [224, 249], EASE.out);
    return 249;
  })();

  // s0 dashed highlight & warning label
  const s0HighlightOp =
    clampInterp(f0, [FAQ3_TL.highlightIn, FAQ3_TL.highlightIn + 22], [0, 1], EASE.out) *
    (1 - clampInterp(frame, [S1 - 12, S1 + 10], [0, 1], EASE.in));

  // Bucket on the right (cx = 294, bottomY = 262); exits cleanly in f2 0..34 BEFORE watering can enters
  const bucketCx = 294;
  const bucketBottomY = 262;
  const bucketOp =
    frame >= S1
      ? clampInterp(f1, [4, FAQ3_TL.bucketInEnd], [0, 1], EASE.out) *
        (1 - clampInterp(f2, [0, 34], [0, 1], EASE.in))
      : 0;
  const bucketScale =
    frame < S2
      ? clampInterp(f1, [4, FAQ3_TL.bucketInEnd], [0.95, 1], EASE.out)
      : clampInterp(f2, [0, 34], [1, 0.94], EASE.in);

  const bucketFill = frame >= S1 ? clampInterp(f1, [FAQ3_TL.pourStart + 16, FAQ3_TL.fillEnd], [0.04, 0.78], EASE.out) : 0;
  const waterSurfaceY = bucketBottomY - bucketFill * 56;

  // Pour stream physics from exact tilted bin upper-right lip (244, 50) -> bucket mouth (294, waterSurfaceY)
  const lipWorld = rotatePoint(244, 50, BIN_PIVOT.x, BIN_PIVOT.y, tiltDeg);
  const pourLead = frame >= S1 ? segProgress(f1, FAQ3_TL.pourStart, FAQ3_TL.pourStart + 24, EASE.in) : 0;
  const pourPinch = frame >= S1 ? segProgress(f1, FAQ3_TL.pourEnd - 24, FAQ3_TL.pourEnd - 8, EASE.inOut) : 0;
  const pourTail =
    frame >= S1
      ? f1 > FAQ3_TL.pourEnd - 12
        ? segProgress(f1, FAQ3_TL.pourEnd - 12, FAQ3_TL.pourEnd + 2, EASE.in)
        : 0
      : 1;
  const streamActive = frame >= S1 && pourLead > 0.02 && pourTail < 0.98;
  const streamHitWater = pourLead > 0.88 && pourTail < 0.35;

  // Sub-step 2: Watering can (clear of bin wall!) + PotSprout + "~1:100" label enter AFTER bucket exits
  const s2Vis = frame >= S2 ? clampInterp(f2, [38, 80], [0, 1], EASE.out) : 0;
  const canTilt = frame >= S2 ? clampInterp(f2, [50, FAQ3_TL.waterPourStart + 18], [8, 22], EASE.inOut) : 8;
  const canX = 250;
  const canY = 126;
  const potX = 294;
  const potY = 208;
  const tip = getWateringCanTip(canX, canY, canTilt);
  const sproutGrowth = frame >= S2 ? clampInterp(f2, [FAQ3_TL.waterPourStart + 18, FAQ3_TL.waterPourEnd], [0.76, 1.08], EASE.backOut) : 0.76;
  const swayFade = 1 - clampInterp(f2, [FAQ3_TL.waterPourEnd - 10, 244], [0, 1], EASE.smooth);
  const sproutSway = frame >= S2 && f2 >= FAQ3_TL.waterPourStart ? Math.sin((f2 - FAQ3_TL.waterPourStart) * 0.14) * 2.5 * swayFade : 0;

  return (
    <StageCanvas camX={camX}>
      {/* Bin rig (no scaling down when tilting!) */}
      <BinRig
        idPrefix="faq3"
        tiltDeg={tiltDeg}
        newspaperOpacity={1}
        newspaperColor={TOKENS.illo.waterPale}
        cardboard
        underlay={
          <g>
            {/* Bottom pooled leachate level; counter-rotates gently toward horizontal gravity level when bin tilts */}
            <g transform={tiltDeg !== 0 ? `translate(160, 245) rotate(${(-tiltDeg * 0.72).toFixed(2)}) translate(-160, -245)` : undefined}>
              <rect
                x="56"
                y={binPoolTopY}
                width="208"
                height={270 - binPoolTopY}
                fill={TOKENS.illo.water}
                opacity={0.58}
              />
              {/* Subtle wavy water surface */}
              <path
                d={`M56 ${binPoolTopY.toFixed(1)} Q110 ${(binPoolTopY - 1.5 + Math.sin(frame * 0.12) * 1.4).toFixed(1)}, 160 ${binPoolTopY.toFixed(1)} T264 ${binPoolTopY.toFixed(1)}`}
                fill="none"
                stroke={TOKENS.illo.waterLight}
                strokeWidth="1.6"
                opacity={0.85}
              />
            </g>

            {/* Thin rivulet climbing along inner right wall toward lip while pouring */}
            {streamActive && (
              <path
                d="M225 238 L242 52"
                stroke={TOKENS.illo.waterLight}
                strokeWidth={(3.2 * (1 - pourTail)).toFixed(2)}
                strokeLinecap="round"
                opacity={0.85}
              />
            )}
          </g>
        }
        outside={
          <>
            <defs>
              <OrganicPatternDef id="faq3-org" />
            </defs>
            <BagCollar
              fromState="up"
              toState="flat"
              t={frame >= S2 ? clampInterp(f2, [0, 36], [0, 1], EASE.inOut) : 0}
              rightTail="flat"
              rightTailOpacity={frame >= S2 ? clampInterp(f2, [18, 38], [0, 1], EASE.smooth) : 0}
            />
          </>
        }
        overlay={
          <>
            <Lid xOffset={lidX} yOffset={lidY} hingeDeg={lidHinge} />
            {s0HighlightOp > 0.01 && (
              <g opacity={s0HighlightOp}>
                <rect
                  x="88"
                  y="224"
                  width="144"
                  height="34"
                  rx="6"
                  fill="none"
                  stroke={TOKENS.illo.water}
                  strokeWidth="1.6"
                  strokeDasharray="5 3"
                />
                <LeaderLabel from={[232, 240]} to={[256, 224]} lines={["Dịch dềnh", "quá mặt lon"]} />
              </g>
            )}
          </>
        }
      >
        {/* Static paper balls under cardboard */}
        <g stroke={TOKENS.illo.metalDark} strokeWidth="0.9" fill={TOKENS.illo.metal}>
          {PAPER_BALLS_STATIC.map(([cx, cy]) => (
            <circle key={cx} cx={cx} cy={cy} r="4.5" />
          ))}
        </g>

        <RubbishBody patternId="faq3-org" topY={82} />

        {/* Sub-step 0: Seepage droplets falling through rubbish down into leachate pool */}
        {frame < S1 &&
          SEEP_DROPS.map((d, i) => {
            const age = (f0 + d.phase * 72) % 72;
            const t = age / 72;
            const y = d.y0 + 100 * (t * t);
            const op =
              clampInterp(f0, [10, 26], [0, 1]) *
              clampInterp(t, [0, 0.15], [0, 1]) *
              (1 - clampInterp(t, [0.85, 1], [0, 1]));
            return (
              <path
                key={i}
                d={`M${d.x} ${y.toFixed(1)} q2.8 4.8 0 7 q-2.8 -2.2 0 -7z`}
                fill={TOKENS.illo.waterLight}
                opacity={op}
              />
            );
          })}
      </BinRig>

      {/* World-space Bucket & Projectile Liquid Stream (s1) */}
      {bucketOp > 0.01 && (
        <g>
          <Bucket
            idPrefix="faq3"
            cx={bucketCx}
            bottomY={bucketBottomY}
            fillFraction={bucketFill}
            ripplePhase={frame * 0.28}
            opacity={bucketOp}
            scale={bucketScale}
          />

          {/* Parabolic liquid stream from tilted bin lip to rising water surface inside bucket */}
          {streamActive && (() => {
            const x0 = lipWorld.x + 1.5;
            const y0 = lipWorld.y + 3;
            const x1 = bucketCx - 2;
            const y1 = Math.min(256, waterSurfaceY + 2);
            const steps = 16;
            const leftPts: string[] = [];
            const rightPts: string[] = [];

            for (let k = 0; k <= steps; k++) {
              const sFrac = pourTail + (pourLead - pourTail) * (k / steps);
              // Horizontal projectile x(t) slows slightly as gravity dominates vertical y(t)
              const px = x0 + (x1 - x0) * Math.pow(sFrac, 0.62);
              const py = y0 + (y1 - y0) * (0.28 * sFrac + 0.72 * sFrac * sFrac);
              // Tapered thickness: thicker at exit lip, narrower as stream accelerates downward, pinches off smoothly
              const halfW = (2.8 - 0.95 * sFrac) * Math.max(0.08, 1 - pourPinch * 0.88) * (1 - pourTail * 0.6);
              leftPts.push(`${(px - halfW).toFixed(2)} ${py.toFixed(2)}`);
              rightPts.unshift(`${(px + halfW).toFixed(2)} ${py.toFixed(2)}`);
            }
            const streamPath = `M${leftPts.join(" L")} L${rightPts.join(" L")} Z`;

            // Center highlight flow line
            const hlPts: string[] = [];
            for (let k = 0; k <= 10; k++) {
              const sFrac = pourTail + (pourLead - pourTail) * (k / 10);
              const px = x0 + (x1 - x0) * Math.pow(sFrac, 0.62);
              const py = y0 + (y1 - y0) * (0.28 * sFrac + 0.72 * sFrac * sFrac);
              hlPts.push(`${k === 0 ? "M" : "L"}${px.toFixed(2)} ${py.toFixed(2)}`);
            }

            return (
              <g>
                <path d={streamPath} fill={TOKENS.illo.waterLight} opacity={0.94} />
                <path
                  d={hlPts.join(" ")}
                  fill="none"
                  stroke={TOKENS.surface}
                  strokeWidth="1.2"
                  strokeDasharray="6 7"
                  strokeDashoffset={-(frame * 3.8)}
                  opacity={0.55}
                />
              </g>
            );
          })()}

          {/* Splash droplets & foam at the impact point inside bucket */}
          {streamHitWater && (
            <g>
              <ellipse
                cx={bucketCx - 2}
                cy={waterSurfaceY}
                rx={6 + Math.sin(frame * 0.45) * 2.2}
                ry={1.8}
                fill={TOKENS.surface}
                opacity={0.78}
              />
              {BUCKET_SPLASH.map((sp) => {
                const period = 24 + Math.floor(sp.rSpeed * 10);
                const age = (f1 + sp.rPhase * period) % period;
                const t = age / period;
                const dir = sp.rx > 0.5 ? 1 : -1;
                const spread = 5 + sp.rx * 13;
                const pos = parabolicArc(t, bucketCx - 2, waterSurfaceY, bucketCx - 2 + dir * spread, waterSurfaceY + 1, 10 + sp.rSize * 6);
                const op = Math.sin(t * Math.PI) * 0.85;
                return <circle key={sp.id} cx={pos.x} cy={pos.y} r={1.1 + sp.rSize * 0.9} fill={TOKENS.illo.waterLight} opacity={op} />;
              })}
            </g>
          )}
        </g>
      )}

      {/* Sub-step 2: Diluted leachate (~1:100) watering can + potted sprout */}
      {s2Vis > 0.01 && (
        <g opacity={s2Vis}>
          <LeaderLabel from={[296, 118]} to={[302, 92]} lines={["Pha loãng", "~1:100"]} />
          <PotSprout x={potX} y={potY} w={56} growth={sproutGrowth} swayDeg={sproutSway} />
          <WateringCan x={canX} y={canY} tiltDeg={canTilt} scale={0.96} />

          {/* Seeded water drops from exact sprinkler rose tip -> pot soil */}
          {f2 >= FAQ3_TL.waterPourStart &&
            f2 <= FAQ3_TL.waterPourEnd + 16 &&
            WATER_DROPS.map((d) => {
              const period = 28 + d.rSpeed * 8;
              const age = (f2 - FAQ3_TL.waterPourStart + d.rPhase * period) % period;
              const t = age / period;
              const activeWater = 1 - clampInterp(f2, [FAQ3_TL.waterPourEnd - 10, FAQ3_TL.waterPourEnd + 16], [0, 1]);
              const sx = tip.x - 1.5 + (d.rx - 0.5) * 4;
              const sy = tip.y + 3;
              const tx = potX + 18 + d.rx * 20;
              const ty = potY + 3;
              const x = sx + (tx - sx) * t;
              const y = sy + (ty - sy) * (t * t);
              const op = activeWater * clampInterp(t, [0, 0.12], [0, 1]) * (1 - clampInterp(t, [0.88, 1], [0, 1]));
              return (
                <path
                  key={d.id}
                  d={`M${x.toFixed(1)} ${y.toFixed(1)} q2 3.4 0 5 q-2 -1.6 0 -5z`}
                  fill={TOKENS.illo.water}
                  opacity={op}
                />
              );
            })}

          {/* Micro-splashes on pot soil surface */}
          {f2 >= FAQ3_TL.waterPourStart + 18 &&
            f2 <= FAQ3_TL.waterPourEnd &&
            POT_SPLASH.map((sp) => {
              const period = 22;
              const age = (f2 + sp.rPhase * period) % period;
              const t = age / period;
              const sx = potX + 22 + sp.rx * 12;
              const sy = potY + 2;
              const pos = parabolicArc(t, sx, sy, sx + (sp.rx - 0.5) * 14, sy, 5 + sp.rSize * 3);
              return (
                <circle
                  key={sp.id}
                  cx={pos.x}
                  cy={pos.y}
                  r={1.1}
                  fill={TOKENS.illo.waterLight}
                  opacity={Math.sin(t * Math.PI) * 0.8}
                />
              );
            })}
        </g>
      )}
    </StageCanvas>
  );
}
