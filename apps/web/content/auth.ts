import type { Locale } from "@/lib/i18n";

export interface LoginCopy {
  pageTitle: string;
  heading: string;
  /** Mobile board subtext. */
  subtext: string;
  /** Desktop board subtext. */
  subtextDesktop: string;
  googleButton: string;
  illustrationLabel: string;
  features: readonly string[];
  legal: {
    before: string;
    terms: string;
    between: string;
    privacy: string;
    after: string;
  };
  /** Shown when the API redirects back with ?error=<code>. */
  errors: {
    denied: string;
    oauth: string;
    expired: string;
  };
}

/** Copy for the login screen (Login + DeskLogin boards in docs/design/). */
export const loginCopyByLocale: Record<Locale, LoginCopy> = {
  vi: {
    pageTitle: "Đăng nhập",
    heading: "Ủ rác bếp gọn gàng ngay tại phòng trọ",
    subtext: "Xem từng bước tự làm thùng ủ Bokashi và cách xử lý 5 sự cố thường gặp.",
    subtextDesktop: "Đăng nhập để xem hướng dẫn ủ Bokashi từng bước và cách xử lý sự cố.",
    googleButton: "Tiếp tục với Google",
    illustrationLabel: "Minh họa thùng ủ Bokashi với lớp đáy giả, các lớp rác và nắp xanh",
    features: [
      "3 bước tự làm thùng ủ 10L, không cần khoan lỗ",
      "Hoạt ảnh mặt cắt cho từng thao tác",
      "Cẩm nang xử lý 5 sự cố thường gặp",
    ],
    legal: {
      before: "Chỉ dùng tài khoản Google để đăng nhập. Khi tiếp tục, bạn đồng ý với ",
      terms: "Điều khoản",
      between: " và ",
      privacy: "Chính sách quyền riêng tư",
      after: ".",
    },
    errors: {
      denied: "Bạn đã hủy đăng nhập Google. Hãy thử lại khi sẵn sàng.",
      oauth: "Không thể đăng nhập bằng Google lúc này. Vui lòng thử lại.",
      expired: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    },
  },
  en: {
    pageTitle: "Sign in",
    heading: "Compost kitchen scraps cleanly in your rented room",
    subtext: "Watch step-by-step DIY Bokashi bin animations and troubleshoot 5 common issues.",
    subtextDesktop: "Sign in to view the step-by-step Bokashi guide and troubleshooting handbook.",
    googleButton: "Continue with Google",
    illustrationLabel: "Illustration of a Bokashi compost bin with a false bottom, waste layers, and green lid",
    features: [
      "3 steps to build a 10L bin, no drilling required",
      "Animated cross-sections for every action",
      "Troubleshooting guide for 5 common issues",
    ],
    legal: {
      before: "Google sign-in only. By continuing, you agree to the ",
      terms: "Terms",
      between: " and ",
      privacy: "Privacy Policy",
      after: ".",
    },
    errors: {
      denied: "You canceled Google sign-in. Try again whenever you are ready.",
      oauth: "Could not sign in with Google right now. Please try again.",
      expired: "Your session has expired. Please sign in again.",
    },
  },
};

export function getLoginCopy(locale: Locale = "vi"): LoginCopy {
  return loginCopyByLocale[locale];
}

export const loginCopy = loginCopyByLocale.vi;

export type LoginErrorCode = keyof LoginCopy["errors"];
