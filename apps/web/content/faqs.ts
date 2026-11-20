/**
 * Tab 2 copy: the 5 troubleshooting FAQs, copied verbatim from the boards
 * docs/design/FaqList.dc.html (category, list title), Faq1–Faq5.dc.html
 * (question, captions, checklists) and DeskFaq.dc.html.
 *
 * The boards each render one sub-step. Captions they don't show reuse that
 * sub-step's checklist text (same convention as content/setupSteps.ts).
 *
 * FAQ 3 and FAQ 5 copy diverged from the boards docs/design per product
 * decision 2026-11-16 (drain-by-tilting remedy, third disposal option).
 */
import type { Locale } from "@/lib/i18n";
import type { Faq, FaqSlug } from "./types";

export interface FaqPageCopy {
  metaTitle: (faq: Faq) => string;
  listMetaTitle: string;
  list: {
    title: string;
    intro: string;
    deskIntro: string;
    cardTag: (faq: Faq) => string;
    label: string;
    tipTitle: string;
    tipText: string;
    deskTip: string;
    emptyDetail: string;
  };
  detail: {
    back: string;
    counter: (n: number, total: number) => string;
    handling: string;
    prev: string;
    next: string;
    toList: string;
    navLabel: string;
    detailLabel: string;
    toggleLabel: Partial<Record<FaqSlug, string>>;
  };
}

const faqsVi: readonly Faq[] = [
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
        durationMs: 4850,
      },
      {
        id: "em",
        caption: "Rắc bổ sung 2–3 muỗng bột EM lên bề mặt để hút ẩm",
        checklist: "Rắc bổ sung 2–3 muỗng bột EM để hút ẩm",
        durationMs: 5967,
      },
      {
        id: "press",
        caption: "Nén chặt lại khối rác",
        checklist: "Nén chặt lại khối rác",
        durationMs: 3167,
      },
      {
        id: "seal",
        caption: "Miết túi nilon đẩy sạch bọt khí, đậy kín",
        checklist: "Miết túi nilon đẩy sạch bọt khí, đậy kín",
        durationMs: 6300,
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
        durationMs: 4533,
      },
      {
        id: "bag",
        caption: "Miết chặt mép túi nilon áp sát thành thùng",
        checklist: "Miết chặt mép túi nilon áp sát thành thùng",
        durationMs: 5400,
      },
      {
        id: "lid",
        caption: "Kiểm tra độ khít của nắp đậy",
        checklist: "Kiểm tra độ khít của nắp đậy",
        durationMs: 4700,
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
      "Mặt cắt thùng: dịch rỉ dềnh quá mặt lon; thùng nghiêng rót bớt dịch vào xô; dịch đã rót ra pha loãng ~1:100 rồi tưới cây",
    tint: "liquid",
    featureTarget: "FAQ_3_Liquid",
    substeps: [
      {
        id: "check",
        caption: "Mở nắp kiểm tra: dịch dềnh quá mặt lon thì cần rót bớt",
        checklist: "Mở nắp kiểm tra định kỳ – mở nắp ngắn không hư mẻ ủ, chỉ kỵ không khí lưu thông lâu",
        durationMs: 5967,
      },
      {
        id: "pour",
        caption: "Nghiêng thùng, rót bớt dịch qua khe nắp vào xô",
        checklist: "Nghiêng thùng rót bớt dịch; dịch đem pha loãng ~1:100 để tưới cây",
        durationMs: 6050,
      },
      {
        id: "water",
        caption: "Dịch rỉ đã rót ra: pha loãng ~1:100 rồi tưới cây",
        checklist: "Pha loãng dịch rỉ ~1:100 rồi tưới cây – không tưới đậm đặc",
        durationMs: 5900,
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
        durationMs: 5967,
      },
      {
        id: "dark",
        caption: "Mốc xanh/đen → nén chặt lại khối rác, khóa khí kỹ hơn",
        checklist: "Mốc xanh/đen: do lọt không khí – nén chặt lại khối rác và khóa khí kỹ hơn",
        durationMs: 7500,
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
    stageLabel: "Ba lựa chọn đầu ra",
    illustrationLabel: "Ba lựa chọn đầu ra",
    tint: "disposal",
    featureTarget: "FAQ_5_Disposal",
    substeps: [
      {
        id: "plant",
        caption: "Vùi rác đã lên men vào chậu cây / đất trồng",
        checklist: "(a) Vùi rác đã lên men chua ngọt vào chậu cây / đất trồng",
        durationMs: 6200,
      },
      {
        id: "bin",
        caption: "Cho vào túi rác buộc kín, bỏ ra điểm thu gom sinh hoạt",
        checklist: "(b) Cho vào túi rác buộc kín, bỏ ra điểm thu gom sinh hoạt",
        durationMs: 7000,
      },
      {
        id: "juice",
        caption: "Dịch rỉ pha loãng ~1:100 thành phân bón lỏng tưới cây",
        checklist: "(c) Dịch rỉ pha loãng ~1:100 rồi tưới cây",
        durationMs: 6867,
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
      {
        figureLabel: "(c) Tưới cây bằng dịch rỉ",
        toggleLabel: "Dịch rỉ",
        tag: "Pha loãng ~1:100",
        marker: "c",
        note: { before: "Dịch rỉ ", bold: "pha loãng ~1:100", after: " rồi tưới cây – không tưới đậm đặc." },
      },
    ],
  },
];

const faqsEn: readonly Faq[] = [
  {
    slug: "smell",
    number: 1,
    category: "Odor",
    question: "The bin smells foul (instead of mildly sour like pickles) — how do I fix it?",
    listTitle: "Bin smells foul instead of mildly sour?",
    stageLabel: "Odor troubleshooting animation",
    illustrationLabel:
      "Bin cross-section: lid open, plastic bag lifted, spoon sprinkling extra Bokashi bran on scraps as foul odor fades",
    stageBadge: { from: "Foul", to: "Mildly sour" },
    tint: "smell",
    featureTarget: "FAQ_1_Smell",
    substeps: [
      {
        id: "open",
        caption: "Open the lid and fold back the sealing bag",
        checklist: "Open the lid and fold back the sealing bag",
        durationMs: 4800,
      },
      {
        id: "em",
        caption: "Sprinkle 2–3 extra spoons of EM bran over the surface to absorb moisture",
        checklist: "Sprinkle 2–3 extra spoons of EM bran to absorb moisture",
        durationMs: 7050,
      },
      {
        id: "press",
        caption: "Press the waste pile down firmly again",
        checklist: "Press the waste pile down firmly again",
        durationMs: 3683,
      },
      {
        id: "seal",
        caption: "Smooth the bag to push out air pockets, then seal tightly",
        checklist: "Smooth the bag to push out air pockets, then seal tightly",
        durationMs: 6417,
      },
    ],
  },
  {
    slug: "maggots",
    number: 2,
    category: "Pests",
    question: "Fruit flies around the lid or maggots on the surface?",
    listTitle: "Fruit flies around lid or maggots on top?",
    stageLabel: "Flies and maggots troubleshooting animation",
    illustrationLabel:
      "Bin cross-section: loose lid with flies around the rim, lifted bag edge exposing maggots; EM bran covers the exposed area and the bag edge is sealed against the wall",
    tint: "maggots",
    featureTarget: "FAQ_2_Maggots",
    substeps: [
      {
        id: "cover",
        caption: "Cover the exposed surface completely with EM bran",
        checklist: "Cover the exposed surface completely with EM bran",
        durationMs: 4967,
      },
      {
        id: "bag",
        caption: "Press the plastic bag edges tightly against the bin walls",
        checklist: "Press the plastic bag edges tightly against the bin walls",
        durationMs: 6000,
      },
      {
        id: "lid",
        caption: "Check that the lid seals completely",
        checklist: "Check that the lid seals completely",
        durationMs: 5300,
      },
    ],
  },
  {
    slug: "liquid",
    number: 3,
    category: "Leachate",
    question: "Scraps release too much liquid and leachate pools at the bottom?",
    listTitle: "Too much liquid pooling at the bottom?",
    stageLabel: "Leachate troubleshooting animation",
    illustrationLabel:
      "Bin cross-section: leachate rising above the cans; bin tilts to pour excess liquid into a bucket; drained liquid is diluted ~1:100 to water plants",
    tint: "liquid",
    featureTarget: "FAQ_3_Liquid",
    substeps: [
      {
        id: "check",
        caption: "Open the lid to check: if liquid rises above the cans, drain some off",
        checklist: "Check periodically — brief opening won't spoil the batch, only prolonged airflow does",
        durationMs: 5617,
      },
      {
        id: "pour",
        caption: "Tilt the bin and pour excess liquid through the cracked lid into a bucket",
        checklist: "Tilt the bin to drain excess liquid; dilute ~1:100 to water plants",
        durationMs: 7133,
      },
      {
        id: "water",
        caption: "Drained leachate: dilute ~1:100 before watering plants",
        checklist: "Dilute leachate ~1:100 before watering plants — never pour undiluted",
        durationMs: 5567,
      },
    ],
  },
  {
    slug: "mold",
    number: 4,
    category: "Mold",
    question: "Is a layer of white mold on top a sign that the batch is spoiled?",
    listTitle: "White mold on the surface — is it spoiled?",
    stageLabel: "Compare two mold states",
    illustrationLabel: "Compare two mold states",
    tint: "mold",
    featureTarget: "FAQ_4_Mold",
    substeps: [
      {
        id: "white",
        caption: "Thin white mold: beneficial anaerobic microbes thriving — batch is on track",
        checklist: "Thin white mold: beneficial anaerobic microbes thriving — batch is on track",
        durationMs: 6817,
      },
      {
        id: "dark",
        caption: "Green/black mold → press scraps tighter and seal air out better",
        checklist: "Green/black mold: caused by air leaks — press scraps tighter and seal better",
        durationMs: 7067,
      },
    ],
    options: [
      {
        figureLabel: "Thin white mold",
        toggleLabel: "White mold",
        tag: "On track",
        marker: "check",
        note: { bold: "Thin white mold", after: " means beneficial anaerobic microbes are thriving — your batch is on track." },
      },
      {
        figureLabel: "Green / black mold",
        toggleLabel: "Green/black",
        tag: "Air leak",
        marker: "cross",
        note: { bold: "Green/black mold", after: " comes from air leaks — press the scraps tighter and seal more thoroughly." },
      },
    ],
  },
  {
    slug: "disposal",
    number: 5,
    category: "Output",
    question: "How should I handle the fermented scraps once a batch finishes?",
    listTitle: "What to do with scraps once fermentation finishes?",
    stageLabel: "Three output options",
    illustrationLabel: "Three output options",
    tint: "disposal",
    featureTarget: "FAQ_5_Disposal",
    substeps: [
      {
        id: "plant",
        caption: "Bury fermented scraps into a planter or garden soil",
        checklist: "(a) Bury sweet-and-sour fermented scraps in a planter or garden soil",
        durationMs: 6400,
      },
      {
        id: "bin",
        caption: "Tie tightly in a trash bag for regular household waste collection",
        checklist: "(b) Tie tightly in a trash bag for regular household waste collection",
        durationMs: 6550,
      },
      {
        id: "juice",
        caption: "Dilute leachate ~1:100 into liquid plant fertilizer",
        checklist: "(c) Dilute leachate ~1:100 to water plants",
        durationMs: 5867,
      },
    ],
    options: [
      {
        figureLabel: "(a) Bury in planter",
        toggleLabel: "(a) Planter",
        tag: "Feed plants",
        marker: "a",
        note: { before: "Bury fermented scraps ", bold: "into a planter or garden soil", after: "." },
      },
      {
        figureLabel: "(b) Household trash",
        toggleLabel: "(b) Collection",
        tag: "Waste pickup",
        marker: "b",
        note: { before: "Place in a ", bold: "tightly tied trash bag", after: " for household waste collection." },
      },
      {
        figureLabel: "(c) Water plants with leachate",
        toggleLabel: "Leachate",
        tag: "Dilute ~1:100",
        marker: "c",
        note: { before: "Dilute leachate ", bold: "~1:100", after: " before watering plants — never use undiluted." },
      },
    ],
  },
];

export const faqsByLocale: Record<Locale, readonly Faq[]> = {
  vi: faqsVi,
  en: faqsEn,
};

export const faqs: readonly Faq[] = faqsByLocale.vi;

export function getFaqs(locale: Locale = "vi"): readonly Faq[] {
  return faqsByLocale[locale];
}

/** Looks up a FAQ by slug (always defined for FaqSlug). */
export function getFaq(slug: FaqSlug, locale: Locale = "vi"): Faq {
  const faq = faqsByLocale[locale].find((f) => f.slug === slug);
  if (!faq) throw new Error(`Unknown FAQ ${slug}`);
  return faq;
}

/** Previous / next FAQ in display order, or null at the ends. */
export function getFaqNeighbours(slug: FaqSlug, locale: Locale = "vi"): { prev: Faq | null; next: Faq | null } {
  const list = faqsByLocale[locale];
  const i = list.findIndex((f) => f.slug === slug);
  return { prev: list[i - 1] ?? null, next: list[i + 1] ?? null };
}

/** Page chrome for /faq and /faq/[slug] (mobile and desktop). */
export const faqPageCopyByLocale: Record<Locale, FaqPageCopy> = {
  vi: {
    metaTitle: (faq: Faq) => `Sự cố ${faq.number} · ${faq.category}`,
    listMetaTitle: "Cẩm nang sự cố",
    list: {
      title: "Cẩm nang sự cố",
      intro: "5 sự cố thường gặp khi tự ủ Bokashi. Chạm để xem hoạt ảnh cách xử lý.",
      deskIntro: "5 sự cố thường gặp khi tự ủ Bokashi. Chọn một sự cố để xem hoạt ảnh xử lý.",
      cardTag: (faq: Faq) => `Sự cố ${faq.number} · ${faq.category}`,
      label: "Danh sách sự cố",
      tipTitle: "Dấu hiệu mẻ ủ đạt chuẩn",
      tipText: "Mùi chua nhẹ như dưa muối, có thể có lớp mốc trắng mỏng.",
      deskTip: "Mẻ ủ đạt chuẩn: mùi chua nhẹ như dưa muối, có thể có lớp mốc trắng mỏng.",
      emptyDetail: "Chọn một sự cố ở danh sách bên trái để xem hoạt ảnh xử lý.",
    },
    detail: {
      back: "Quay lại danh sách sự cố",
      counter: (n: number, total: number) => `Sự cố ${n}/${total}`,
      handling: "Cách xử lý",
      prev: "Sự cố trước",
      next: "Sự cố tiếp theo",
      toList: "Về danh sách",
      navLabel: "Chuyển sự cố",
      detailLabel: "Chi tiết sự cố",
      toggleLabel: { mold: "Chọn trạng thái để phóng to", disposal: "Chọn lựa chọn đầu ra để phóng to" },
    },
  },
  en: {
    metaTitle: (faq: Faq) => `Issue ${faq.number} · ${faq.category}`,
    listMetaTitle: "Troubleshooting",
    list: {
      title: "Troubleshooting",
      intro: "5 common Bokashi issues. Tap to watch the remedy animation.",
      deskIntro: "5 common Bokashi issues. Pick one to watch how to fix it.",
      cardTag: (faq: Faq) => `Issue ${faq.number} · ${faq.category}`,
      label: "Troubleshooting list",
      tipTitle: "Healthy batch signs",
      tipText: "Mildly sour pickle-like smell, possibly with thin white mold.",
      deskTip: "Healthy batch: mildly sour pickle-like smell, possibly with thin white mold.",
      emptyDetail: "Select an issue on the left to watch the fix animation.",
    },
    detail: {
      back: "Back to troubleshooting list",
      counter: (n: number, total: number) => `Issue ${n}/${total}`,
      handling: "How to fix",
      prev: "Previous issue",
      next: "Next issue",
      toList: "Back to list",
      navLabel: "Switch issue",
      detailLabel: "Issue details",
      toggleLabel: { mold: "Select mold state to zoom", disposal: "Select output option to zoom" },
    },
  },
};

export function getFaqPageCopy(locale: Locale = "vi"): FaqPageCopy {
  return faqPageCopyByLocale[locale];
}

export const faqPageCopy = faqPageCopyByLocale.vi;
