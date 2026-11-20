import { useCurrentFrame } from "remotion";
import { StageCanvas } from "../components/BinRig";
import { VoAudioTrack } from "../components/VoAudioTrack";
import { EASE, clampInterp, lerpNumbers, segProgress } from "../physics";
import { FAQ4_TL, S1, localFrame } from "../timeline";
import { FONT_FAMILY, TOKENS } from "../tokens";
import { mapBoardFrame, type BoardLocale } from "../voAlignment";

const WHITE_COLONIES = [
  { cx: 34, cy: 66, rx: 10, ry: 3.6, delay: 0 },
  { cx: 58, cy: 65.5, rx: 8, ry: 3.2, delay: 14 },
  { cx: 83, cy: 66, rx: 11, ry: 3.8, delay: 28 },
  { cx: 110, cy: 65.5, rx: 9, ry: 3.3, delay: 42 },
  { cx: 46, cy: 66.2, rx: 6, ry: 2.6, delay: 56 },
  { cx: 97, cy: 66.2, rx: 6.5, ry: 2.6, delay: 70 },
] as const;

const DARK_MOLD = [
  { cx: 30, cy: 66, rx: 9.5, ry: 3.8, fill: TOKENS.illo.moldGreen },
  { cx: 54, cy: 65.5, rx: 6.5, ry: 3.2, fill: TOKENS.illo.moldDark },
  { cx: 80, cy: 66, rx: 9.5, ry: 3.8, fill: TOKENS.illo.moldMid },
  { cx: 106, cy: 65.5, rx: 7.5, ry: 3.2, fill: TOKENS.illo.moldDark },
  { cx: 123, cy: 66, rx: 5.5, ry: 2.6, fill: TOKENS.illo.moldGreen },
] as const;

/** Wavy loose bag vs flattened bag control points (150×140 card SVG space). */
const BAG_LOOSE = [15, 60, 28, 46, 42, 46, 55, 58, 68, 44, 82, 44, 95, 57, 108, 46, 122, 46, 135, 60] as const;
const BAG_FLAT = [15, 62, 28, 62, 42, 62, 55, 62, 68, 62, 82, 62, 95, 62, 108, 62, 122, 62, 135, 62] as const;

function bagPtsToPath(p: readonly number[]): string {
  return `M${p[0]!.toFixed(2)} ${p[1]!.toFixed(2)} C${p[2]!.toFixed(2)} ${p[3]!.toFixed(2)}, ${p[4]!.toFixed(2)} ${p[5]!.toFixed(2)}, ${p[6]!.toFixed(2)} ${p[7]!.toFixed(2)} C${p[8]!.toFixed(2)} ${p[9]!.toFixed(2)}, ${p[10]!.toFixed(2)} ${p[11]!.toFixed(2)}, ${p[12]!.toFixed(2)} ${p[13]!.toFixed(2)} C${p[14]!.toFixed(2)} ${p[15]!.toFixed(2)}, ${p[16]!.toFixed(2)} ${p[17]!.toFixed(2)}, ${p[18]!.toFixed(2)} ${p[19]!.toFixed(2)}`;
}

function ScrapsBase() {
  return (
    <g>
      <rect x="12" y="20" width="126" height="120" fill={TOKENS.illo.binInner} />
      <rect x="15" y="66" width="120" height="74" fill={TOKENS.illo.organic} />
      <rect x="24" y="84" width="10" height="5" rx="1.5" fill={TOKENS.illo.organicLeaf} />
      <rect x="92" y="104" width="9" height="5" rx="1.5" fill={TOKENS.illo.organicLeaf} />
      <rect x="44" y="114" width="8" height="4.5" rx="1.5" fill={TOKENS.illo.organicGreen} />
      <circle cx="60" cy="96" r="3" fill={TOKENS.illo.organicPeel} />
      <circle cx="118" cy="88" r="2.6" fill={TOKENS.illo.organicPeel} />
      <circle cx="78" cy="118" r="2.2" fill={TOKENS.illo.bran} />
    </g>
  );
}

function BinWalls() {
  return (
    <path
      d="M12 20 L12 140 M138 20 L138 140"
      fill="none"
      stroke={TOKENS.illo.binWall}
      strokeWidth="6"
      strokeLinecap="round"
    />
  );
}

export function Faq4({ locale = "vi", voiced = false }: { locale?: BoardLocale; voiced?: boolean }) {
  const rawFrame = useCurrentFrame();
  const frame = mapBoardFrame(rawFrame, "Faq4", locale, voiced);
  const f0 = localFrame(frame, 0);
  const f1 = localFrame(frame, 1);

  // Depth swap over 24 frames at S1 (270..294)
  const swapT = frame >= S1 ? segProgress(f1, 0, FAQ4_TL.transitionFrames, EASE.inOut) : 0;
  const leftScale = clampInterp(swapT, [0, 1], [1.02, 0.96]);
  const rightScale = clampInterp(swapT, [0, 1], [0.96, 1.02]);
  const leftOp = clampInterp(swapT, [0, 1], [1.0, 0.68]);
  const rightOp = clampInterp(swapT, [0, 1], [0.68, 1.0]);

  // Left card: healthy white mold blooms gently and settles cleanly before hold window
  const bloomGlobal = clampInterp(f0, [16, 150], [0.35, 1.0], EASE.out);
  const breatheAmp = 1 - clampInterp(frame, [480, 514], [0, 1], EASE.smooth);

  // Right card: press arrows descend and flatten the loose wavy bag + squeeze bubbles out
  const pressT = frame >= S1 ? segProgress(f1, FAQ4_TL.pressStart, FAQ4_TL.pressEnd, EASE.inOut) : 0;
  const pressArrowLift =
    frame >= S1 && f1 >= FAQ4_TL.pressStart - 16 && f1 < FAQ4_TL.pressStart
      ? clampInterp(f1, [FAQ4_TL.pressStart - 16, FAQ4_TL.pressStart], [0, -5], EASE.inOut)
      : 0;
  const arrowYShift = pressT * 14 + pressArrowLift;
  const bagPts = lerpNumbers(BAG_LOOSE, BAG_FLAT, pressT);

  // Card coordinates strictly inside centered 320:280 safe crop box [343, 1577]
  const cardW = 568;
  const cardH = 740;
  const cardY = 170;
  const leftX = 372;
  const rightX = 980;
  const figScale = 3.2; // 150*3.2 = 480w × 448h

  return (
    <>
      <VoAudioTrack boardId="Faq4" locale={locale} voiced={voiced} />
      <StageCanvas rawCoords>
      {/* Left Card: Mốc trắng mỏng (Đạt chuẩn) */}
      <g
        opacity={leftOp}
        transform={`translate(${leftX + cardW / 2}, ${cardY + cardH / 2}) scale(${leftScale.toFixed(4)}) translate(${-(leftX + cardW / 2)}, ${-(cardY + cardH / 2)})`}
      >
        <rect
          x={leftX}
          y={cardY}
          width={cardW}
          height={cardH}
          rx="32"
          fill={TOKENS.surface}
          stroke={swapT < 0.5 ? TOKENS.primary : TOKENS.border}
          strokeWidth={swapT < 0.5 ? "5" : "2.5"}
        />
        <text
          x={leftX + 38}
          y={cardY + 66}
          fontSize="30"
          fontWeight="700"
          fontFamily={FONT_FAMILY}
          fill={TOKENS.ink}
        >
          {locale === "en" ? "Thin white mold" : "Mốc trắng mỏng"}
        </text>
        <g transform={`translate(${leftX + 44}, ${cardY + 114}) scale(${figScale})`}>
          <ScrapsBase />
          {WHITE_COLONIES.map((w, i) => {
            const colonyIn = clampInterp(f0 - w.delay * 0.4, [16, 80], [0.25, 1], EASE.out);
            const breathe = 1 + Math.sin(frame * 0.07 + i * 0.9) * 0.05 * breatheAmp;
            const sx = colonyIn * bloomGlobal * breathe;
            return (
              <ellipse
                key={i}
                cx={w.cx}
                cy={w.cy}
                rx={w.rx * sx}
                ry={w.ry * sx}
                fill={TOKENS.illo.moldPale}
                stroke={TOKENS.illo.moldPaleEdge}
                strokeWidth="0.85"
              />
            );
          })}
          {/* Bag pressed flat right over the waste */}
          <path d="M15 62 L135 62" stroke={TOKENS.illo.bag} strokeWidth="2.5" strokeLinecap="round" />
          <BinWalls />
        </g>

        {/* Bottom tag pill: ✓ Đạt chuẩn */}
        <g transform={`translate(${leftX + cardW / 2 - 116}, ${cardY + 642})`}>
          <rect width="232" height="58" rx="29" fill={TOKENS.primary} />
          <path
            d="M34 29 L43 38 L60 20"
            fill="none"
            stroke={TOKENS.surface}
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text
            x="140"
            y="38"
            textAnchor="middle"
            fontSize="26"
            fontWeight="700"
            fontFamily={FONT_FAMILY}
            fill={TOKENS.surface}
          >
            {locale === "en" ? "On track" : "Đạt chuẩn"}
          </text>
        </g>
      </g>

      {/* Right Card: Mốc xanh / đen (Lọt khí -> Nén xẹp túi) */}
      <g
        opacity={rightOp}
        transform={`translate(${rightX + cardW / 2}, ${cardY + cardH / 2}) scale(${rightScale.toFixed(4)}) translate(${-(rightX + cardW / 2)}, ${-(cardY + cardH / 2)})`}
      >
        <rect
          x={rightX}
          y={cardY}
          width={cardW}
          height={cardH}
          rx="32"
          fill={TOKENS.surface}
          stroke={swapT >= 0.5 ? TOKENS.accentDark : TOKENS.border}
          strokeWidth={swapT >= 0.5 ? "5" : "2.5"}
        />
        <text
          x={rightX + 38}
          y={cardY + 66}
          fontSize="30"
          fontWeight="700"
          fontFamily={FONT_FAMILY}
          fill={TOKENS.ink}
        >
          {locale === "en" ? "Green / black mold" : "Mốc xanh / đen"}
        </text>
        <g transform={`translate(${rightX + 44}, ${cardY + 114}) scale(${figScale})`}>
          <ScrapsBase />
          {DARK_MOLD.map((d, i) => (
            <ellipse key={i} cx={d.cx} cy={d.cy} rx={d.rx} ry={d.ry} fill={d.fill} />
          ))}

          {/* Air bubbles trapped under loose bag -> travel up along inner wall out the top gap (never piercing walls!) */}
          {[
            { x0: 36, x1: 22, r: 3.0 },
            { x0: 76, x1: 127, r: 3.4 },
            { x0: 114, x1: 128, r: 2.6 },
          ].map((b, i) => {
            const slide = clampInterp(pressT, [0.15, 0.92], [0, 1], EASE.inOut);
            const cx = b.x0 + (b.x1 - b.x0) * slide;
            const cy = 58 - Math.pow(slide, 1.6) * 26;
            const op = 1 - clampInterp(pressT, [0.76, 0.96], [0, 1]);
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={b.r}
                fill={TOKENS.surface}
                stroke={TOKENS.illo.bag}
                strokeWidth="0.9"
                opacity={op}
              />
            );
          })}

          {/* Bag morphing smoothly from loose wavy -> sealed flat */}
          <path
            d={bagPtsToPath(bagPts)}
            fill="none"
            stroke={TOKENS.illo.bag}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Three press arrows pushing down */}
          <g
            transform={`translate(0, ${arrowYShift.toFixed(2)})`}
            fill="none"
            stroke={TOKENS.accentDark}
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {[45, 75, 105].map((x) => (
              <path key={x} d={`M${x} 24 L${x} 41 M${x - 5} 36 L${x} 41 L${x + 5} 36`} />
            ))}
          </g>
          <BinWalls />
        </g>

        {/* Bottom tag pill: ✕ Lọt khí */}
        <g transform={`translate(${rightX + cardW / 2 - 102}, ${cardY + 642})`}>
          <rect width="204" height="58" rx="29" fill={TOKENS.accentDark} />
          <path
            d="M36 21 L52 37 M52 21 L36 37"
            fill="none"
            stroke={TOKENS.surface}
            strokeWidth="4.2"
            strokeLinecap="round"
          />
          <text
            x="122"
            y="38"
            textAnchor="middle"
            fontSize="26"
            fontWeight="700"
            fontFamily={FONT_FAMILY}
            fill={TOKENS.surface}
          >
            {locale === "en" ? "Air leak" : "Lọt khí"}
          </text>
        </g>
      </g>
    </StageCanvas>
    </>
  );
}
