/** Copy for the login screen (Login + DeskLogin boards in docs/design/). */
export const loginCopy = {
  pageTitle: "Đăng nhập",
  heading: "Ủ rác bếp gọn gàng ngay tại phòng trọ",
  /** Mobile board subtext. */
  subtext: "Xem từng bước tự làm thùng ủ Bokashi và cách xử lý 5 sự cố thường gặp.",
  /** Desktop board subtext. */
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
  /** Shown when the API redirects back with ?error=<code>. */
  errors: {
    denied: "Bạn đã hủy đăng nhập Google. Hãy thử lại khi sẵn sàng.",
    oauth: "Không thể đăng nhập bằng Google lúc này. Vui lòng thử lại.",
    expired: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  },
} as const;

export type LoginErrorCode = keyof typeof loginCopy.errors;
