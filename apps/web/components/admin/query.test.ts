import { describe, expect, it } from "vitest";
import { adminPath, buildQuery, chartFileName, dateRangeLabel, exportHref, featuresPath, logsPath, tabOf } from "./query";

describe("buildQuery", () => {
  it("skips empty values and encodes the rest", () => {
    expect(buildQuery({ a: "x y", b: "", c: undefined, d: null, e: 0 })).toBe("?a=x+y&e=0");
    expect(buildQuery({})).toBe("");
  });
});

describe("admin paths", () => {
  const f = { range: "30d", device: "mobile" } as const;
  it("carries range and device on every endpoint", () => {
    expect(adminPath("summary", f)).toBe("/admin/summary?range=30d&device=mobile");
    expect(featuresPath(f, "faq")).toBe("/admin/features?range=30d&device=mobile&tab=faq");
  });
  it("logs include target, cursor and the page size", () => {
    expect(logsPath(f, "FAQ_", "abc")).toBe("/admin/logs?range=30d&device=mobile&target=FAQ_&cursor=abc&limit=50");
    expect(logsPath({ range: "all", device: "all" }, "")).toBe("/admin/logs?range=all&device=all&limit=50");
  });
  it("export link targets the CSV endpoint with the current filters", () => {
    expect(exportHref(f, "")).toBe("/api/admin/export.csv?range=30d&device=mobile");
    expect(exportHref({ range: "today", device: "all" }, "3D_")).toBe("/api/admin/export.csv?range=today&device=all&target=3D_");
  });
});

describe("dateRangeLabel", () => {
  // 2031-06-15 22:00 UTC is already 16 June in Ho Chi Minh City.
  const now = new Date("2031-06-15T22:00:00Z");
  it("uses Ho Chi Minh City calendar days", () => {
    expect(dateRangeLabel("today", now)).toBe("16/06/2031");
    expect(dateRangeLabel("7d", now)).toBe("10/06/2031 – 16/06/2031");
    expect(dateRangeLabel("30d", now)).toBe("18/05/2031 – 16/06/2031");
    expect(dateRangeLabel("all", now)).toBe("Toàn chiến dịch, đến 16/06/2031");
  });
});

describe("misc", () => {
  it("names the PNG after the range", () => {
    expect(chartFileName("7d")).toBe("bokashi-features-7d.png");
  });
  it("derives the tab from the target prefix", () => {
    expect(tabOf("Tab_1_Setup")).toBe("setup");
    expect(tabOf("3D_Setup_Layer2")).toBe("setup");
    expect(tabOf("Tab_2_FAQ")).toBe("faq");
    expect(tabOf("FAQ_4_Mold")).toBe("faq");
  });
});
