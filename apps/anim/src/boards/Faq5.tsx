import { useCurrentFrame } from "remotion";
import { StageCanvas } from "../components/BinRig";
import { VoAudioTrack } from "../components/VoAudioTrack";
import { PotSprout, WateringCan, getWateringCanTip } from "../components/props";
import {
  EASE,
  clampInterp,
  createSeededParticles,
  parabolicArc,
  segProgress,
} from "../physics";
import { FAQ5_TL, S1, S2, localFrame } from "../timeline";
import { FONT_FAMILY, TOKENS } from "../tokens";
import { mapBoardFrame, type BoardLocale } from "../voAlignment";

const SCRAP_DROPS = createSeededParticles("faq5-scraps", 10);
const WATER_DROPS = createSeededParticles("faq5-water", 12);

export function Faq5({ locale = "vi", voiced = false }: { locale?: BoardLocale; voiced?: boolean }) {
  const rawFrame = useCurrentFrame();
  const frame = mapBoardFrame(rawFrame, "Faq5", locale, voiced);
  const f0 = localFrame(frame, 0);
  const f1 = localFrame(frame, 1);
  const f2 = localFrame(frame, 2);

  // Focus transition smoothly highlights card (a) -> (b) -> (c) without jumping
  const t0to1 = frame >= S1 ? segProgress(f1, 0, FAQ5_TL.transitionFrames, EASE.inOut) : 0;
  const t1to2 = frame >= S2 ? segProgress(f2, 0, FAQ5_TL.transitionFrames, EASE.inOut) : 0;

  const focusA = 1 - t0to1;
  const focusB = t0to1 * (1 - t1to2);
  const focusC = t1to2;

  const cardStyle = (focus: number) => ({
    scale: 0.96 + 0.06 * focus,
    opacity: 0.68 + 0.32 * focus,
    borderColor: focus > 0.5 ? TOKENS.primary : TOKENS.border,
    borderWidth: focus > 0.5 ? 4.5 : 2.5,
  });

  // Card geometry comfortably inside centered 320:280 safe crop [343, 1577] (>= 30px side margins)
  const cardW = 368;
  const cardH = 660;
  const cardY = 210;
  const xs = [380, 776, 1172] as const;
  const figScale = 2.18; // 150 * 2.18 = 327×305 drawing inside 368×660 card

  // === Card (a) physics: bin tilts 78° -> 112°, solid scraps fall in pot, soil rises & sprout grows ===
  const binTiltA = clampInterp(f0, [FAQ5_TL.aTiltStart, FAQ5_TL.aTiltPeak], [78, 112], EASE.inOut);
  const moundH = clampInterp(f0, [FAQ5_TL.aScrapsStart + 25, FAQ5_TL.aScrapsEnd], [0.42, 1.0], EASE.out);
  const sproutA = clampInterp(f0, [FAQ5_TL.aSproutStart, FAQ5_TL.aSproutEnd], [0.48, 1.05], EASE.backOut);
  const swayA = f0 >= FAQ5_TL.aSproutStart ? Math.sin((f0 - FAQ5_TL.aSproutStart) * 0.12) * 3 : 0;

  // === Card (b) physics: tied bag anticipates (crouch) -> parabolic leap -> bin lid opens & snaps shut ===
  const bagJumpT = frame >= S1 ? segProgress(f1, FAQ5_TL.bBagJumpStart, FAQ5_TL.bBagLand, EASE.inOut) : 0;
  const crouchP =
    frame >= S1 && f1 >= FAQ5_TL.bBagCrouchStart && f1 < FAQ5_TL.bBagJumpStart
      ? Math.sin(segProgress(f1, FAQ5_TL.bBagCrouchStart, FAQ5_TL.bBagJumpStart) * Math.PI)
      : 0;
  const bagScaleX = 1 + crouchP * 0.14 - Math.sin(bagJumpT * Math.PI) * 0.1;
  const bagScaleY = 1 - crouchP * 0.14 + Math.sin(bagJumpT * Math.PI) * 0.1;
  const bagArc = parabolicArc(bagJumpT, 40, 110, 116, 98, 42);
  const bagLandFade = 1 - clampInterp(bagJumpT, [0.78, 0.98], [0, 1]);
  const binLidOpenB =
    frame >= S1
      ? segProgress(f1, FAQ5_TL.bLidOpenStart, FAQ5_TL.bLidOpenStart + 28, EASE.backOut) *
        (1 - segProgress(f1, 134, FAQ5_TL.bLidCloseEnd, EASE.inOut))
      : 0;
  const binLidAngleB = -binLidOpenB * 58;

  // === Card (c) physics: watering can pours seeded drops onto pot soil, sprout grows ===
  const canTiltC = frame >= S2 ? clampInterp(f2, [FAQ5_TL.cCanTiltStart, FAQ5_TL.cCanTiltPeak], [6, 22], EASE.inOut) : 6;
  const canX = 18;
  const canY = 44;
  const tipC = getWateringCanTip(canX, canY, canTiltC);
  const sproutC = frame >= S2 ? clampInterp(f2, [FAQ5_TL.cPourStart + 22, FAQ5_TL.cPourEnd], [0.74, 1.06], EASE.backOut) : 0.74;
  const swayFadeC = 1 - clampInterp(f2, [FAQ5_TL.cPourEnd, 244], [0, 1], EASE.smooth);
  const swayC = frame >= S2 && f2 >= FAQ5_TL.cPourStart ? Math.sin((f2 - FAQ5_TL.cPourStart) * 0.14) * 2.8 * swayFadeC : 0;

  const sA = cardStyle(focusA);
  const sB = cardStyle(focusB);
  const sC = cardStyle(focusC);

  return (
    <>
      <VoAudioTrack boardId="Faq5" locale={locale} voiced={voiced} />
      <StageCanvas rawCoords>
      {/* Card (a): Vùi chậu cây */}
      <g
        opacity={sA.opacity}
        transform={`translate(${xs[0] + cardW / 2}, ${cardY + cardH / 2}) scale(${sA.scale.toFixed(4)}) translate(${-(xs[0] + cardW / 2)}, ${-(cardY + cardH / 2)})`}
      >
        <rect
          x={xs[0]}
          y={cardY}
          width={cardW}
          height={cardH}
          rx="28"
          fill={TOKENS.surface}
          stroke={sA.borderColor}
          strokeWidth={sA.borderWidth}
        />
        <text x={xs[0] + 24} y={cardY + 56} fontSize="25" fontWeight="700" fontFamily={FONT_FAMILY} fill={TOKENS.ink}>
          {locale === "en" ? "(a) Bury in planter" : "(a) Vùi chậu cây"}
        </text>
        <g transform={`translate(${xs[0] + 20}, ${cardY + 125}) scale(${figScale})`}>
          <ellipse cx="80" cy="134" rx="64" ry="4" fill={TOKENS.divider} />

          {/* Tipped bin pouring solid fermented scraps */}
          <g transform={`translate(103, 64) rotate(${binTiltA.toFixed(2)}) translate(-33, -58)`}>
            <path d="M14 118 L52 118 L58 58 L8 58 Z" fill={TOKENS.illo.binInner} />
            <path d="M11 57 L55 57 L54 88 L12 88 Z" fill={TOKENS.illo.organic} />
            <rect x="15" y="62" width="7" height="3.5" rx="1.5" fill={TOKENS.illo.organicLeaf} />
            <circle cx="34" cy="64" r="2.2" fill={TOKENS.illo.organicPeel} />
            <rect x="41" y="70" width="7" height="3.5" rx="1.5" fill={TOKENS.illo.organicGreen} />
            <circle cx="24" cy="78" r="2" fill={TOKENS.illo.organicPeel} />
            <path
              d="M8 58 L14 118 L52 118 L58 58"
              fill="none"
              stroke={TOKENS.illo.binWall}
              strokeWidth="4"
              strokeLinejoin="round"
            />
          </g>

          {/* Falling solid scraps into the pot mouth */}
          {f0 >= FAQ5_TL.aScrapsStart &&
            f0 <= FAQ5_TL.aScrapsEnd + 16 &&
            SCRAP_DROPS.map((sc) => {
              const period = 34 + sc.rSpeed * 8;
              const age = (f0 - FAQ5_TL.aScrapsStart + sc.rPhase * period) % period;
              const t = age / period;
              const activeDump = 1 - clampInterp(f0, [FAQ5_TL.aScrapsEnd - 12, FAQ5_TL.aScrapsEnd + 16], [0, 1]);
              const pos = parabolicArc(t, 88 + sc.rx * 12, 72, 102 + sc.rx * 16, 105, 8);
              const op = activeDump * clampInterp(t, [0, 0.14], [0, 1]) * (1 - clampInterp(t, [0.85, 1], [0, 1]));
              const fill =
                sc.id % 3 === 0
                  ? TOKENS.illo.organicLeaf
                  : sc.id % 3 === 1
                    ? TOKENS.illo.organicPeel
                    : TOKENS.illo.organic;
              return sc.id % 2 === 0 ? (
                <rect
                  key={sc.id}
                  x={pos.x - 3}
                  y={pos.y - 1.8}
                  width="6"
                  height="3.5"
                  rx="1.5"
                  transform={`rotate(${(sc.rRot * 180 + t * 90).toFixed(1)} ${pos.x.toFixed(1)} ${pos.y.toFixed(1)})`}
                  fill={fill}
                  opacity={op}
                />
              ) : (
                <circle key={sc.id} cx={pos.x} cy={pos.y} r="2.2" fill={fill} opacity={op} />
              );
            })}

          <PotSprout x={90} y={103} w={44} soilMound moundHeight={moundH} growth={sproutA} swayDeg={swayA} />
        </g>

        <g transform={`translate(${xs[0] + cardW / 2 - 110}, ${cardY + 572})`}>
          <rect width="220" height="52" rx="26" fill={TOKENS.faq.disposal.bg} />
          <text
            x="110"
            y="34"
            textAnchor="middle"
            fontSize="23"
            fontWeight="600"
            fontFamily={FONT_FAMILY}
            fill={TOKENS.faq.disposal.fg}
          >
            {locale === "en" ? "Feed plants" : "Bón cho cây"}
          </text>
        </g>
      </g>

      {/* Card (b): Bỏ rác sinh hoạt */}
      <g
        opacity={sB.opacity}
        transform={`translate(${xs[1] + cardW / 2}, ${cardY + cardH / 2}) scale(${sB.scale.toFixed(4)}) translate(${-(xs[1] + cardW / 2)}, ${-(cardY + cardH / 2)})`}
      >
        <rect
          x={xs[1]}
          y={cardY}
          width={cardW}
          height={cardH}
          rx="28"
          fill={TOKENS.surface}
          stroke={sB.borderColor}
          strokeWidth={sB.borderWidth}
        />
        <text x={xs[1] + 24} y={cardY + 56} fontSize="25" fontWeight="700" fontFamily={FONT_FAMILY} fill={TOKENS.ink}>
          {locale === "en" ? "(b) Household trash" : "(b) Bỏ rác sinh hoạt"}
        </text>
        <g transform={`translate(${xs[1] + 20}, ${cardY + 125}) scale(${figScale})`}>
          <ellipse cx="75" cy="134" rx="64" ry="4" fill={TOKENS.divider} />

          {/* Faint origin silhouette + dashed trajectory arc once bag leaps into collection bin */}
          {bagJumpT > 0.1 && (
            <g opacity={clampInterp(bagJumpT, [0.1, 0.5], [0, 0.25])}>
              <path
                d="M22 132 C14 120 16 92 34 84 L40 76 L46 84 C64 92 66 120 58 132 Z"
                fill="none"
                stroke={TOKENS.illo.wasteBagShade}
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <path
                d="M40 72 Q78 30 112 62"
                fill="none"
                stroke={TOKENS.accent}
                strokeWidth="1.4"
                strokeDasharray="3 3"
              />
            </g>
          )}

          {/* Arrow cue */}
          <path
            d="M68 104 L85 104 M80 99 L85 104 L80 109"
            fill="none"
            stroke={TOKENS.accent}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={1 - bagJumpT * 0.4}
          />

          {/* Green household collection bin with hinged opening lid */}
          <rect x="92" y="76" width="48" height="58" rx="5" fill={TOKENS.primary} />
          <path
            d="M104 90 L104 124 M116 90 L116 124 M128 90 L128 124"
            stroke={TOKENS.illo.wasteBinGreen}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          {/* Subtle completion checkmark on bin after bag lands & lid closes */}
          {f1 >= FAQ5_TL.bLidCloseEnd - 20 && (
            <path
              d="M110 105 L114.5 109.5 L123 100"
              fill="none"
              stroke={TOKENS.leaf}
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={clampInterp(f1, [FAQ5_TL.bLidCloseEnd - 20, FAQ5_TL.bLidCloseEnd], [0, 0.95])}
            />
          )}
          <g transform={`translate(142, 76) rotate(${binLidAngleB.toFixed(2)}) translate(-142, -76)`}>
            <rect x="89" y="68" width="54" height="10" rx="3" fill={TOKENS.faq.disposal.fg} />
            <rect x="109" y="64" width="14" height="5" rx="2" fill={TOKENS.faq.disposal.fg} />
          </g>

          {/* Tied household waste bag crouching and hopping cleanly into the bin */}
          {bagLandFade > 0.01 && (
            <g
              opacity={bagLandFade}
              transform={`translate(${bagArc.x.toFixed(2)}, ${(bagArc.y + 22).toFixed(2)}) scale(${bagScaleX.toFixed(4)}, ${bagScaleY.toFixed(4)}) translate(-40, -132)`}
            >
              <path
                d="M22 132 C14 120 16 92 34 84 L40 76 L46 84 C64 92 66 120 58 132 Z"
                fill={TOKENS.illo.wasteBag}
              />
              <path
                d="M34 76 L40 82 L46 76"
                fill="none"
                stroke={TOKENS.illo.wasteBag}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="40" cy="80" r="3.5" fill={TOKENS.illo.wasteBagLight} />
              <path
                d="M28 100 C30 94 34 92 38 92"
                fill="none"
                stroke={TOKENS.illo.wasteBagShade}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          )}
        </g>

        <g transform={`translate(${xs[1] + cardW / 2 - 110}, ${cardY + 572})`}>
          <rect width="220" height="52" rx="26" fill={TOKENS.pillNeutral} />
          <text
            x="110"
            y="34"
            textAnchor="middle"
            fontSize="23"
            fontWeight="600"
            fontFamily={FONT_FAMILY}
            fill={TOKENS.illo.label}
          >
            {locale === "en" ? "Waste pickup" : "Điểm thu gom"}
          </text>
        </g>
      </g>

      {/* Card (c): Tưới cây bằng dịch rỉ */}
      <g
        opacity={sC.opacity}
        transform={`translate(${xs[2] + cardW / 2}, ${cardY + cardH / 2}) scale(${sC.scale.toFixed(4)}) translate(${-(xs[2] + cardW / 2)}, ${-(cardY + cardH / 2)})`}
      >
        <rect
          x={xs[2]}
          y={cardY}
          width={cardW}
          height={cardH}
          rx="28"
          fill={TOKENS.surface}
          stroke={sC.borderColor}
          strokeWidth={sC.borderWidth}
        />
        <text x={xs[2] + 24} y={cardY + 56} fontSize="25" fontWeight="700" fontFamily={FONT_FAMILY} fill={TOKENS.ink}>
          {locale === "en" ? "(c) Use leachate" : "(c) Tưới dịch rỉ"}
        </text>
        <g transform={`translate(${xs[2] + 20}, ${cardY + 125}) scale(${figScale})`}>
          <ellipse cx="80" cy="134" rx="64" ry="4" fill={TOKENS.divider} />
          <PotSprout x={66} y={96} w={48} growth={sproutC} swayDeg={swayC} />
          <WateringCan x={canX} y={canY} tiltDeg={canTiltC} />

          {/* Diluted leachate drops emitted directly from watering can rose onto pot soil */}
          {f2 >= FAQ5_TL.cPourStart &&
            f2 <= FAQ5_TL.cPourEnd + 16 &&
            WATER_DROPS.map((d) => {
              const period = 26 + d.rSpeed * 6;
              const age = (f2 - FAQ5_TL.cPourStart + d.rPhase * period) % period;
              const t = age / period;
              const activeWater = 1 - clampInterp(f2, [FAQ5_TL.cPourEnd - 12, FAQ5_TL.cPourEnd + 16], [0, 1]);
              const sx = tipC.x - 1 + (d.rx - 0.5) * 4;
              const sy = tipC.y + 3;
              const tx = 82 + d.rx * 16;
              const ty = 98;
              const x = sx + (tx - sx) * t;
              const y = sy + (ty - sy) * (t * t);
              const op = activeWater * clampInterp(t, [0, 0.14], [0, 1]) * (1 - clampInterp(t, [0.85, 1], [0, 1]));
              return (
                <path
                  key={d.id}
                  d={`M${x.toFixed(1)} ${y.toFixed(1)} q1.8 3.2 0 4.6 q-1.8 -1.4 0 -4.6z`}
                  fill={TOKENS.illo.water}
                  opacity={op}
                />
              );
            })}
        </g>

        <g transform={`translate(${xs[2] + cardW / 2 - 122}, ${cardY + 572})`}>
          <rect width="244" height="52" rx="26" fill={TOKENS.faq.disposal.bg} />
          <text
            x="122"
            y="34"
            textAnchor="middle"
            fontSize="23"
            fontWeight="600"
            fontFamily={FONT_FAMILY}
            fill={TOKENS.faq.disposal.fg}
          >
            {locale === "en" ? "Dilute ~1:100" : "Pha loãng ~1:100"}
          </text>
        </g>
      </g>
    </StageCanvas>
    </>
  );
}
