import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LogRow } from "./types";

const calls = vi.hoisted(() => ({ paths: [] as string[] }));

const row = (id: number, target: string | null): LogRow => ({
  id,
  ts: "2031-06-15T09:00:00+07:00",
  sessionId: "8f14e45f-ceea-467a-9575-4b5e2c1b1d2a",
  eventType: target ? "click_faq_3d" : "page_view",
  featureTarget: target,
  deviceType: "mobile",
  deviceInfo: "Android / Chrome",
});

vi.mock("@/lib/api", () => ({
  api: vi.fn(async (path: string) => {
    calls.paths.push(path);
    const [endpoint] = path.replace("/admin/", "").split("?");
    switch (endpoint) {
      case "summary":
        return { totalEvents: 1832, uniqueSessions: 312, pageViews: 356, mobileShare: 81 };
      case "features":
        return [
          { target: "FAQ_1_Smell", count: 214 },
          { target: "3D_Setup_Layer1", count: 198 },
        ];
      case "event-types":
        return [{ type: "click_faq_3d", count: 712 }];
      case "devices":
        return [
          { deviceType: "mobile", count: 81 },
          { deviceType: "desktop", count: 19 },
        ];
      case "logs":
        return path.includes("cursor=")
          ? { items: [row(1, "FAQ_5_Disposal")], nextCursor: null }
          : { items: [row(3, "FAQ_1_Smell"), row(2, null)], nextCursor: "next" };
    }
    throw new Error(`unexpected ${path}`);
  }),
}));

const { AdminDashboard } = await import("./AdminDashboard");
const { Segmented } = await import("./Segmented");

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
          { value: "mobile", label: "Mobile" },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "Tất cả" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Mobile" }).getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Mobile" }));
    expect(onChange).toHaveBeenCalledWith("mobile");
  });
});

describe("AdminDashboard", () => {
  it("loads every panel with the default filters and shows the data", async () => {
    renderDash();
    expect(await screen.findByText("1.832")).toBeTruthy();
    expect(screen.getByText("81%")).toBeTruthy();
    await waitFor(() => expect(screen.getAllByText("FAQ_1_Smell").length).toBeGreaterThan(0));
    for (const p of ["summary", "features", "event-types", "devices", "logs"]) {
      expect(calls.paths.some((c) => c.startsWith(`/admin/${p}?range=7d&device=all`))).toBe(true);
    }
    expect(calls.paths).toContain("/admin/features?range=7d&device=all&tab=all");
    expect(screen.getByRole("button", { name: "7 ngày" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("has no sample-data badge or storage picker", async () => {
    renderDash();
    await screen.findByText("1.832");
    expect(screen.queryByText(/DỮ LIỆU MẪU/)).toBeNull();
    expect(screen.queryByText(/Supabase/)).toBeNull();
    expect(screen.queryByText(/Google Sheets/)).toBeNull();
  });

  it("range and device buttons refetch with the right query string", async () => {
    renderDash();
    await screen.findByText("1.832");
    fireEvent.click(screen.getByRole("button", { name: "30 ngày" }));
    fireEvent.click(screen.getByRole("button", { name: "Mobile" }));
    await waitFor(() => expect(calls.paths).toContain("/admin/summary?range=30d&device=mobile"));
    expect(screen.getByRole("button", { name: "30 ngày" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "7 ngày" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("link", { name: /Xuất CSV/ }).getAttribute("href")).toBe(
      "/api/admin/export.csv?range=30d&device=mobile",
    );
  });

  it("feature tab toggle requests the tab", async () => {
    renderDash();
    await screen.findByText("1.832");
    const group = screen.getByRole("group", { name: "Nhóm tính năng" });
    fireEvent.click(within(group).getByRole("button", { name: "Tab 2" }));
    await waitFor(() => expect(calls.paths).toContain("/admin/features?range=7d&device=all&tab=faq"));
  });

  it("searches Feature_Target by prefix and puts it in the CSV link", async () => {
    renderDash();
    await screen.findByText("1.832");
    fireEvent.change(screen.getByLabelText("Lọc Feature_Target"), { target: { value: " FAQ_" } });
    await waitFor(() => expect(calls.paths).toContain("/admin/logs?range=7d&device=all&target=FAQ_&limit=50"));
    expect(screen.getByRole("link", { name: /Xuất CSV/ }).getAttribute("href")).toBe(
      "/api/admin/export.csv?range=7d&device=all&target=FAQ_",
    );
  });

  it("load more appends the next page and then disappears", async () => {
    renderDash();
    const more = await screen.findByRole("button", { name: "Xem thêm" });
    expect(screen.queryByText("FAQ_5_Disposal")).toBeNull();
    fireEvent.click(more);
    await waitFor(() => expect(screen.getAllByText("FAQ_5_Disposal").length).toBeGreaterThan(0));
    expect(calls.paths).toContain("/admin/logs?range=7d&device=all&cursor=next&limit=50");
    expect(screen.queryByRole("button", { name: "Xem thêm" })).toBeNull();
  });

  it("renders a null Feature_Target as a dash and formats the timestamp", async () => {
    renderDash();
    await screen.findByRole("button", { name: "Xem thêm" });
    expect(screen.getAllByText("2031-06-15 09:00:00").length).toBe(2);
    expect(screen.getAllByText("—").length).toBe(1);
  });
});
