import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnimationStage } from "./AnimationStage";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AnimationStage", () => {
  it("renders muted, playsInline, non-looping video with poster, aria-label, and caption in DOM", () => {
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    const pauseSpy = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});

    const { container, rerender } = render(
      <AnimationStage
        label="Mô phỏng bước 1"
        caption="Xếp vỏ lon nhôm"
        paused={false}
        videoSrc="/animations/step-1.mp4"
        posterSrc="/animations/step-1-poster.png"
        illustrationLabel="Mặt cắt thùng 10L"
        active={0}
        epoch={0}
      />,
    );

    expect(screen.getByRole("img", { name: "Mặt cắt thùng 10L" })).toBeTruthy();
    expect(screen.getByText("Xếp vỏ lon nhôm")).toBeTruthy();

    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video).toBeTruthy();
    expect(video.muted).toBe(true);
    expect(video.playsInline).toBe(true);
    expect(video.preload).toBe("auto");
    expect(video.loop).toBe(false);
    expect(video.getAttribute("src")).toBe("/animations/step-1.mp4");
    expect(video.getAttribute("poster")).toBe("/animations/step-1-poster.png");
    expect(playSpy).toHaveBeenCalledTimes(1);

    rerender(
      <AnimationStage
        label="Mô phỏng bước 1"
        caption="Chèn giấy báo"
        paused={true}
        videoSrc="/animations/step-1.mp4"
        posterSrc="/animations/step-1-poster.png"
        illustrationLabel="Mặt cắt thùng 10L"
        active={1}
        epoch={1}
      />,
    );

    expect(pauseSpy).toHaveBeenCalledTimes(1);
    expect(video.currentTime).toBe(4.5);
  });

  it("holds poster without autoplay when reducedMotion is enabled, and seeks on manual segment change", () => {
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    const pauseSpy = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});

    const { container, rerender } = render(
      <AnimationStage
        label="Hoạt ảnh sự cố 3"
        caption="Kiểm tra dịch"
        paused={true}
        videoSrc="/animations/faq-3.mp4"
        posterSrc="/animations/faq-3-poster.png"
        illustrationLabel="Mặt cắt dịch rỉ"
        active={0}
        epoch={0}
        reducedMotion={true}
      />,
    );

    const video = container.querySelector("video") as HTMLVideoElement;
    expect(playSpy).not.toHaveBeenCalled();
    expect(pauseSpy).toHaveBeenCalled();
    expect(video.currentTime).toBe(0);

    rerender(
      <AnimationStage
        label="Hoạt ảnh sự cố 3"
        caption="Nghiêng thùng"
        paused={true}
        videoSrc="/animations/faq-3.mp4"
        posterSrc="/animations/faq-3-poster.png"
        illustrationLabel="Mặt cắt dịch rỉ"
        active={1}
        epoch={1}
        reducedMotion={true}
      />,
    );

    expect(playSpy).not.toHaveBeenCalled();
    expect(video.currentTime).toBeCloseTo(8.92, 2);
  });
});
