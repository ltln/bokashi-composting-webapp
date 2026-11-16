import { CompareFigure, CompareRow, type CompareIllustrationProps } from "./CompareFigure";
import type { FaqOption } from "@/content/types";
import { CHECK_PATH, CROSS_PATH, delay } from "./shared";

const icon = (d: string) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const TAG = "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-white lg:px-3 lg:py-[5px] lg:text-[13px]";

/** Scrap detail shared by both panels: bin walls, scraps under the bag. */
function Scraps() {
  return (
    <>
      <rect x="12" y="20" width="126" height="120" className="fill-bk-illo-bin-inner" />
      <rect x="15" y="66" width="120" height="74" className="fill-bk-illo-organic" />
      <g className="fill-bk-illo-organic-leaf">
        <rect x="24" y="84" width="10" height="5" rx="1.5" />
        <rect x="92" y="104" width="9" height="5" rx="1.5" />
      </g>
      <g className="fill-bk-illo-organic-peel">
        <circle cx="60" cy="96" r="3" />
        <circle cx="118" cy="88" r="2.6" />
      </g>
    </>
  );
}

const WALLS = <path d="M12 20 L12 140 M138 20 L138 140" strokeWidth="6" className="stroke-bk-illo-bin-wall" />;

/** White mold patches (grow). [cx, cy, rx, ry, delay s] */
const WHITE = [[32, 66, 9, 3.5, 0], [58, 65.5, 7, 3, 0.4], [84, 66, 10, 3.5, 0.8], [112, 65.5, 8, 3, 1.2]] as const;
/** Green / black mold patches. [cx, cy, rx, ry, fill token class] */
const DARK = [
  [30, 66, 9, 3.5, "fill-bk-illo-mold-green"], [54, 65.5, 6, 3, "fill-bk-illo-mold-dark"], [80, 66, 9, 3.5, "fill-bk-illo-mold-mid"],
  [106, 65.5, 7, 3, "fill-bk-illo-mold-dark"], [124, 66, 5, 2.5, "fill-bk-illo-mold-green"],
] as const;
/** Down arrows pressing on the bag. [x, y1, y2] */
const ARROWS = [[45, 26, 42], [75, 24, 40], [105, 26, 42]] as const;

/**
 * FAQ 4, "Nấm mốc" (Faq4 board): the thin white mold that grows and pulses
 * (healthy, "Đạt chuẩn") next to green/black mold under a loose bag with
 * arrows pressing down ("Lọt khí"). `active` picks the emphasised panel.
 */
export function Faq4({ active, paused, label, options }: CompareIllustrationProps) {
  // `noUncheckedIndexedAccess`: pin the content-guaranteed shape (2 options).
  const [white, dark] = options as readonly [FaqOption, FaqOption];
  return (
    <CompareRow label={label} paused={paused}>
      <CompareFigure
        caption={white.figureLabel}
        active={active === 0}
        tag={
          <span className={`${TAG} bg-bk-primary`}>
            {icon(CHECK_PATH)}
            {white.tag}
          </span>
        }
      >
        <svg viewBox="0 0 150 140" role="img" aria-label="Mặt rác phủ mốc trắng mỏng, túi nilon áp sát">
          <Scraps />
          <g strokeWidth="0.8" className="fill-bk-illo-mold-pale stroke-bk-illo-mold-pale-edge">
            {WHITE.map(([cx, cy, rx, ry, d]) => (
              <ellipse key={cx} cx={cx} cy={cy} rx={rx} ry={ry} className="svg-box motion-safe:animate-grow" style={delay(d)} />
            ))}
          </g>
          <path d="M15 62 L135 62" strokeWidth="2.4" className="stroke-bk-illo-bag" />
          {WALLS}
        </svg>
      </CompareFigure>
      <CompareFigure
        caption={dark.figureLabel}
        active={active === 1}
        tag={
          <span className={`${TAG} bg-bk-accent-dark`}>
            {icon(CROSS_PATH)}
            {dark.tag}
          </span>
        }
      >
        <svg viewBox="0 0 150 140" role="img" aria-label="Mặt rác có mốc xanh đen, túi nilon phồng hở khí; mũi tên nén chặt xuống">
          <Scraps />
          {DARK.map(([cx, cy, rx, ry, fill]) => (
            <ellipse key={cx} cx={cx} cy={cy} rx={rx} ry={ry} className={fill} />
          ))}
          <path d="M15 60 Q35 46 55 58 Q75 44 95 57 Q115 46 135 60" fill="none" strokeWidth="2.4" className="stroke-bk-illo-bag" />
          <g fill="#FFFFFF" strokeWidth="0.8" className="stroke-bk-illo-bag">
            <circle cx="36" cy="58" r="3" />
            <circle cx="76" cy="56" r="3.5" />
            <circle cx="114" cy="58" r="2.6" />
          </g>
          <g className="motion-safe:animate-press stroke-bk-accent-dark" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {ARROWS.map(([x, y1, y2]) => (
              <path key={x} d={`M${x} ${y1} L${x} ${y2} M${x - 5} ${y2 - 5} L${x} ${y2} L${x + 5} ${y2 - 5}`} />
            ))}
          </g>
          {WALLS}
        </svg>
      </CompareFigure>
    </CompareRow>
  );
}
