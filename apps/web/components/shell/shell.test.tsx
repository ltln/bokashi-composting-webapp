import { StrictMode, type ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pathname = vi.hoisted(() => ({ current: "/setup/1" }));

vi.mock("@/lib/tracking", () => ({ track: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a
      href={href}
      {...rest}
      onClick={(e) => {
        (rest as { onClick?: (e: unknown) => void }).onClick?.(e);
        e.preventDefault();
      }}
    >
      {children}
    </a>
  ),
}));

const { track } = await import("@/lib/tracking");
const { NavTabs } = await import("./NavTabs");
const { activeTabFor } = await import("./tabs");

beforeEach(() => {
  vi.mocked(track).mockClear();
  pathname.current = "/setup/1";
});
afterEach(cleanup);

describe("activeTabFor", () => {
  it.each([
    ["/setup/1", "setup"],
    ["/setup/3", "setup"],
    ["/faq", "faq"],
    ["/faq/smell", "faq"],
    ["/faqs", null],
    ["/terms", null],
    [null, null],
  ])("%s → %s", (path, tab) => {
    expect(activeTabFor(path)).toBe(tab);
  });
});

describe.each(["bottom", "top"] as const)("NavTabs (%s)", (variant) => {
  it("marks the tab for the current route with aria-current", () => {
    pathname.current = "/faq/mold";
    render(<NavTabs variant={variant} />);
    expect(screen.getByRole("link", { name: "Cẩm nang sự cố" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Thiết lập thùng" }).hasAttribute("aria-current")).toBe(false);
  });

  it("links to /setup/1 and /faq", () => {
    render(<NavTabs variant={variant} />);
    expect(screen.getByRole("link", { name: "Thiết lập thùng" }).getAttribute("href")).toBe("/setup/1");
    expect(screen.getByRole("link", { name: "Cẩm nang sự cố" }).getAttribute("href")).toBe("/faq");
  });

  it("tracks switch_tab with Tab_2_FAQ when switching to the FAQ tab", () => {
    render(<NavTabs variant={variant} />);
    fireEvent.click(screen.getByRole("link", { name: "Cẩm nang sự cố" }));
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("switch_tab", "Tab_2_FAQ");
  });

  it("tracks switch_tab with Tab_1_Setup when switching to the setup tab", () => {
    pathname.current = "/faq";
    render(<NavTabs variant={variant} />);
    fireEvent.click(screen.getByRole("link", { name: "Thiết lập thùng" }));
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("switch_tab", "Tab_1_Setup");
  });

  it("does not track a click on the already active tab", () => {
    render(<NavTabs variant={variant} />);
    fireEvent.click(screen.getByRole("link", { name: "Thiết lập thùng" }));
    expect(track).not.toHaveBeenCalled();
  });
});

describe("PageViewTracker", () => {
  it("tracks page_view exactly once per app load, even across remounts and StrictMode", async () => {
    vi.resetModules();
    const tracking = await import("@/lib/tracking");
    const { PageViewTracker } = await import("./PageViewTracker");

    const first = render(
      <StrictMode>
        <PageViewTracker />
      </StrictMode>,
    );
    first.unmount();
    render(<PageViewTracker />);

    expect(tracking.track).toHaveBeenCalledTimes(1);
    expect(tracking.track).toHaveBeenCalledWith("page_view");
  });
});
