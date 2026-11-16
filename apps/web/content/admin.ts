/** Copy for the admin tracking dashboard (/admin), from the Tracking board. */
import type { Device, FeatureTab, Range } from "@/components/admin/types";

export const admin = {
  pageTitle: "Theo dõi truy cập",
  brandSuffix: "Quản trị",
  live: "Đang ghi nhận theo thời gian thực",
  heading: "Theo dõi truy cập Web App",
  subheading: "Bảng Web_Access_Logs · ẩn danh, không lưu thông tin định danh cá nhân trong log.",
  loadFailed: "Không tải được dữ liệu. Đang thử lại…",
  retry: "Tải lại",
  empty: "Chưa có dữ liệu trong khoảng này.",
  loading: "Đang tải…",
  rangeLabel: "Khoảng thời gian",
  deviceLabel: "Thiết bị",
  ranges: [
    { value: "today", label: "Hôm nay" },
    { value: "7d", label: "7 ngày" },
    { value: "30d", label: "30 ngày" },
    { value: "all", label: "Toàn chiến dịch" },
  ] satisfies { value: Range; label: string }[],
  devices: [
    { value: "all", label: "Tất cả" },
    { value: "mobile", label: "Mobile" },
    { value: "desktop", label: "Desktop" },
  ] satisfies { value: Device; label: string }[],
  kpis: {
    totalEvents: { label: "Tổng sự kiện", hint: "Mọi Event_Type" },
    uniqueSessions: { label: "Phiên truy cập", hint: "Session_ID duy nhất" },
    pageViews: { label: "Lượt mở app", hint: "page_view" },
    mobileShare: { label: "Truy cập từ Mobile", hint: "Device_Info" },
  },
  exportCsv: "Xuất CSV",
  exportPng: "Tải biểu đồ cho báo cáo",
  exportPngFailed: "Không tạo được ảnh biểu đồ. Vui lòng thử lại.",
  features: {
    title: "Tính năng được quan tâm nhất",
    chartLabel: "Biểu đồ cột số lượt xem theo Feature_Target",
    tabsLabel: "Nhóm tính năng",
    tabs: [
      { value: "all", label: "Tất cả" },
      { value: "setup", label: "Tab 1" },
      { value: "faq", label: "Tab 2" },
    ] satisfies { value: FeatureTab; label: string }[],
    legendSetup: "Tab 1 · Thiết lập",
    legendFaq: "Tab 2 · Sự cố",
    pngTitle: "Tính năng được quan tâm nhất · Bếp Gọn – Rác Đúng",
  },
  eventTypes: { title: "Theo loại sự kiện" },
  devicesCard: { title: "Thiết bị", mobile: "Mobile", desktop: "Desktop", tablet: "Tablet" },
  logs: {
    title: "Nhật ký gần nhất",
    searchLabel: "Lọc Feature_Target",
    searchPlaceholder: "vd. FAQ_1_Smell",
    columns: ["Timestamp", "Session_ID", "Event_Type", "Feature_Target", "Device_Info"],
    noTarget: "—",
    loadMore: "Xem thêm",
    loadingMore: "Đang tải…",
    empty: "Không có nhật ký nào khớp.",
  },
  reference: {
    title: "Khi nào sự kiện được ghi",
    rows: [
      ["page_view", "Mở app sau khi đăng nhập"],
      ["switch_tab", "Chuyển giữa Tab 1 và Tab 2"],
      ["view_3d_step", "Chọn Bước 1 / 2 / 3 → 3D_Setup_Layer1–3"],
      ["click_faq_3d", "Mở một sự cố → FAQ_1_Smell … FAQ_5_Disposal"],
    ] as const,
  },
  source: {
    title: "Nơi lưu dữ liệu",
    body: "Mỗi sự kiện được ghi kèm timestamp ngay khi xảy ra, lưu trong PostgreSQL của hệ thống.",
  },
} as const;
