import type { Locale } from "@/lib/i18n";

export interface SiteCopy {
  name: string;
  tagline: string;
  description: string;
}

/** App-wide copy (from the header in the design boards). */
export const siteByLocale: Record<Locale, SiteCopy> = {
  vi: {
    name: "Bếp Gọn – Rác Đúng",
    tagline: "Ủ Bokashi tại phòng trọ",
    description: "Hướng dẫn tự làm thùng ủ Bokashi tại phòng trọ.",
  },
  en: {
    name: "Bếp Gọn – Rác Đúng",
    tagline: "DIY Bokashi for small rooms",
    description: "Step-by-step guide to building and running a DIY Bokashi compost bin in small rooms.",
  },
};

export function getSite(locale: Locale = "vi"): SiteCopy {
  return siteByLocale[locale];
}

export const site = siteByLocale.vi;
