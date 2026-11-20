/**
 * Tab 1 copy: the 3 bin-setup steps, copied verbatim from the boards
 * docs/design/Main.dc.html (step 1), Step2.dc.html, Step3.dc.html and
 * DeskSetup.dc.html (desktop-only text).
 *
 * Captions the boards don't show (they only render one sub-step per step)
 * reuse that sub-step's checklist text, as DeskSetup does.
 */
import type { Locale } from "@/lib/i18n";
import type { SetupStep, SetupStepNumber } from "./types";

export interface SetupPageCopy {
  metaTitle: (step: SetupStep) => string;
  stageChip: (step: SetupStep, total: number) => string;
  stageLabel: (n: number) => string;
  switcherLabel: string;
  switcherItem: (step: SetupStep) => string;
  desk: {
    title: string;
    intro: string;
    crossSection: string;
    materialsLabel: string;
    materials: readonly string[];
    stepListLabel: string;
    prev: string;
    next: string;
    toFaq: string;
    tipLead: string;
    tipStrong: string;
    tipTail: string;
  };
}

export interface PlayerCopy {
  pause: string;
  play: string;
  replay: string;
  progress: string;
  mute: string;
  unmute: string;
  segment: (i: number, total: number, caption: string) => string;
}

const setupStepsVi: readonly SetupStep[] = [
  {
    number: 1,
    title: "Tầng đáy giả",
    shortLabel: "Đáy giả",
    badge: "10–20% chiều cao",
    description: "Thùng nhựa 10L có nắp, không khoan lỗ.",
    illustrationLabel:
      "Mặt cắt thùng 10L: lon nhôm bóp dẹp xếp ngang dưới đáy, giấy báo vo viên đang được chèn vào khe",
    featureTarget: "3D_Setup_Layer1",
    substeps: [
      {
        id: "cans",
        caption: "Xếp vỏ lon nhôm bóp dẹp nằm ngang dưới đáy",
        checklist: "Xếp vỏ lon nhôm bóp dẹp nằm ngang dưới đáy",
        durationMs: 5167,
      },
      {
        id: "paper",
        caption: "Chèn chặt giấy báo vo tròn vào khe trống để hút dịch rỉ",
        checklist: "Chèn chặt giấy báo vo tròn vào khe trống để hút dịch rỉ",
        durationMs: 6850,
      },
      {
        id: "cardboard",
        caption: "Phủ tấm bìa carton phẳng lên trên",
        checklist: "Phủ tấm bìa carton phẳng lên trên",
        durationMs: 5433,
      },
    ],
  },
  {
    number: 2,
    title: "Cơ chất nạp theo lớp",
    shortLabel: "Nạp lớp",
    badge: "~70% chiều cao",
    description: "",
    stageLabel: "Nạp cơ chất",
    stageTag: "Lớp 3",
    summary: "~70% chiều cao · lớp 3–5 cm",
    illustrationLabel: "Mặt cắt thùng: tầng đáy giả, hai lớp rác đã nén, lớp thứ ba đang được rắc bột EM",
    featureTarget: "3D_Setup_Layer2",
    substeps: [
      {
        id: "chop",
        caption: "Băm nhỏ rác hữu cơ, vắt kiệt nước thừa",
        checklist: "Băm nhỏ rác hữu cơ, vắt kiệt nước thừa",
        durationMs: 5567,
      },
      {
        id: "spread",
        caption: "Rải thành lớp dày 3–5 cm",
        checklist: "Rải thành lớp dày 3–5 cm",
        durationMs: 5167,
      },
      {
        id: "bran",
        caption: "Rắc đều bột vi sinh EM lên mặt rác",
        checklist: "Rắc đều bột vi sinh EM lên mặt rác",
        durationMs: 5083,
      },
      {
        id: "press",
        caption: "Ấn nén chặt, lặp lại cho lớp tiếp theo",
        checklist: "Ấn nén chặt, lặp lại cho lớp tiếp theo",
        durationMs: 6067,
      },
    ],
  },
  {
    number: 3,
    title: "Khóa yếm khí & nạp gối đầu",
    shortLabel: "Khóa khí",
    badge: "",
    description: "",
    stageLabel: "Khóa yếm khí",
    summary: "Phủ túi nilon, đậy nắp kín",
    illustrationLabel:
      "Mặt cắt thùng đầy: túi nilon phủ sát mặt rác, bọt khí được miết ra thành thùng, nắp chuẩn bị đậy",
    featureTarget: "3D_Setup_Layer3",
    substeps: [
      {
        id: "bag",
        caption: "Phủ túi nilon dày sát mặt rác",
        checklist: "Phủ túi nilon dày sát mặt rác",
        durationMs: 4200,
      },
      {
        id: "smooth",
        caption: "Miết túi từ tâm ra thành thùng để đẩy hết bọt khí",
        checklist: "Miết từ tâm ra thành thùng, đẩy hết bọt khí",
        durationMs: 6533,
      },
      {
        id: "lid",
        caption: "Đậy nắp kín",
        checklist: "Đậy nắp kín",
        durationMs: 5100,
      },
    ],
    infoTiles: [
      { title: "Các ngày tiếp theo", text: "Mở túi → nạp lớp mới → miết khí → đậy", tone: "light" },
      { title: "3 ngày cuối", text: "Khóa kín, không mở nắp", tone: "dark", icon: "lock" },
    ],
  },
];

const setupStepsEn: readonly SetupStep[] = [
  {
    number: 1,
    title: "False bottom",
    shortLabel: "False bottom",
    badge: "10–20% height",
    description: "10L lidded plastic bin, no holes drilled.",
    illustrationLabel:
      "10L bin cross-section: flattened aluminum cans arranged horizontally at the base, crumpled newspaper tucked into the gaps",
    featureTarget: "3D_Setup_Layer1",
    substeps: [
      {
        id: "cans",
        caption: "Arrange flattened aluminum cans horizontally along the bottom",
        checklist: "Arrange flattened aluminum cans horizontally along the bottom",
        durationMs: 5350,
      },
      {
        id: "paper",
        caption: "Pack crumpled newspaper tightly into the gaps to absorb leachate",
        checklist: "Pack crumpled newspaper tightly into the gaps to absorb leachate",
        durationMs: 6817,
      },
      {
        id: "cardboard",
        caption: "Place a flat sheet of cardboard on top",
        checklist: "Place a flat sheet of cardboard on top",
        durationMs: 5950,
      },
    ],
  },
  {
    number: 2,
    title: "Layered organic loading",
    shortLabel: "Layering",
    badge: "~70% height",
    description: "",
    stageLabel: "Layered loading",
    stageTag: "Layer 3",
    summary: "~70% height · 3–5 cm layers",
    illustrationLabel:
      "Bin cross-section: false bottom, two compacted waste layers, and a third layer being sprinkled with Bokashi bran",
    featureTarget: "3D_Setup_Layer2",
    substeps: [
      {
        id: "chop",
        caption: "Chop food scraps small and squeeze out excess liquid",
        checklist: "Chop food scraps small and squeeze out excess liquid",
        durationMs: 5467,
      },
      {
        id: "spread",
        caption: "Spread into an even layer 3–5 cm thick",
        checklist: "Spread into an even layer 3–5 cm thick",
        durationMs: 5200,
      },
      {
        id: "bran",
        caption: "Sprinkle EM Bokashi bran evenly across the surface",
        checklist: "Sprinkle EM Bokashi bran evenly across the surface",
        durationMs: 5033,
      },
      {
        id: "press",
        caption: "Press down firmly and repeat for the next layers",
        checklist: "Press down firmly and repeat for the next layers",
        durationMs: 4983,
      },
    ],
  },
  {
    number: 3,
    title: "Anaerobic seal & daily loading",
    shortLabel: "Airtight seal",
    badge: "",
    description: "",
    stageLabel: "Anaerobic seal",
    summary: "Cover with plastic bag, seal lid",
    illustrationLabel:
      "Full bin cross-section: thick plastic bag pressed over scraps, air pockets smoothed to the walls, lid ready to close",
    featureTarget: "3D_Setup_Layer3",
    substeps: [
      {
        id: "bag",
        caption: "Lay a thick plastic bag snugly over the scraps",
        checklist: "Lay a thick plastic bag snugly over the scraps",
        durationMs: 4250,
      },
      {
        id: "smooth",
        caption: "Smooth the bag from the center to the walls to push out air pockets",
        checklist: "Smooth from center to walls to push out all air",
        durationMs: 7050,
      },
      {
        id: "lid",
        caption: "Close the lid tightly",
        checklist: "Close the lid tightly",
        durationMs: 5567,
      },
    ],
    infoTiles: [
      { title: "Next days", text: "Lift bag → add layer → push out air → seal", tone: "light" },
      { title: "Final 3 days", text: "Keep sealed, do not open", tone: "dark", icon: "lock" },
    ],
  },
];

export const setupStepsByLocale: Record<Locale, readonly SetupStep[]> = {
  vi: setupStepsVi,
  en: setupStepsEn,
};

export const setupSteps: readonly SetupStep[] = setupStepsByLocale.vi;

export function getSetupSteps(locale: Locale = "vi"): readonly SetupStep[] {
  return setupStepsByLocale[locale];
}

/** Looks up a step by number (always defined for SetupStepNumber). */
export function getSetupStep(n: SetupStepNumber, locale: Locale = "vi"): SetupStep {
  const step = setupStepsByLocale[locale].find((s) => s.number === n);
  if (!step) throw new Error(`Unknown setup step ${n}`);
  return step;
}

/** Page chrome for /setup/[step] (mobile and desktop). */
export const setupPageCopyByLocale: Record<Locale, SetupPageCopy> = {
  vi: {
    metaTitle: (step: SetupStep) => `Bước ${step.number} · ${step.title}`,
    stageChip: (step: SetupStep, total: number) => `Bước ${step.number}/${total} · ${step.stageLabel ?? step.title}`,
    stageLabel: (n: number) => `Mô phỏng bước ${n}`,
    switcherLabel: "Chọn bước",
    switcherItem: (step: SetupStep) => `${step.number} · ${step.shortLabel}`,
    desk: {
      title: "Thiết lập thùng ủ DIY",
      intro: "Thùng nhựa 10L có nắp, không khoan lỗ. Chọn một bước để xem hoạt ảnh.",
      crossSection: "Mặt cắt thùng nhựa 10L",
      materialsLabel: "Vật liệu cần chuẩn bị",
      materials: ["Thùng 10L có nắp", "Vỏ lon nhôm", "Giấy báo cũ", "Bìa carton", "Bột vi sinh EM", "Túi nilon dày"],
      stepListLabel: "Các bước thiết lập",
      prev: "Bước trước",
      next: "Bước tiếp theo",
      toFaq: "Xem cẩm nang sự cố",
      tipLead: "Các ngày sau: mở túi, nạp lớp mới, miết khí, đậy nắp. ",
      tipStrong: "3 ngày cuối khóa kín",
      tipTail: ", không mở.",
    },
  },
  en: {
    metaTitle: (step: SetupStep) => `Step ${step.number} · ${step.title}`,
    stageChip: (step: SetupStep, total: number) => `Step ${step.number}/${total} · ${step.stageLabel ?? step.title}`,
    stageLabel: (n: number) => `Step ${n} simulation`,
    switcherLabel: "Choose step",
    switcherItem: (step: SetupStep) => `${step.number} · ${step.shortLabel}`,
    desk: {
      title: "DIY Compost Bin Setup",
      intro: "10L lidded plastic bin, no holes drilled. Pick a step to view the animation.",
      crossSection: "10L plastic bin cross-section",
      materialsLabel: "Materials needed",
      materials: ["10L lidded bin", "Aluminum cans", "Old newspaper", "Cardboard", "EM Bokashi bran", "Thick plastic bag"],
      stepListLabel: "Setup steps",
      prev: "Previous step",
      next: "Next step",
      toFaq: "Troubleshooting guide",
      tipLead: "On following days: lift the bag, add a new layer, smooth out air, close the lid. ",
      tipStrong: "Keep sealed for the final 3 days",
      tipTail: ", do not open.",
    },
  },
};

export function getSetupPageCopy(locale: Locale = "vi"): SetupPageCopy {
  return setupPageCopyByLocale[locale];
}

export const setupPageCopy = setupPageCopyByLocale.vi;

/**
 * Animation player labels. Generic: M4 (FAQ) reuses them with the same player.
 * Pass as `labels` to <PlayerControls>.
 */
export const playerCopyByLocale: Record<Locale, PlayerCopy> = {
  vi: {
    pause: "Tạm dừng hoạt ảnh",
    play: "Phát hoạt ảnh",
    replay: "Xem lại từ đầu",
    progress: "Tiến độ hoạt ảnh",
    mute: "Tắt giọng đọc",
    unmute: "Bật giọng đọc",
    segment: (i: number, total: number, caption: string) => `Thao tác ${i}/${total}: ${caption}`,
  },
  en: {
    pause: "Pause animation",
    play: "Play animation",
    replay: "Replay from start",
    progress: "Animation progress",
    mute: "Mute voiceover",
    unmute: "Unmute voiceover",
    segment: (i: number, total: number, caption: string) => `Action ${i}/${total}: ${caption}`,
  },
};

export function getPlayerCopy(locale: Locale = "vi"): PlayerCopy {
  return playerCopyByLocale[locale];
}

export const playerCopy = playerCopyByLocale.vi;
