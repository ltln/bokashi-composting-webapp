import type { Locale } from "@/lib/i18n";

export interface PlaceholdersCopy {
  login: string;
  setupStep: (n: number) => string;
  faqList: string;
  faqDetail: (n: number) => string;
  admin: string;
  terms: string;
  privacy: string;
  notFound: string;
}

/**
 * Temporary headings for the M0 placeholder pages. Each milestone replaces its
 * page and stops importing from here; delete this file once nothing uses it.
 */
export const placeholdersByLocale: Record<Locale, PlaceholdersCopy> = {
  vi: {
    login: "Đăng nhập",
    setupStep: (n: number) => `Bước ${n}/3`,
    faqList: "Cẩm nang sự cố",
    faqDetail: (n: number) => `Sự cố ${n}`,
    admin: "Theo dõi Web_Access_Logs",
    terms: "Điều khoản sử dụng",
    privacy: "Chính sách quyền riêng tư",
    notFound: "Không tìm thấy trang",
  },
  en: {
    login: "Sign in",
    setupStep: (n: number) => `Step ${n}/3`,
    faqList: "Troubleshooting",
    faqDetail: (n: number) => `Issue ${n}`,
    admin: "Web_Access_Logs Tracker",
    terms: "Terms of Use",
    privacy: "Privacy Policy",
    notFound: "Page not found",
  },
};

export function getPlaceholders(locale: Locale = "vi"): PlaceholdersCopy {
  return placeholdersByLocale[locale];
}

export const placeholders = placeholdersByLocale.vi;
