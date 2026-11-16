/**
 * Temporary headings for the M0 placeholder pages. Each milestone replaces its
 * page and stops importing from here; delete this file once nothing uses it.
 */
export const placeholders = {
  login: "Đăng nhập",
  setupStep: (n: number) => `Bước ${n}/3`,
  faqList: "Cẩm nang sự cố",
  faqDetail: (n: number) => `Sự cố ${n}`,
  admin: "Theo dõi Web_Access_Logs",
  terms: "Điều khoản sử dụng",
  privacy: "Chính sách quyền riêng tư",
  notFound: "Không tìm thấy trang",
} as const;
