import { CompareFigure, CompareRow, type CompareIllustrationProps } from "./CompareFigure";
import type { FaqOption } from "@/content/types";
import { PotSprout, WateringCan } from "../parts";
import { delay } from "./shared";

const TAG = "rounded-full px-2.5 py-1 text-xs font-semibold lg:px-3 lg:py-[5px] lg:text-[13px]";

/** Scraps tumbling from the bin's mouth to the soil. [x, y, delay s] */
const SCRAPS = [[56, 104, 0], [68, 96, 0.35], [82, 100, 0.7], [94, 104, 1.05]] as const;
/** Fill token per scrap, matching SCRAPS order. */
const SCRAP_FILLS = ["fill-bk-illo-organic-leaf", "fill-bk-illo-organic-peel", "fill-bk-illo-organic", "fill-bk-illo-organic-peel"] as const;

/**
 * FAQ 5, "Xử lý rác sau khi ủ" (Faq5 board): (a) the bin tips fermented waste
 * out as solid scraps into a plant pot where a seedling sprouts, (b) a tied
 * bag hops towards the household collection bin, (c) a watering can pours the
 * diluted leachate onto a plant. `active` picks the emphasised option.
 *
 * The board's pouring stream was a liquid-looking dashed path; per the product
 * decision 2026-11-16 the waste goes out as solid scraps, animated with the
 * transform/opacity-only `fall` keyframes.
 */
export function Faq5({ active, paused, label, options }: CompareIllustrationProps) {
  // `noUncheckedIndexedAccess`: pin the content-guaranteed shape (3 options).
  const [plant, bin, juice] = options as readonly [FaqOption, FaqOption, FaqOption];
  return (
    <CompareRow label={label} paused={paused}>
      <CompareFigure
        caption={plant.figureLabel}
        active={active === 0}
        tag={<span className={`${TAG} bg-bk-faq-disposal-bg text-bk-faq-disposal-fg`}>{plant.tag}</span>}
      >
        <svg viewBox="0 0 150 140" role="img" aria-label="Thùng nghiêng trút rác đã lên men thành từng mảnh xác xơ vào chậu đất trồng, cây non mọc lên">
          <ellipse cx="80" cy="134" rx="66" ry="4" className="fill-bk-divider" />
          <g transform="rotate(45 52 118)">
            <path d="M14 118 L52 118 L58 58 L8 58 Z" strokeWidth="4" strokeLinejoin="round" className="fill-bk-illo-bin-inner stroke-bk-illo-bin-wall" />
            <path d="M17 115 L49 115 L52 92 L13 92 Z" className="fill-bk-illo-organic" />
          </g>
          {/* Solid scraps tumble out of the bin's mouth onto the soil. */}
          <g>
            {SCRAPS.map(([x, y, d], i) =>
              i % 2 === 0 ? (
                <rect key={x} x={x} y={y} width="9" height="4.5" rx="1.5" className={`${SCRAP_FILLS[i]} motion-safe:animate-fall`} style={delay(d)} />
              ) : (
                <circle key={x} cx={x} cy={y} r={i === 1 ? 3 : 2.6} className={`${SCRAP_FILLS[i]} motion-safe:animate-fall`} style={delay(d)} />
              ),
            )}
          </g>
          <PotSprout x={98} y={106} w={42} />
        </svg>
      </CompareFigure>
      <CompareFigure
        caption={bin.figureLabel}
        active={active === 1}
        tag={<span className={`${TAG} bg-bk-pill-neutral text-bk-illo-label`}>{bin.tag}</span>}
      >
        <svg viewBox="0 0 150 140" role="img" aria-label="Túi rác buộc kín được mang ra thùng thu gom rác sinh hoạt">
          <ellipse cx="75" cy="134" rx="66" ry="4" className="fill-bk-divider" />
          <g className="motion-safe:animate-hop">
            <path d="M22 132 C14 120 16 92 34 84 L40 76 L46 84 C64 92 66 120 58 132 Z" className="fill-bk-illo-waste-bag" />
            <path d="M34 76 L40 82 L46 76" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="stroke-bk-illo-waste-bag" />
            <circle cx="40" cy="80" r="3.5" className="fill-bk-illo-waste-bag-light" />
            <path d="M28 100 C30 94 34 92 38 92" fill="none" strokeWidth="2" strokeLinecap="round" className="stroke-bk-illo-waste-bag-shade" />
          </g>
          <path d="M68 104 L86 104 M81 99 L86 104 L81 109" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-bk-accent" />
          <rect x="92" y="76" width="48" height="58" rx="5" className="fill-bk-primary" />
          <rect x="89" y="68" width="54" height="10" rx="3" className="fill-bk-faq-disposal-fg" />
          <path d="M104 90 L104 124 M116 90 L116 124 M128 90 L128 124" strokeWidth="2.4" strokeLinecap="round" className="stroke-bk-illo-waste-bin-green" />
        </svg>
      </CompareFigure>
      <CompareFigure
        caption={juice.figureLabel}
        active={active === 2}
        tag={<span className={`${TAG} bg-bk-faq-disposal-bg text-bk-faq-disposal-fg`}>{juice.tag}</span>}
      >
        <svg viewBox="0 0 150 140" role="img" aria-label="Bình tưới rót dịch rỉ đã pha loãng vào chậu cây">
          <ellipse cx="80" cy="134" rx="66" ry="4" className="fill-bk-divider" />
          {/* Watering can tilted over the pot; drops fall from its spout tip. */}
          <WateringCan x={18} y={44} pouring />
          <PotSprout x={56} y={96} w={48} />
        </svg>
      </CompareFigure>
    </CompareRow>
  );
}
