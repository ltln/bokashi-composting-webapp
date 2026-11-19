import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Overview } from "./types";

const calls = vi.hoisted(() => ({ paths: [] as string[] }));

const point = (day: number, visits: number | null, prev: number) => ({
  start: `2026-11-${String(day).padStart(2, "0")}T00:00`,
  visits,
  users: visits === null ? null : Math.round(visits * 0.8),
  views: visits === null ? null : visits * 4,
  prevVisits: prev,
  prevUsers: prev,
  prevViews: prev * 3,
});

const overview = (range: Overview["range"]): Overview => ({
  range,
  unit: range === "today" ? "hour" : "day",
  from: range === "7d" ? "2026-11-13" : range === "30d" ? "2026-10-21" : "2026-11-19",
  to: "2026-11-19",
  online: 12,
  totals: { visits: 412, users: 250, newUsers: 160, views: 1566 },
  previous: { visits: 349, users: 260, newUsers: 0, views: 0 },
  series: [point(13, 38, 30), point(14, 45, 40), point(15, 52, 44), point(16, 61, 50), point(17, 47, 40), point(18, 73, 60), point(19, 96, 80)],
  pages: [
    { target: "3D_Setup_Layer1", views: 266, viewers: 150 },
    { target: "FAQ_1_Smell", views: 219, viewers: 120 },
    { target: "Tab_2_FAQ", views: 188, viewers: 100 },
  ],
  devices: { mobile: 334, desktop: 78, tablet: 0 },
  hours: [2, 1, 1, 0, 0, 1, 3, 6, 8, 9, 11, 14, 18, 13, 10, 9, 11, 13, 16, 21, 26, 24, 15, 6],
  funnel: { users: 250, step1: 220, allSteps: 130, faqTab: 118, faqDetail: 98 },
});

vi.mock("@/lib/api", () => ({
  api: vi.fn(async (path: string) => {
    calls.paths.push(path);
    const url = new URL(path, "http://x");
    if (url.pathname !== "/admin/overview") throw new Error(`unexpected ${path}`);
    return overview((url.searchParams.get("range") ?? "7d") as Overview["range"]);
  }),
}));

const { AdminDashboard } = await import("./AdminDashboard");
const { Segmented } = await import("./Segmented");
const q = await import("./query");

const renderDash = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <AdminDashboard />
    </SWRConfig>,
  );

beforeEach(() => {
  calls.paths.length = 0;
});
afterEach(cleanup);

describe("Segmented", () => {
  it("marks the active option with aria-pressed and reports clicks", () => {
    const onChange = vi.fn();
    render(
      <Segmented
        label="Thiết bị"
        value="all"
        onChange={onChange}
        options={[
          { value: "all", label: "Tất cả" },
          { value: "mobile", label: "Điện thoại" },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "Tất cả" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Điện thoại" }));
    expect(onChange).toHaveBeenCalledWith("mobile");
  });
});

describe("query helpers", () => {
  it("formats deltas, including a previous period with no data", () => {
    expect(q.formatDelta(412, 349)).toEqual({ text: "+18%", down: false });
    expect(q.formatDelta(250, 260)).toEqual({ text: "−4%", down: true });
    expect(q.formatDelta(5, 0)).toEqual({ text: "Mới", down: false });
    expect(q.formatDelta(0, 0)).toEqual({ text: "0%", down: false });
  });

  it("labels buckets per range", () => {
    expect(q.bucketLabel("2026-11-19T21:00", "today")).toBe("21h");
    expect(q.bucketLabel("2026-11-13T00:00", "7d")).toBe("T6 13/11");
    expect(q.bucketLabel("2026-11-15T00:00", "7d")).toBe("CN 15/11");
    expect(q.bucketLabel("2026-10-21T00:00", "30d")).toBe("21/10");
  });

  it("finds the busy hours around the peak", () => {
    expect(q.peakWindow(overview("7d").hours)).toEqual([18, 22]);
    expect(q.peakWindow(new Array(24).fill(0))).toBeNull();
  });

  it("builds nice whole-number y ticks", () => {
    expect(q.niceSteps(96)).toEqual([0, 30, 60, 90, 120]);
    expect(q.niceSteps(0)).toEqual([0, 1, 2, 3, 4]);
  });

  it("writes the range subtitle", () => {
    expect(q.rangeText({ range: "7d", from: "2026-11-13", to: "2026-11-19" })).toBe("7 ngày qua (13/11 – 19/11)");
    expect(q.rangeText({ range: "today", from: "2026-11-19", to: "2026-11-19" })).toBe("Hôm nay, 19/11/2026");
  });
});

describe("AdminDashboard", () => {
  it("loads the overview with the default filters and shows every section", async () => {
    renderDash();
    expect(await screen.findByText("412")).toBeTruthy();
    expect(calls.paths).toEqual(["/admin/overview?range=7d&device=all"]);
    expect(screen.getByText("12 người đăng nhập đang online")).toBeTruthy();
    expect(screen.getByText("Chỉ tính người dùng đã đăng nhập · 7 ngày qua (13/11 – 19/11)")).toBeTruthy();

    const kpis = screen.getByRole("list", { name: "Chỉ số chính" });
    expect(within(kpis).getByText("+18%")).toBeTruthy();
    expect(within(kpis).getByText("−4%")).toBeTruthy();
    expect(within(kpis).getByText("Mới")).toBeTruthy();
    expect(within(kpis).getByText("160 người mới")).toBeTruthy();
    expect(within(kpis).getByText("3,8 trang mỗi lượt truy cập")).toBeTruthy();

    const pages = screen.getByRole("table");
    expect(within(pages).getAllByRole("row")).toHaveLength(10); // header + all 9 screens
    expect(within(pages).getByText("Bước 1 · Tầng đáy giả")).toBeTruthy();
    expect(within(pages).getByText("Sự cố 5 · Xử lý đầu ra")).toBeTruthy();

    expect(screen.getByText("Đông nhất 18–22h")).toBeTruthy();
    expect(screen.getByText("Điện thoại 81%")).toBeTruthy();
    expect(screen.getByText("Quay lại · 90")).toBeTruthy();
    expect(screen.getByText("Xem đủ 3 bước")).toBeTruthy();
    expect(screen.getByText("52%")).toBeTruthy();
    expect(screen.queryByText(/DỮ LIỆU MẪU/)).toBeNull();
  });

  it("range and device buttons refetch and update the CSV link", async () => {
    renderDash();
    await screen.findByText("412");
    fireEvent.click(screen.getByRole("button", { name: "30 ngày" }));
    fireEvent.click(screen.getByRole("button", { name: "Điện thoại" }));
    await waitFor(() => expect(calls.paths).toContain("/admin/overview?range=30d&device=mobile"));
    expect(screen.getByRole("button", { name: "30 ngày" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: /Xuất báo cáo/ }));
    expect(screen.getByRole("link", { name: /Nhật ký sự kiện \(CSV\)/ }).getAttribute("href")).toBe(
      "/api/admin/export.csv?range=30d&device=mobile",
    );
  });

  it("export menu opens, offers CSV and PNG, and closes on Escape", async () => {
    renderDash();
    await screen.findByText("412");
    const btn = screen.getByRole("button", { name: /Xuất báo cáo/ });
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("button", { name: /Biểu đồ trang được xem \(PNG\)/ })).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("link", { name: /CSV/ })).toBeNull();
  });

  it("chart metric switch and hover tooltip", async () => {
    renderDash();
    await screen.findByText("412");
    const metrics = screen.getByRole("group", { name: "Chỉ số trên biểu đồ" });
    fireEvent.click(within(metrics).getByRole("button", { name: "Lượt xem trang" }));
    expect(within(metrics).getByRole("button", { name: "Lượt xem trang" }).getAttribute("aria-pressed")).toBe("true");
    const point = screen.getByRole("button", { name: "T5 19/11: 384 lượt xem trang" });
    fireEvent.focus(point);
    expect(screen.getByText("Kỳ trước: 240")).toBeTruthy();
  });
});
