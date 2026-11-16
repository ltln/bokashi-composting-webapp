import type { FaqSlug } from "@/content/types";

/**
 * Per-FAQ tint classes. Written out in full (not built from the slug) so
 * Tailwind's scanner sees them. Pairs come from tailwind.config.ts `bk.faq.*`.
 */
export const FAQ_TINT: Record<FaqSlug, { bg: string; fg: string }> = {
  smell: { bg: "bg-bk-faq-smell-bg", fg: "text-bk-faq-smell-fg" },
  maggots: { bg: "bg-bk-faq-maggots-bg", fg: "text-bk-faq-maggots-fg" },
  liquid: { bg: "bg-bk-faq-liquid-bg", fg: "text-bk-faq-liquid-fg" },
  mold: { bg: "bg-bk-faq-mold-bg", fg: "text-bk-faq-mold-fg" },
  disposal: { bg: "bg-bk-faq-disposal-bg", fg: "text-bk-faq-disposal-fg" },
};
