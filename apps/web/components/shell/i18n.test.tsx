import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pathname = vi.hoisted(() => ({ current: "/setup/1" }));
const segment = vi.hoisted(() => ({ current: "smell" as string | null }));

vi.mock("@/lib/tracking", () => ({ track: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
  useSelectedLayoutSegment: () => segment.current,
}));
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
const { LOCALE_STORAGE_KEY, LanguageProvider, setLocale } = await import("@/lib/i18n");
const { setVoiceMuted } = await import("@/lib/voice");
const { AppHeader } = await import("./AppHeader");
const { LanguageToggle } = await import("./LanguageToggle");
const { NavTabs } = await import("./NavTabs");
const { SetupStepView } = await import("@/components/setup");
const { FaqDetail, FaqListView, FaqRail } = await import("@/components/faq");
const { faqs, faqsByLocale, getFaq } = await import("@/content/faqs");
const { getSetupStep, setupStepsByLocale } = await import("@/content/setupSteps");

beforeEach(() => {
  vi.mocked(track).mockClear();
  pathname.current = "/setup/1";
  segment.current = "smell";
  window.localStorage.clear();
  setLocale("vi");
  setVoiceMuted(false);
  document.documentElement.lang = "vi";

  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: false,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  }));
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  setLocale("vi");
  setVoiceMuted(false);
  window.localStorage.clear();
  document.documentElement.lang = "vi";
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("LanguageToggle & LanguageProvider", () => {
  it("defaults to vi, updates localStorage and <html lang> when switching to en", () => {
    render(
      <LanguageProvider>
        <LanguageToggle />
      </LanguageProvider>,
    );

    const viBtn = screen.getByRole("button", { name: "Chuyển sang tiếng Việt" });
    const enBtn = screen.getByRole("button", { name: "Chuyển sang tiếng Anh" });

    expect(viBtn.getAttribute("aria-pressed")).toBe("true");
    expect(enBtn.getAttribute("aria-pressed")).toBe("false");
    expect(document.documentElement.lang).toBe("vi");

    fireEvent.click(enBtn);

    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    expect(screen.getByRole("button", { name: "Switch to Vietnamese" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("button", { name: "Switch to English" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("restores pre-existing en locale from localStorage on mount without overwriting it", () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "en");

    render(
      <LanguageProvider>
        <LanguageToggle />
      </LanguageProvider>,
    );

    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    expect(screen.getByRole("button", { name: "Switch to English" }).getAttribute("aria-pressed")).toBe("true");
  });
});

describe("Dynamic bilingual copy switching", () => {
  it("updates AppHeader and NavTabs copy without firing analytics", () => {
    render(
      <LanguageProvider>
        <AppHeader />
        <NavTabs variant="bottom" />
      </LanguageProvider>,
    );

    expect(screen.getByText("Ủ Bokashi tại phòng trọ")).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Thiết lập thùng" }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Chuyển sang tiếng Anh" }));

    expect(screen.getByText("DIY Bokashi for small rooms")).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Bin Setup" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Troubleshooting" }).length).toBeGreaterThan(0);
    expect(track).not.toHaveBeenCalled();
  });

  it("updates SetupStepView copy, voiced video src, and mute button when toggling VI -> EN without re-tracking", () => {
    const { container } = render(
      <LanguageProvider>
        <AppHeader />
        <SetupStepView step={getSetupStep(1)} />
      </LanguageProvider>,
    );

    expect(screen.getByRole("heading", { name: "Tầng đáy giả" })).toBeTruthy();
    expect(container.querySelector("video")?.getAttribute("src")).toBe("/animations/step-1-vi.mp4");
    const viMuteBtn = screen.getByRole("button", { name: "Tắt giọng đọc" });
    expect(viMuteBtn.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(viMuteBtn);
    expect(screen.getByRole("button", { name: "Bật giọng đọc" }).getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Bật giọng đọc" }));
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("view_3d_step", "3D_Setup_Layer1");

    fireEvent.click(screen.getByRole("button", { name: "Chuyển sang tiếng Anh" }));

    expect(screen.getByRole("heading", { name: "False bottom" })).toBeTruthy();
    expect(screen.getByText("DIY Compost Bin Setup")).toBeTruthy();
    expect(container.querySelector("video")?.getAttribute("src")).toBe("/animations/step-1-en.mp4");
    const muteBtn = screen.getByRole("button", { name: "Mute voiceover" });
    expect(muteBtn.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(muteBtn);
    expect(screen.getByRole("button", { name: "Unmute voiceover" }).getAttribute("aria-pressed")).toBe("false");
    expect(track).toHaveBeenCalledTimes(1);
  });

  it("updates FaqListView, FaqRail, and FaqDetail copy, voiced video src, and mute button without re-tracking", () => {
    pathname.current = "/faq/smell";
    const { container } = render(
      <LanguageProvider>
        <AppHeader />
        <FaqListView faqs={faqs} />
        <FaqRail faqs={faqs} />
        <FaqDetail faq={getFaq("smell")} />
      </LanguageProvider>,
    );

    expect(screen.getAllByText("Cẩm nang sự cố").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { level: 1, name: getFaq("smell", "vi").question })).toBeTruthy();
    expect(container.querySelector("video")?.getAttribute("src")).toBe("/animations/faq-1-vi.mp4");
    expect(screen.getByRole("button", { name: "Tắt giọng đọc" }).getAttribute("aria-pressed")).toBe("true");
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("click_faq_3d", "FAQ_1_Smell");

    fireEvent.click(screen.getByRole("button", { name: "Chuyển sang tiếng Anh" }));

    expect(screen.getAllByText("Troubleshooting").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { level: 1, name: getFaq("smell", "en").question })).toBeTruthy();
    expect(screen.getByText("How to fix")).toBeTruthy();
    expect(container.querySelector("video")?.getAttribute("src")).toBe("/animations/faq-1-en.mp4");
    const muteBtn = screen.getByRole("button", { name: "Mute voiceover" });
    fireEvent.click(muteBtn);
    expect(screen.getByRole("button", { name: "Unmute voiceover" })).toBeTruthy();
    expect(track).toHaveBeenCalledTimes(1);
  });
});

describe("Bilingual content structural parity", () => {
  it("keeps identical setup step numbers, targets, and substep IDs across vi and en", () => {
    const vi = setupStepsByLocale.vi;
    const en = setupStepsByLocale.en;
    expect(en.map((s) => ({ number: s.number, featureTarget: s.featureTarget, substeps: s.substeps.map((sub) => sub.id) }))).toEqual(
      vi.map((s) => ({ number: s.number, featureTarget: s.featureTarget, substeps: s.substeps.map((sub) => sub.id) })),
    );
  });

  it("keeps identical FAQ slugs, numbers, tints, targets, substep IDs, and compare option markers across vi and en", () => {
    const vi = faqsByLocale.vi;
    const en = faqsByLocale.en;
    expect(
      en.map((f) => ({
        slug: f.slug,
        number: f.number,
        tint: f.tint,
        featureTarget: f.featureTarget,
        substeps: f.substeps.map((sub) => sub.id),
        markers: f.options?.map((o) => o.marker),
      })),
    ).toEqual(
      vi.map((f) => ({
        slug: f.slug,
        number: f.number,
        tint: f.tint,
        featureTarget: f.featureTarget,
        substeps: f.substeps.map((sub) => sub.id),
        markers: f.options?.map((o) => o.marker),
      })),
    );
  });
});
