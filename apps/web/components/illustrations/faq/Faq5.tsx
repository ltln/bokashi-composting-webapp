import { CompareFigure, CompareRow, type CompareIllustrationProps } from "./CompareFigure";
import type { FaqOption } from "@/content/types";
import { delay } from "./shared";

const TAG = "rounded-full px-2.5 py-1 text-xs font-semibold lg:px-3 lg:py-[5px] lg:text-[13px]";
/** Wider than the default `COMPARE_SVG` (fixed 138px) so 3 figures fit the mobile canvas. */
const FIGURE_SVG = "h-auto w-full flex-none lg:h-[280px] lg:w-full lg:max-w-[300px]";

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
        svgClassName={FIGURE_SVG}
      >
        <svg viewBox="0 0 150 140" role="img" aria-label="Thùng nghiêng trút rác đã lên men thành từng mảnh xác xơ vào chậu đất trồng, cây non mọc lên">
          <ellipse cx="80" cy="134" rx="66" ry="4" className="fill-bk-divider" />
          <g transform="rotate(45 52 118)">
            <path d="M14 118 L52 118 L58 58 L8 58 Z" strokeWidth="4" strokeLinejoin="round" className="fill-bk-illo-bin-inner stroke-bk-illo-bin-wall" />
            <path d="M17 115 L49 115 L52 92 L13 92 Z" fill="#6E5536" />
          </g>
          {/* Solid scraps tumble out of the bin's mouth onto the soil. */}
          <g>
            <rect x="103" y="92" width="9" height="4.5" rx="1.5" className="fill-bk-illo-organic-leaf motion-safe:animate-fall" />
            <circle cx="116" cy="94" r="3" className="fill-bk-illo-organic-peel motion-safe:animate-fall" style={delay(0.35)} />
            <rect x="123" y="91" width="9" height="4.5" rx="1.5" className="fill-bk-illo-organic motion-safe:animate-fall" style={delay(0.7)} />
            <circle cx="111" cy="90" r="2.6" className="fill-bk-illo-organic-peel motion-safe:animate-fall" style={delay(1.05)} />
          </g>
          <path d="M100 104 L140 104 L135 134 L105 134 Z" fill="#C8693A" />
          <rect x="97" y="99" width="46" height="7" rx="2" fill="#B05A2F" />
          <rect x="101" y="99" width="38" height="4" className="fill-bk-illo-organic" />
          <g className="motion-safe:animate-sprout" style={{ transformBox: "fill-box", transformOrigin: "bottom" }}>
            <path d="M120 100 L120 84" stroke="#3E7D45" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M120 88 C112 86 108 80 108 76 C114 76 119 80 120 88 Z" fill="#6FA34D" />
            <path d="M120 85 C128 83 132 77 132 73 C126 73 121 77 120 85 Z" fill="#88B85A" />
          </g>
        </svg>
      </CompareFigure>
      <CompareFigure
        caption={bin.figureLabel}
        active={active === 1}
        tag={<span className={`${TAG} bg-[#EEF1EA] text-bk-illo-label`}>{bin.tag}</span>}
        svgClassName={FIGURE_SVG}
      >
        <svg viewBox="0 0 150 140" role="img" aria-label="Túi rác buộc kín được mang ra thùng thu gom rác sinh hoạt">
          <ellipse cx="75" cy="134" rx="66" ry="4" className="fill-bk-divider" />
          <g className="motion-safe:animate-hop">
            <path d="M22 132 C14 120 16 92 34 84 L40 76 L46 84 C64 92 66 120 58 132 Z" fill="#2C3A33" />
            <path d="M34 76 L40 82 L46 76" fill="none" stroke="#2C3A33" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="40" cy="80" r="3.5" fill="#46574D" />
            <path d="M28 100 C30 94 34 92 38 92" fill="none" stroke="#56685D" strokeWidth="2" strokeLinecap="round" />
          </g>
          <path d="M68 104 L86 104 M81 99 L86 104 L81 109" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-bk-accent" />
          <rect x="92" y="76" width="48" height="58" rx="5" className="fill-bk-primary" />
          <rect x="89" y="68" width="54" height="10" rx="3" className="fill-bk-faq-disposal-fg" />
          <path d="M104 90 L104 124 M116 90 L116 124 M128 90 L128 124" strokeWidth="2.4" strokeLinecap="round" stroke="#4E8A61" />
        </svg>
      </CompareFigure>
      <CompareFigure
        caption={juice.figureLabel}
        active={active === 2}
        tag={<span className={`${TAG} bg-bk-faq-disposal-bg text-bk-faq-disposal-fg`}>{juice.tag}</span>}
        svgClassName={FIGURE_SVG}
      >
        <svg viewBox="0 0 150 140" role="img" aria-label="Bình tưới rót dịch rỉ đã pha loãng vào chậu cây">
          <ellipse cx="80" cy="134" rx="66" ry="4" className="fill-bk-divider" />
          {/* Watering can tilted over the pot. */}
          <g transform="rotate(24 40 100)">
            <path d="M24 58 Q34 44 44 57" fill="none" stroke="#5E93AC" strokeWidth="4" strokeLinecap="round" />
            <rect x="16" y="56" width="34" height="38" rx="7" className="fill-bk-illo-bag" />
            <path d="M48 74 L84 60" stroke="#5E93AC" strokeWidth="5" strokeLinecap="round" />
            <circle cx="88" cy="58" r="4.5" fill="#5E93AC" />
          </g>
          {/* Diluted leachate drops falling from the spout. */}
          <g fill="none" stroke="#4F9BD3" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="3 2.5">
            <path d="M104 82 q3 5 0 8 q-3 -3 0 -8z" className="motion-safe:animate-fall" />
            <path d="M114 86 q3 5 0 8 q-3 -3 0 -8z" className="motion-safe:animate-fall" style={delay(0.4)} />
            <path d="M124 82 q3 5 0 8 q-3 -3 0 -8z" className="motion-safe:animate-fall" style={delay(0.8)} />
          </g>
          <path d="M100 104 L140 104 L135 134 L105 134 Z" fill="#C8693A" />
          <rect x="97" y="99" width="46" height="7" rx="2" fill="#B05A2F" />
          <rect x="101" y="99" width="38" height="4" className="fill-bk-illo-organic" />
          <g className="motion-safe:animate-sprout" style={{ transformBox: "fill-box", transformOrigin: "bottom" }}>
            <path d="M120 100 L120 84" stroke="#3E7D45" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M120 88 C112 86 108 80 108 76 C114 76 119 80 120 88 Z" fill="#6FA34D" />
            <path d="M120 85 C128 83 132 77 132 73 C126 73 121 77 120 85 Z" fill="#88B85A" />
          </g>
        </svg>
      </CompareFigure>
    </CompareRow>
  );
}
