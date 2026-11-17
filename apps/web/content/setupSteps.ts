/**
 * Tab 1 copy: the 3 bin-setup steps, copied verbatim from the boards
 * docs/design/Main.dc.html (step 1), Step2.dc.html, Step3.dc.html and
 * DeskSetup.dc.html (desktop-only text).
 *
 * Captions the boards don't show (they only render one sub-step per step)
 * reuse that sub-step's checklist text, as DeskSetup does.
 */
import type { SetupStep, SetupStepNumber } from "./types";

/** Default time each sub-step plays before auto-advancing. */
const SUBSTEP_MS = 4500;

export const setupSteps: readonly SetupStep[] = [
  {
    number: 1,
    title: "Tầng đáy giả",
    shortLabel: "Đáy giả",
    badge: "10–20% chiều cao",
    description: "Thùng nhựa 10L có nắp, không khoan lỗ.",
    illustrationLabel:
      "Hoạt ảnh mặt cắt thùng 10L: lần lượt xếp lon nhôm bóp dẹp nằm ngang dưới đáy, chèn giấy báo vo viên vào khe, rồi phủ tấm bìa carton lên trên",
    featureTarget: "3D_Setup_Layer1",
    substeps: [
      {
        id: "cans",
        caption: "Xếp vỏ lon bóp dẹp nằm ngang dưới đáy",
        checklist: "Xếp vỏ lon nhôm bóp dẹp nằm ngang dưới đáy",
        durationMs: SUBSTEP_MS,
      },
      {
        id: "paper",
        caption: "Chèn giấy báo vo viên vào khe để hút dịch",
        checklist: "Chèn chặt giấy báo vo tròn vào khe trống để hút dịch rỉ",
        durationMs: SUBSTEP_MS,
      },
      {
        id: "cardboard",
        caption: "Phủ tấm bìa carton phẳng lên trên",
        checklist: "Phủ tấm bìa carton phẳng lên trên",
        durationMs: SUBSTEP_MS,
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
        durationMs: SUBSTEP_MS,
      },
      {
        id: "spread",
        caption: "Rải thành lớp dày 3–5 cm",
        checklist: "Rải thành lớp dày 3–5 cm",
        durationMs: SUBSTEP_MS,
      },
      {
        id: "bran",
        caption: "Rắc đều bột vi sinh EM lên mặt rác",
        checklist: "Rắc đều bột vi sinh EM lên mặt rác",
        durationMs: SUBSTEP_MS,
      },
      {
        id: "press",
        caption: "Ấn nén chặt, lặp lại cho lớp tiếp theo",
        checklist: "Ấn nén chặt, lặp lại cho lớp tiếp theo",
        durationMs: SUBSTEP_MS,
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
      "Mặt cắt thùng đầy: túi nilon phủ sát mặt rác; nửa trái đã miết phẳng, bàn tay đang miết từ tâm ra mép phải, đẩy bọt khí còn kẹt ra ngoài qua mép thùng",
    featureTarget: "3D_Setup_Layer3",
    substeps: [
      {
        id: "bag",
        caption: "Phủ túi nilon dày sát mặt rác",
        checklist: "Phủ túi nilon dày sát mặt rác",
        durationMs: SUBSTEP_MS,
      },
      {
        id: "smooth",
        caption: "Miết túi từ tâm ra thành thùng để đẩy hết bọt khí",
        checklist: "Miết từ tâm ra thành thùng, đẩy hết bọt khí",
        durationMs: SUBSTEP_MS,
      },
      {
        id: "lid",
        caption: "Đậy nắp kín",
        checklist: "Đậy nắp kín",
        durationMs: SUBSTEP_MS,
      },
    ],
    infoTiles: [
      { title: "Các ngày tiếp theo", text: "Mở túi → nạp lớp mới → miết khí → đậy", tone: "light" },
      { title: "3 ngày cuối", text: "Khóa kín, không mở nắp", tone: "dark", icon: "lock" },
    ],
  },
];

/** Looks up a step by number (always defined for SetupStepNumber). */
export function getSetupStep(n: SetupStepNumber): SetupStep {
  const step = setupSteps.find((s) => s.number === n);
  if (!step) throw new Error(`Unknown setup step ${n}`);
  return step;
}

/** Page chrome for /setup/[step] (mobile and desktop). */
export const setupPageCopy = {
  /** <title> segment. */
  metaTitle: (step: SetupStep) => `Bước ${step.number} · ${step.title}`,
  /** Stage chip, e.g. "Bước 1/3 · Tầng đáy giả". */
  stageChip: (step: SetupStep, total: number) => `Bước ${step.number}/${total} · ${step.stageLabel ?? step.title}`,
  /** aria-label of the stage section. */
  stageLabel: (n: number) => `Mô phỏng bước ${n}`,
  /** Step switcher (mobile). */
  switcherLabel: "Chọn bước",
  switcherItem: (step: SetupStep) => `${step.number} · ${step.shortLabel}`,
  /** Desktop aside (DeskSetup). */
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
} as const;

/**
 * Animation player labels. Generic: M4 (FAQ) reuses them with the same player.
 * Pass as `labels` to <PlayerControls>.
 */
export const playerCopy = {
  pause: "Tạm dừng hoạt ảnh",
  play: "Phát hoạt ảnh",
  replay: "Xem lại từ đầu",
  progress: "Tiến độ hoạt ảnh",
  /** Segment button (reduced motion), 1-based. */
  segment: (i: number, total: number, caption: string) => `Thao tác ${i}/${total}: ${caption}`,
} as const;
