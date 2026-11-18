import { CompareFigure, CompareRow, type CompareIllustrationProps } from "./CompareFigure";
import type { FaqOption } from "@/content/types";
import { PotSprout, WateringCan } from "../parts";
import { delay } from "./shared";

const TAG = "rounded-full px-2.5 py-1 text-xs font-semibold lg:px-3 lg:py-[5px] lg:text-[13px]";

/**
 * Scraps along the fall from the bin's lip into the pot's mouth: the rest
 * position of each piece, from which `tumble` starts it up and to the left.
 * [x, y, delay s]
 */
const SCRAPS = [[96, 92, 0], [102, 95.5, 0.35], [107, 98.5, 0.7], [111, 100.5, 1.05]] as const;
/** Fill token per scrap, matching SCRAPS order. */
const SCRAP_FILLS = ["fill-bk-illo-organic-leaf", "fill-bk-illo-organic-peel", "fill-bk-illo-organic", "fill-bk-illo-organic-peel"] as const;

/**
 * FAQ 5, "Xử lý rác sau khi ủ" (Faq5 board): (a) the bin tips fermented waste
 * out as solid scraps into a plant pot where a seedling sprouts, (b) a tied
 * bag hops towards the household collection bin, (c) a watering can pours the
 * diluted leachate onto a plant. `active` picks the emphasised option.
 *
 * The board's pouring stream was a liquid-looking dashed path; per the product
 * decision 2026-11-16 the waste goes out as solid scraps. `tumble` drops each
 * scrap down and slightly right (transform/opacity only), so the pieces read as
 * one stream from the lip to the pot's mouth even with the animation frozen.
 *
 * Option (a)'s bin is tipped past the horizontal (`rotate(112)` about its mouth
 * centre) so the open lip faces down into the pot: the walls stop at the lip,
 * the waste sits against it, and the scraps fall into the pot. A bin tipped
 * only 45° reads as a closed box emptying through its side.
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
        <svg viewBox="0 0 150 140" role="img" aria-label="Thùng nghiêng trút rác đã lên men vào chậu đất trồng, cây non mọc lên">
          <ellipse cx="80" cy="134" rx="66" ry="4" className="fill-bk-divider" />
          {/* Mouth centre at (103, 64), tipped 112°: the lip overhangs the pot's soil. */}
          <g transform="translate(103 64) rotate(112) translate(-33 -58)">
            <path d="M14 118 L52 118 L58 58 L8 58 Z" className="fill-bk-illo-bin-inner" />
            {/* Fermented waste piled against the lip, with its scraps showing. */}
            <path d="M11 57 L55 57 L54 88 L12 88 Z" className="fill-bk-illo-organic" />
            <g>
              <rect x="15" y="62" width="7" height="3.5" rx="1.5" className="fill-bk-illo-organic-leaf" />
              <circle cx="34" cy="64" r="2.2" className="fill-bk-illo-organic-peel" />
              <rect x="41" y="70" width="7" height="3.5" rx="1.5" className="fill-bk-illo-organic-green" />
              <circle cx="24" cy="78" r="2" className="fill-bk-illo-organic-peel" />
            </g>
            {/* Walls + floor only: the mouth stays open. */}
            <path
              d="M8 58 L14 118 L52 118 L58 58"
              fill="none"
              strokeWidth="4"
              strokeLinejoin="round"
              className="stroke-bk-illo-bin-wall"
            />
          </g>
          {/* Solid scraps tumble out of the lip into the pot's soil. */}
          <g>
            {SCRAPS.map(([x, y, d], i) =>
              i % 2 === 0 ? (
                <rect key={x} x={x} y={y} width="6" height="3.5" rx="1.5" className={`${SCRAP_FILLS[i]} motion-safe:animate-tumble`} style={delay(d)} />
              ) : (
                <circle key={x} cx={x} cy={y} r={i === 1 ? 2.2 : 2} className={`${SCRAP_FILLS[i]} motion-safe:animate-tumble`} style={delay(d)} />
              ),
            )}
          </g>
          <PotSprout x={90} y={103} w={44} soilMound />
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
