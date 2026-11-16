/**
 * Tab 2 copy: the 5 troubleshooting FAQs, copied verbatim from the boards
 * docs/design/FaqList.dc.html (category, list title), Faq1–Faq5.dc.html
 * (question, captions, checklists) and DeskFaq.dc.html.
 *
 * The boards each render one sub-step. Captions they don't show reuse that
 * sub-step's checklist text (same convention as content/setupSteps.ts).
 */
import type { Faq, FaqSlug } from "./types";

/** Default time each sub-step plays before auto-advancing. */
const SUBSTEP_MS = 4500;

export const faqs: readonly Faq[] = [
  {
    slug: "smell",
    number: 1,
    category: "Mùi",
    question: "Thùng bốc mùi hôi thối (thay vì chua nhẹ như dưa muối) thì xử lý sao?",
    listTitle: "Thùng bốc mùi hôi thối thay vì chua nhẹ?",
    stageLabel: "Hoạt ảnh xử lý mùi hôi",
    illustrationLabel:
      "Mặt cắt thùng: nắp mở, túi nilon lật lên, muỗng rắc bổ sung bột EM lên mặt rác, mùi hôi giảm dần",
    stageBadge: { from: "Thối", to: "Chua nhẹ" },
    tint: "smell",
    featureTarget: "FAQ_1_Smell",
    substeps: [
      {
        id: "open",
        caption: "Mở nắp, lật túi khóa khí",
        checklist: "Mở nắp, lật túi khóa khí",
        durationMs: SUBSTEP_MS,
      },
      {
        id: "em",
        caption: "Rắc bổ sung 2–3 muỗng bột EM lên bề mặt để hút ẩm",
        checklist: "Rắc bổ sung 2–3 muỗng bột EM để hút ẩm",
        durationMs: SUBSTEP_MS,
      },
      {
        id: "press",
        caption: "Nén chặt lại khối rác",
        checklist: "Nén chặt lại khối rác",
        durationMs: SUBSTEP_MS,
      },
      {
        id: "seal",
        caption: "Miết túi nilon đẩy sạch bọt khí, đậy kín",
        checklist: "Miết túi nilon đẩy sạch bọt khí, đậy kín",
        durationMs: SUBSTEP_MS,
      },
    ],
  },
  {
    slug: "maggots",
    number: 2,
    category: "Côn trùng",
    question: "Thấy ruồi giấm bu quanh nắp hoặc xuất hiện giòi trên bề mặt rác?",
    listTitle: "Ruồi giấm bu quanh nắp, có giòi trên mặt rác?",
    stageLabel: "Hoạt ảnh xử lý ruồi giấm và giòi",
    illustrationLabel:
      "Mặt cắt thùng: nắp hở, ruồi bay quanh khe nắp, mép túi bị hở để lộ giòi; bột EM được rắc phủ lên vùng hở và mép túi được miết sát thành thùng",
    tint: "maggots",
    featureTarget: "FAQ_2_Maggots",
    substeps: [
      {
        id: "cover",
        caption: "Rắc phủ kín bột EM lên vùng bề mặt bị hở",
        checklist: "Rắc phủ kín bột EM lên vùng bề mặt bị hở",
        durationMs: SUBSTEP_MS,
      },
      {
        id: "bag",
        caption: "Miết chặt mép túi nilon áp sát thành thùng",
        checklist: "Miết chặt mép túi nilon áp sát thành thùng",
        durationMs: SUBSTEP_MS,
      },
      {
        id: "lid",
        caption: "Kiểm tra độ khít của nắp đậy",
        checklist: "Kiểm tra độ khít của nắp đậy",
        durationMs: SUBSTEP_MS,
      },
    ],
  },
  {
    slug: "liquid",
    number: 3,
    category: "Dịch rỉ",
    question: "Rác ra nhiều nước khiến đáy thùng bị đọng dịch rỉ quá mức?",
    listTitle: "Rác ra nhiều nước, đáy thùng đọng dịch?",
    stageLabel: "Hoạt ảnh xử lý dịch rỉ",
    illustrationLabel:
      "Mặt cắt thùng: dịch rỉ thấm xuống tầng đáy giả, lon nhôm và giấy báo giữ và hút dịch; giấy báo khô được lót thêm lên mặt rác",
    tint: "liquid",
    featureTarget: "FAQ_3_Liquid",
    substeps: [
      {
        id: "base",
        caption: "Tầng đáy giả (lon nhôm + giấy báo) giữ và hút dịch rỉ",
        checklist: "Tầng đáy giả (lon nhôm + giấy báo) giữ và hút dịch rỉ",
        durationMs: SUBSTEP_MS,
      },
      {
        id: "paper",
        caption: "Lót thêm giấy báo khô vo viên / bìa carton trước lớp rác mới",
        checklist: "Lót thêm giấy báo khô vo viên hoặc bìa carton hút ẩm",
        durationMs: SUBSTEP_MS,
      },
      {
        id: "layer",
        caption: "Nạp lớp rác tiếp theo đã vắt kiệt nước",
        checklist: "Nạp lớp rác tiếp theo đã vắt kiệt nước",
        durationMs: SUBSTEP_MS,
      },
    ],
  },
  {
    slug: "mold",
    number: 4,
    category: "Nấm mốc",
    question: "Trên mặt rác xuất hiện lớp mốc trắng có phải bị hỏng không?",
    listTitle: "Mặt rác có mốc trắng – có phải bị hỏng?",
    stageLabel: "So sánh hai trạng thái mốc",
    illustrationLabel: "So sánh hai trạng thái mốc",
    tint: "mold",
    featureTarget: "FAQ_4_Mold",
    substeps: [
      {
        id: "white",
        caption: "Mốc trắng mỏng: khuẩn yếm khí có lợi phát triển – mẻ ủ đạt chuẩn",
        checklist: "Mốc trắng mỏng: khuẩn yếm khí có lợi phát triển – mẻ ủ đạt chuẩn",
        durationMs: SUBSTEP_MS,
      },
      {
        id: "dark",
        caption: "Mốc xanh/đen → nén chặt lại khối rác, khóa khí kỹ hơn",
        checklist: "Mốc xanh/đen: do lọt không khí – nén chặt lại khối rác và khóa khí kỹ hơn",
        durationMs: SUBSTEP_MS,
      },
    ],
    options: [
      {
        figureLabel: "Mốc trắng mỏng",
        toggleLabel: "Mốc trắng",
        tag: "Đạt chuẩn",
        marker: "check",
        note: { bold: "Mốc trắng mỏng", after: " là khuẩn yếm khí có lợi phát triển – mẻ ủ đạt chuẩn." },
      },
      {
        figureLabel: "Mốc xanh / đen",
        toggleLabel: "Mốc xanh/đen",
        tag: "Lọt khí",
        marker: "cross",
        note: { bold: "Mốc xanh/đen", after: " do lọt không khí – nén chặt lại khối rác và khóa khí kỹ hơn." },
      },
    ],
  },
  {
    slug: "disposal",
    number: 5,
    category: "Đầu ra",
    question: "Sau khi ủ xong một mẻ thì xử lý đống rác trong thùng như thế nào?",
    listTitle: "Ủ xong một mẻ thì xử lý rác thế nào?",
    stageLabel: "Hai lựa chọn đầu ra",
    illustrationLabel: "Hai lựa chọn đầu ra",
    tint: "disposal",
    featureTarget: "FAQ_5_Disposal",
    substeps: [
      {
        id: "plant",
        caption: "Rác đã lên men chua ngọt – không còn mùi thối, không rỉ nước",
        checklist: "(a) Vùi rác đã lên men chua ngọt vào chậu cây / đất trồng",
        durationMs: SUBSTEP_MS,
      },
      {
        id: "bin",
        caption: "Cho vào túi rác buộc kín, bỏ ra điểm thu gom sinh hoạt",
        checklist: "(b) Cho vào túi rác buộc kín, bỏ ra điểm thu gom sinh hoạt",
        durationMs: SUBSTEP_MS,
      },
    ],
    options: [
      {
        figureLabel: "(a) Vùi chậu cây",
        toggleLabel: "(a) Chậu cây",
        tag: "Bón cho cây",
        marker: "a",
        note: { before: "Đem rác đã lên men ", bold: "vùi vào chậu cây hoặc đất trồng", after: "." },
      },
      {
        figureLabel: "(b) Bỏ rác sinh hoạt",
        toggleLabel: "(b) Thu gom",
        tag: "Điểm thu gom",
        marker: "b",
        note: { before: "Cho vào ", bold: "túi rác buộc kín", after: ", bỏ ra điểm thu gom sinh hoạt." },
      },
    ],
  },
];

/** Looks up a FAQ by slug (always defined for FaqSlug). */
export function getFaq(slug: FaqSlug): Faq {
  const faq = faqs.find((f) => f.slug === slug);
  if (!faq) throw new Error(`Unknown FAQ ${slug}`);
  return faq;
}

/** Previous / next FAQ in display order, or null at the ends. */
export function getFaqNeighbours(slug: FaqSlug): { prev: Faq | null; next: Faq | null } {
  const i = faqs.findIndex((f) => f.slug === slug);
  return { prev: faqs[i - 1] ?? null, next: faqs[i + 1] ?? null };
}

/** Page chrome for /faq and /faq/[slug] (mobile and desktop). */
export const faqPageCopy = {
  metaTitle: (faq: Faq) => `Sự cố ${faq.number} · ${faq.category}`,
  listMetaTitle: "Cẩm nang sự cố",
  /** List page. */
  list: {
    title: "Cẩm nang sự cố",
    intro: "5 sự cố thường gặp khi tự ủ Bokashi. Chạm để xem hoạt ảnh cách xử lý.",
    /** Desktop rail intro (DeskFaq). */
    deskIntro: "5 sự cố thường gặp khi tự ủ Bokashi. Chọn một sự cố để xem hoạt ảnh xử lý.",
    /** Category line of a list card / rail row, e.g. "Sự cố 1 · Mùi". */
    cardTag: (faq: Faq) => `Sự cố ${faq.number} · ${faq.category}`,
    /** aria-label of the list. */
    label: "Danh sách sự cố",
    tipTitle: "Dấu hiệu mẻ ủ đạt chuẩn",
    tipText: "Mùi chua nhẹ như dưa muối, có thể có lớp mốc trắng mỏng.",
    /** Desktop rail tip (DeskFaq). */
    deskTip: "Mẻ ủ đạt chuẩn: mùi chua nhẹ như dưa muối, có thể có lớp mốc trắng mỏng.",
    /** Desktop detail panel before any FAQ is chosen. */
    emptyDetail: "Chọn một sự cố ở danh sách bên trái để xem hoạt ảnh xử lý.",
  },
  /** Detail page. */
  detail: {
    back: "Quay lại danh sách sự cố",
    counter: (n: number, total: number) => `Sự cố ${n}/${total}`,
    handling: "Cách xử lý",
    prev: "Sự cố trước",
    next: "Sự cố tiếp theo",
    toList: "Về danh sách",
    navLabel: "Chuyển sự cố",
    detailLabel: "Chi tiết sự cố",
    /** aria-label of the compare toggle, by FAQ. */
    toggleLabel: { mold: "Chọn trạng thái để phóng to", disposal: "Chọn lựa chọn đầu ra để phóng to" } as Partial<Record<FaqSlug, string>>,
  },
} as const;
