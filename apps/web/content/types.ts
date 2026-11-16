/**
 * Typed shapes for all Vietnamese copy. M3 fills `content/setupSteps.ts`
 * (SetupStep[]) and M4 fills `content/faqs.ts` (Faq[]), copying text verbatim
 * from the boards in docs/design/.
 */
import type { FeatureTarget } from "@bokashi/contracts/events";

/** Route params for /setup/[step]. */
export const SETUP_STEP_NUMBERS = [1, 2, 3] as const;
export type SetupStepNumber = (typeof SETUP_STEP_NUMBERS)[number];

/** Route params for /faq/[slug], in display order (FAQ 1 → 5). */
export const FAQ_SLUGS = ["smell", "maggots", "liquid", "mold", "disposal"] as const;
export type FaqSlug = (typeof FAQ_SLUGS)[number];

/** Tracking targets restricted to the right family. */
export type SetupFeatureTarget = Extract<FeatureTarget, `3D_Setup_${string}`>;
export type FaqFeatureTarget = Extract<FeatureTarget, `FAQ_${string}`>;

/** One animated sub-step: drives the caption, the checklist row and the progress segment. */
export interface Substep {
  /** Stable id, unique within its step/FAQ (e.g. "cans", "paper"). */
  id: string;
  /** Caption bubble text shown over the animation. */
  caption: string;
  /** Checklist row text. */
  checklist: string;
  /** How long the sub-step plays before auto-advancing. */
  durationMs: number;
}

/** A bin-setup step (Tab 1). */
export interface SetupStep {
  number: SetupStepNumber;
  /** Full title, e.g. "Tầng đáy giả". */
  title: string;
  /** Step-switcher label, e.g. "Đáy giả" (rendered as "1 · Đáy giả"). */
  shortLabel: string;
  /** Pill on the checklist card, e.g. "10–20% chiều cao". Empty string: no pill. */
  badge: string;
  /** One-line description under the title. Empty string: none. */
  description: string;
  /** aria-label for the illustration SVG. */
  illustrationLabel: string;
  substeps: Substep[];
  featureTarget: SetupFeatureTarget;
  /** Stage chip text after "Bước N/3 · ", e.g. "Nạp cơ chất". Defaults to `title`. */
  stageLabel?: string;
  /** Extra chip at the stage's top right, e.g. "Lớp 3". */
  stageTag?: string;
  /** Second line in the desktop step list, e.g. "~70% chiều cao · lớp 3–5 cm". Defaults to `badge`. */
  summary?: string;
  /** Tiles under the checklist (step 3: "Các ngày tiếp theo", "3 ngày cuối"). */
  infoTiles?: SetupInfoTile[];
}

/** An info tile under a setup step's checklist. */
export interface SetupInfoTile {
  /** Bold first line. */
  title: string;
  /** Body line. */
  text: string;
  /** light: pale tile with dark text. dark: primary-dark tile with white text. */
  tone: "light" | "dark";
  /** Optional leading icon on the title line. */
  icon?: "lock";
}

/** A troubleshooting FAQ (Tab 2). */
export interface Faq {
  slug: FaqSlug;
  /** 1–5, matches the "Sự cố N" label. */
  number: 1 | 2 | 3 | 4 | 5;
  /** Category after "Sự cố N · ", e.g. "Mùi". */
  category: string;
  /** The full question, shown as the detail heading. */
  question: string;
  /** Shorter title shown on the list cards and the desktop rail. */
  listTitle: string;
  /** Optional short answer/summary under the heading. */
  summary?: string;
  /** aria-label of the animation stage <section>, e.g. "Hoạt ảnh xử lý mùi hôi". */
  stageLabel: string;
  /** aria-label for the illustration SVG. */
  illustrationLabel: string;
  substeps: Substep[];
  /** Chip at the stage's top right, e.g. "Thối → Chua nhẹ". */
  stageBadge?: { from: string; to: string };
  /**
   * Compare layout (FAQ 4 and 5): two or three side-by-side states instead of
   * an ordered checklist. `options[i]` belongs to `substeps[i]`.
   */
  options?: readonly FaqOption[];
  /** Tint pair key: maps to `bg-bk-faq-<tint>-bg` / `text-bk-faq-<tint>-fg`. */
  tint: FaqSlug;
  featureTarget: FaqFeatureTarget;
}

/** One side of a compare-style FAQ (FAQ 4: white vs green/black mold; FAQ 5: the outputs). */
export interface FaqOption {
  /** Figure caption inside the stage, e.g. "Mốc trắng mỏng". */
  figureLabel: string;
  /** Short label of the toggle button, e.g. "Mốc trắng". */
  toggleLabel: string;
  /** Pill under the figure, e.g. "Đạt chuẩn". */
  tag: string;
  /** Marker in the note row: a check or cross icon, or a letter such as "a". */
  marker: "check" | "cross" | (string & {});
  /** Note row text; `bold` is rendered in <b>. */
  note: { before?: string; bold: string; after?: string };
}
