import type { Locale } from "@/lib/i18n";

export interface ShellCopy {
  /** Accessible name of the logo link (goes to Tab 1). */
  homeLabel: string;
  /** aria-label of both the bottom nav and the desktop nav. */
  navLabel: string;
  tabs: {
    setup: string;
    faq: string;
  };
  language: {
    label: string;
    viLabel: string;
    enLabel: string;
    shortVi: string;
    shortEn: string;
  };
}

/** Copy for the authenticated app shell (header + navigation), from the design boards. */
export const shellByLocale: Record<Locale, ShellCopy> = {
  vi: {
    homeLabel: "Bếp Gọn – Rác Đúng: về trang thiết lập thùng",
    navLabel: "Điều hướng chính",
    tabs: {
      setup: "Thiết lập thùng",
      faq: "Cẩm nang sự cố",
    },
    language: {
      label: "Chọn ngôn ngữ",
      viLabel: "Chuyển sang tiếng Việt",
      enLabel: "Chuyển sang tiếng Anh",
      shortVi: "VI",
      shortEn: "EN",
    },
  },
  en: {
    homeLabel: "Bếp Gọn – Rác Đúng: go to bin setup",
    navLabel: "Main navigation",
    tabs: {
      setup: "Bin Setup",
      faq: "Troubleshooting",
    },
    language: {
      label: "Choose language",
      viLabel: "Switch to Vietnamese",
      enLabel: "Switch to English",
      shortVi: "VI",
      shortEn: "EN",
    },
  },
};

export function getShell(locale: Locale = "vi"): ShellCopy {
  return shellByLocale[locale];
}

export const shell = shellByLocale.vi;
