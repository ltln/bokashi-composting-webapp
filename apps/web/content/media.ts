import type { Locale } from "@/lib/i18n";
import type { FaqSlug, SetupStepNumber } from "./types";

export interface BoardMedia {
  src: string;
  poster: string;
  hasAudio: boolean;
}

const SETUP_MEDIA: Record<Locale, Record<SetupStepNumber, BoardMedia>> = {
  vi: {
    1: { src: "/animations/step-1-vi.mp4", poster: "/animations/step-1-vi-poster.png", hasAudio: true },
    2: { src: "/animations/step-2-vi.mp4", poster: "/animations/step-2-vi-poster.png", hasAudio: true },
    3: { src: "/animations/step-3-vi.mp4", poster: "/animations/step-3-vi-poster.png", hasAudio: true },
  },
  en: {
    1: { src: "/animations/step-1-en.mp4", poster: "/animations/step-1-en-poster.png", hasAudio: true },
    2: { src: "/animations/step-2-en.mp4", poster: "/animations/step-2-en-poster.png", hasAudio: true },
    3: { src: "/animations/step-3-en.mp4", poster: "/animations/step-3-en-poster.png", hasAudio: true },
  },
};

const FAQ_MEDIA: Record<Locale, Record<FaqSlug, BoardMedia>> = {
  vi: {
    smell: { src: "/animations/faq-1-vi.mp4", poster: "/animations/faq-1-vi-poster.png", hasAudio: true },
    maggots: { src: "/animations/faq-2-vi.mp4", poster: "/animations/faq-2-vi-poster.png", hasAudio: true },
    liquid: { src: "/animations/faq-3-vi.mp4", poster: "/animations/faq-3-vi-poster.png", hasAudio: true },
    mold: { src: "/animations/faq-4-vi.mp4", poster: "/animations/faq-4-vi-poster.png", hasAudio: true },
    disposal: { src: "/animations/faq-5-vi.mp4", poster: "/animations/faq-5-vi-poster.png", hasAudio: true },
  },
  en: {
    smell: { src: "/animations/faq-1-en.mp4", poster: "/animations/faq-1-en-poster.png", hasAudio: true },
    maggots: { src: "/animations/faq-2-en.mp4", poster: "/animations/faq-2-en-poster.png", hasAudio: true },
    liquid: { src: "/animations/faq-3-en.mp4", poster: "/animations/faq-3-en-poster.png", hasAudio: true },
    mold: { src: "/animations/faq-4-en.mp4", poster: "/animations/faq-4-en-poster.png", hasAudio: true },
    disposal: { src: "/animations/faq-5-en.mp4", poster: "/animations/faq-5-en-poster.png", hasAudio: true },
  },
};

/** Resolves video/poster assets and audio presence for a setup step and locale. */
export function getSetupMedia(step: SetupStepNumber, locale: Locale = "vi"): BoardMedia {
  return SETUP_MEDIA[locale][step];
}

/** Resolves video/poster assets and audio presence for a FAQ and locale. */
export function getFaqMedia(slug: FaqSlug, locale: Locale = "vi"): BoardMedia {
  return FAQ_MEDIA[locale][slug];
}
