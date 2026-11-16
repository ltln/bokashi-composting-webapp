/**
 * Copy for the static legal pages (/terms, /privacy).
 * DRAFT: not reviewed by a lawyer yet. Keep `draftNotice` visible until it is.
 */
export interface LegalSection {
  heading: string;
  paragraphs: readonly string[];
}

export interface LegalPageContent {
  title: string;
  description: string;
  updated: string;
  sections: readonly LegalSection[];
}

const terms: LegalPageContent = {
  title: "Điều khoản sử dụng",
  description: "Điều khoản sử dụng ứng dụng Bếp Gọn – Rác Đúng.",
  updated: "11/2026",
  sections: [
    {
      heading: "1. Giới thiệu",
      paragraphs: [
        "Bếp Gọn – Rác Đúng là ứng dụng web miễn phí hướng dẫn tự làm và vận hành thùng ủ Bokashi tại phòng trọ. Khi sử dụng ứng dụng, bạn đồng ý với các điều khoản dưới đây.",
      ],
    },
    {
      heading: "2. Tài khoản",
      paragraphs: [
        "Bạn đăng nhập bằng tài khoản Google. Bạn chịu trách nhiệm giữ an toàn cho tài khoản Google của mình và cho mọi hoạt động diễn ra khi đăng nhập.",
      ],
    },
    {
      heading: "3. Nội dung hướng dẫn",
      paragraphs: [
        "Nội dung trong ứng dụng chỉ mang tính tham khảo. Hãy thực hiện trong điều kiện an toàn, giữ vệ sinh và tuân thủ quy định phân loại, thu gom rác tại nơi bạn ở. Chúng tôi không chịu trách nhiệm về thiệt hại phát sinh do áp dụng sai hướng dẫn.",
      ],
    },
    {
      heading: "4. Sử dụng hợp lệ",
      paragraphs: [
        "Không dùng ứng dụng để làm gián đoạn dịch vụ, truy cập trái phép hoặc thu thập dữ liệu tự động.",
      ],
    },
    {
      heading: "5. Thay đổi",
      paragraphs: [
        "Chúng tôi có thể cập nhật ứng dụng và các điều khoản này. Phiên bản mới có hiệu lực khi được đăng tại trang này.",
      ],
    },
  ],
};

const privacy: LegalPageContent = {
  title: "Chính sách quyền riêng tư",
  description: "Cách Bếp Gọn – Rác Đúng xử lý dữ liệu khi bạn đăng nhập và sử dụng ứng dụng.",
  updated: "11/2026",
  sections: [
    {
      heading: "1. Đăng nhập bằng Google",
      paragraphs: [
        "Ứng dụng chỉ hỗ trợ đăng nhập bằng Google. Google xác nhận danh tính và chia sẻ với chúng tôi tên, địa chỉ email và ảnh đại diện của bạn. Chúng tôi chỉ dùng các thông tin này để tạo tài khoản và duy trì phiên đăng nhập, không dùng cho quảng cáo và không chia sẻ cho bên thứ ba.",
        "Chúng tôi không nhận và không lưu mật khẩu Google của bạn.",
      ],
    },
    {
      heading: "2. Ghi nhận sử dụng ẩn danh",
      paragraphs: [
        "Để cải thiện nội dung, ứng dụng ghi lại một số sự kiện sử dụng một cách ẩn danh, ví dụ: mở ứng dụng, chuyển tab, xem một bước thiết lập hoặc một mục cẩm nang.",
        "Mỗi bản ghi chỉ gồm: mã phiên ẩn danh, loại sự kiện, tính năng được xem, loại thiết bị và thời điểm.",
        "Nhật ký sử dụng không chứa tên hay email của bạn, và không lưu địa chỉ IP. Màn hình đăng nhập không được ghi nhận.",
      ],
    },
    {
      heading: "3. Cookie",
      paragraphs: [
        "Chúng tôi chỉ dùng cookie cần thiết để duy trì phiên đăng nhập và bảo vệ yêu cầu khỏi bị giả mạo. Không dùng cookie quảng cáo.",
      ],
    },
    {
      heading: "4. Quyền của bạn",
      paragraphs: [
        "Bạn có thể yêu cầu xoá tài khoản và dữ liệu liên quan bằng cách liên hệ với nhóm phát triển.",
      ],
    },
  ],
};

export const legal = {
  draftNotice: "Bản nháp: nội dung đang chờ rà soát pháp lý và có thể thay đổi.",
  updatedLabel: "Cập nhật lần cuối:",
  backHome: "Về trang chủ",
  terms,
  privacy,
} as const;
