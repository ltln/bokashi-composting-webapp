import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/tracking", () => ({ track: vi.fn() }));
vi.mock("next/navigation", () => ({ useSelectedLayoutSegment: () => "liquid" }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const { track } = await import("@/lib/tracking");
const { faqs, getFaq, getFaqNeighbours } = await import("@/content/faqs");
const { FAQ_SLUGS } = await import("@/content/types");
const { FaqDetail } = await import("./FaqDetail");
const { FaqListView } = await import("./FaqListView");
const { FaqRail } = await import("./FaqRail");

// jsdom has no matchMedia; the player reads it for prefers-reduced-motion.
beforeEach(() => {
  vi.mocked(track).mockClear();
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: false,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("content/faqs", () => {
  it("covers every slug in order with the right feature targets", () => {
    expect(faqs.map((f) => f.slug)).toEqual([...FAQ_SLUGS]);
    expect(faqs.map((f) => f.featureTarget)).toEqual([
      "FAQ_1_Smell",
      "FAQ_2_Maggots",
      "FAQ_3_Liquid",
      "FAQ_4_Mold",
      "FAQ_5_Disposal",
    ]);
    expect(faqs.map((f) => f.number)).toEqual([1, 2, 3, 4, 5]);
  });

  it("gives every FAQ a question, sub-steps and unique sub-step ids", () => {
    for (const f of faqs) {
      expect(f.question.length).toBeGreaterThan(0);
      expect(f.substeps.length).toBeGreaterThan(0);
      expect(new Set(f.substeps.map((s) => s.id)).size).toBe(f.substeps.length);
    }
  });

  it("links neighbours: no prev on the first, no next on the last", () => {
    expect(getFaqNeighbours("smell")).toMatchObject({ prev: null, next: { slug: "maggots" } });
    expect(getFaqNeighbours("liquid")).toMatchObject({ prev: { slug: "maggots" }, next: { slug: "mold" } });
    expect(getFaqNeighbours("disposal")).toMatchObject({ prev: { slug: "mold" }, next: null });
  });
});

describe("FaqDetail", () => {
  it.each(faqs.map((f) => [f.slug, f.featureTarget] as const))("%s tracks click_faq_3d on mount", (slug, target) => {
    render(<FaqDetail faq={getFaq(slug)} />);
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("click_faq_3d", target);
  });

  it("shows the counter, back link and question", () => {
    render(<FaqDetail faq={getFaq("liquid")} />);
    expect(screen.getAllByText("Sự cố 3/5").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Quay lại danh sách sự cố" }).getAttribute("href")).toBe("/faq");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(getFaq("liquid").question);
  });

  it("links to the previous and next FAQ", () => {
    render(<FaqDetail faq={getFaq("maggots")} />);
    expect(screen.getByRole("link", { name: /Sự cố trước/ }).getAttribute("href")).toBe("/faq/smell");
    expect(screen.getByRole("link", { name: /Sự cố tiếp theo/ }).getAttribute("href")).toBe("/faq/liquid");
  });

  it("has no previous link on the first FAQ and goes back to the list from the last", () => {
    const { unmount } = render(<FaqDetail faq={getFaq("smell")} />);
    expect(screen.queryByRole("link", { name: /Sự cố trước/ })).toBeNull();
    unmount();
    render(<FaqDetail faq={getFaq("disposal")} />);
    expect(screen.queryByRole("link", { name: /Sự cố tiếp theo/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Về danh sách/ }).getAttribute("href")).toBe("/faq");
  });

  it("renders the toggle for the compare FAQs and the checklist for the others", () => {
    const { unmount } = render(<FaqDetail faq={getFaq("mold")} />);
    expect(screen.getByRole("group", { name: "Chọn trạng thái để phóng to" })).toBeTruthy();
    expect(screen.queryByText("Cách xử lý")).toBeNull();
    unmount();
    render(<FaqDetail faq={getFaq("smell")} />);
    expect(screen.getByText("Cách xử lý")).toBeTruthy();
    expect(screen.getAllByRole("listitem").length).toBe(getFaq("smell").substeps.length);
  });
});

describe("list and rail", () => {
  it("lists five cards linking to the details", () => {
    render(<FaqListView faqs={faqs} />);
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(FAQ_SLUGS.map((s) => `/faq/${s}`));
    expect(screen.getByText("Dấu hiệu mẻ ủ đạt chuẩn")).toBeTruthy();
  });

  it("marks the open FAQ in the rail", () => {
    render(<FaqRail faqs={faqs} />);
    const current = screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
    expect(current.map((a) => a.getAttribute("href"))).toEqual(["/faq/liquid"]);
  });
});
