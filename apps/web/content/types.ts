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
  /** Pill on the checklist card, e.g. "10–20% chiều cao". */
  badge: string;
  /** One-line description under the title. */
  description: string;
  /** aria-label for the illustration SVG. */
  illustrationLabel: string;
  substeps: Substep[];
  featureTarget: SetupFeatureTarget;
}

/** A troubleshooting FAQ (Tab 2). */
export interface Faq {
  slug: FaqSlug;
  /** 1–5, matches the "Sự cố N" label. */
  number: 1 | 2 | 3 | 4 | 5;
  /** Category after "Sự cố N · ", e.g. "Mùi". */
  category: string;
  /** The question shown on the list card and as the detail heading. */
  question: string;
  /** Optional short answer/summary under the heading. */
  summary?: string;
  /** aria-label for the illustration SVG. */
  illustrationLabel: string;
  substeps: Substep[];
  /** Tint pair key: maps to `bg-bk-faq-<tint>-bg` / `text-bk-faq-<tint>-fg`. */
  tint: FaqSlug;
  featureTarget: FaqFeatureTarget;
}
