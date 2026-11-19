/** Copy for the admin overview (/admin), from the Tracking board ("Admin · Tổng quan truy cập"). */
import type { Device, Metric, OverviewRange } from "@/components/admin/types";

export const admin = {
  pageTitle: "Tổng quan truy cập",
  brandSuffix: "Quản trị",
  online: (n: string) => `${n} người đăng nhập đang online`,
  heading: "Tổng quan truy cập",
  subheading: (range: string) => `Chỉ tính người dùng đã đăng nhập · ${range}`,
  loadFailed: "Không tải được dữ liệu. Đang thử lại…",
  noData: "Chưa có dữ liệu trong khoảng này.",
  rangeLabel: "Khoảng thời gian",
  deviceLabel: "Thiết bị",
  ranges: [
    { value: "today", label: "Hôm nay" },
    { value: "7d", label: "7 ngày" },
    { value: "30d", label: "30 ngày" },
  ] satisfies { value: OverviewRange; label: string }[],
  /** Subtitle under the heading: (first day, last day) as dd/mm/yyyy and dd/mm. */
  rangeText: {
    today: (day: string) => `Hôm nay, ${day}`,
    "7d": (from: string, to: string) => `7 ngày qua (${from} – ${to})`,
    "30d": (from: string, to: string) => `30 ngày qua (${from} – ${to})`,
  },
  rangeShort: { today: "Hôm nay", "7d": "7 ngày qua", "30d": "30 ngày qua" } satisfies Record<OverviewRange, string>,
  devices: [
    { value: "all", label: "Tất cả" },
    { value: "mobile", label: "Điện thoại" },
    { value: "desktop", label: "Máy tính" },
  ] satisfies { value: Device; label: string }[],

  export: {
    button: "Xuất báo cáo",
    csv: "Nhật ký sự kiện (CSV)",
    png: "Biểu đồ trang được xem (PNG)",
    pngTitle: "Trang được xem · Bếp Gọn – Rác Đúng",
    pngFailed: "Không tạo được ảnh biểu đồ. Vui lòng thử lại.",
    chartLabel: "Biểu đồ cột lượt xem theo trang",
  },

  kpisLabel: "Chỉ số chính",
  kpis: {
    visits: { label: "Lượt truy cập", sub: "so với kỳ trước" },
    users: { label: "Người dùng", sub: (n: string) => `${n} người mới` },
    views: { label: "Lượt xem trang", sub: (ppv: string) => `${ppv} trang mỗi lượt truy cập` },
  },
  /** Delta pill when the previous period had nothing to compare with. */
  deltaNew: "Mới",

  traffic: {
    title: "Lưu lượng truy cập",
    sub: { hour: "Theo giờ · di chuột hoặc dùng Tab để xem số liệu", day: "Theo ngày · di chuột hoặc dùng Tab để xem số liệu" },
    metricsLabel: "Chỉ số trên biểu đồ",
    previous: "Kỳ trước",
    previousValue: (n: string) => `Kỳ trước: ${n}`,
    chartAria: (metric: string, range: string, total: string, peak: string, at: string) =>
      `Biểu đồ ${metric}, ${range}: tổng ${total}, cao nhất ${peak} vào ${at}`,
  },
  metrics: [
    { value: "visits", label: "Lượt truy cập", unit: "lượt truy cập" },
    { value: "users", label: "Người dùng", unit: "người dùng" },
    { value: "views", label: "Lượt xem trang", unit: "lượt xem trang" },
  ] satisfies { value: Metric; label: string; unit: string }[],
  /** Weekday abbreviations, Sunday first (Date#getUTCDay order). */
  weekdays: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],

  pages: {
    title: "Trang được xem",
    sub: (views: string, ppv: string) => `${views} lượt xem · ${ppv} trang mỗi lượt · không tính trang đăng nhập`,
    columns: { page: "Trang", share: "Tỉ lệ lượt xem", views: "Lượt xem", viewers: "Người xem" },
    tabs: { setup: "Tab 1", faq: "Tab 2" },
    /** Screen name per Feature_Target (Tab_1_Setup is a tab switch, not a screen). */
    names: {
      "3D_Setup_Layer1": "Bước 1 · Tầng đáy giả",
      "3D_Setup_Layer2": "Bước 2 · Nạp cơ chất",
      "3D_Setup_Layer3": "Bước 3 · Khóa yếm khí",
      Tab_2_FAQ: "Danh sách sự cố",
      FAQ_1_Smell: "Sự cố 1 · Bốc mùi hôi",
      FAQ_2_Maggots: "Sự cố 2 · Ruồi giấm, giòi",
      FAQ_3_Liquid: "Sự cố 3 · Đọng dịch rỉ",
      FAQ_4_Mold: "Sự cố 4 · Nấm mốc",
      FAQ_5_Disposal: "Sự cố 5 · Xử lý đầu ra",
    } as Record<string, string>,
  },

  users: {
    title: "Người dùng",
    count: (n: string) => `${n} người`,
    newVsReturning: "Mới và quay lại",
    new: (n: string) => `Mới · ${n}`,
    returning: (n: string) => `Quay lại · ${n}`,
    devices: "Thiết bị",
    mobile: "Điện thoại",
    desktop: "Máy tính",
    tablet: "Máy tính bảng",
    peak: "Giờ cao điểm",
    peakRange: (from: number, to: number) => `Đông nhất ${from}–${to}h`,
    peakAria: (from: number, to: number) => `Lượt truy cập theo giờ trong ngày, đông nhất từ ${from} đến ${to} giờ`,
    hoursAria: "Lượt truy cập theo giờ trong ngày",
    hourTicks: ["0h", "6h", "12h", "18h", "23h"],
  },

  funnel: {
    title: "Hành trình người dùng",
    sub: "Tính từ lúc đăng nhập xong, bao nhiêu người đi tiếp tới từng bước",
    steps: {
      users: "Đã đăng nhập vào app",
      step1: "Xem Bước 1",
      allSteps: "Xem đủ 3 bước",
      faqTab: "Mở Cẩm nang sự cố",
      faqDetail: "Mở ít nhất 1 sự cố",
    },
    count: (n: string) => `${n} người`,
  },

  definitions: {
    label: "Cách tính số liệu",
    items: [
      ["Chỉ người đã đăng nhập", "Mọi số liệu bắt đầu tính sau khi đăng nhập Google thành công. Khách chưa đăng nhập không được tính."],
      ["Lượt truy cập", "Mỗi phiên của một người đã đăng nhập; hết 30 phút không thao tác thì tính phiên mới."],
      ["Người dùng", "Đếm theo User_ID duy nhất, băm từ tài khoản Google."],
      ["Lượt xem trang", "Mỗi lần mở một màn hình trong app: từng bước của Tab 1, danh sách và từng sự cố ở Tab 2. Không tính trang đăng nhập."],
    ] as const,
  },
} as const;
