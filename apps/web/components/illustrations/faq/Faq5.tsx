import { CompareFigure, CompareRow, COMPARE_SVG, type CompareIllustrationProps } from "./CompareFigure";

const TAG = "rounded-full px-2.5 py-1 text-xs font-semibold lg:px-3 lg:py-[5px] lg:text-[13px]";

/**
 * FAQ 5, "Xử lý rác sau khi ủ" (Faq5 board): (a) the bin tips fermented waste
 * into a plant pot where a seedling sprouts, (b) a tied bag hops towards the
 * household collection bin. `active` picks the emphasised option.
 *
 * The board animates the pouring soil's `stroke-dashoffset`; that is not
 * compositor-friendly, so the stream pulses its opacity instead.
 */
export function Faq5({ active, paused, label, options }: CompareIllustrationProps) {
  const [plant, bin] = options;
  return (
    <CompareRow label={label} paused={paused}>
      <CompareFigure
        caption={plant.figureLabel}
        active={active === 0}
        tag={<span className={`${TAG} bg-bk-faq-disposal-bg text-bk-faq-disposal-fg`}>{plant.tag}</span>}
      >
        <svg viewBox="0 0 150 140" role="img" aria-label="Thùng nghiêng đổ rác đã lên men vào chậu đất, cây non mọc lên" className={COMPARE_SVG}>
          <ellipse cx="80" cy="134" rx="66" ry="4" className="fill-bk-divider" />
          <g transform="rotate(45 52 118)">
            <path d="M14 118 L52 118 L58 58 L8 58 Z" strokeWidth="4" strokeLinejoin="round" className="fill-bk-illo-bin-inner stroke-bk-illo-bin-wall" />
            <path d="M17 115 L49 115 L52 92 L13 92 Z" fill="#6E5536" />
          </g>
          <path d="M97 83 Q110 84 118 100" fill="none" stroke="#6E5536" strokeWidth="5" strokeLinecap="round" strokeDasharray="6 4" className="motion-safe:animate-pulse" />
          <path d="M100 104 L140 104 L135 134 L105 134 Z" fill="#C8693A" />
          <rect x="97" y="99" width="46" height="7" rx="2" fill="#B05A2F" />
          <ellipse cx="120" cy="101" rx="20" ry="3" className="fill-bk-illo-organic" />
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
      >
        <svg viewBox="0 0 150 140" role="img" aria-label="Túi rác buộc kín được mang ra thùng thu gom rác sinh hoạt" className={COMPARE_SVG}>
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
    </CompareRow>
  );
}
