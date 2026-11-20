import { cleanup, render, screen, waitFor } from "@testing-library/react";
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

  it("seeks cumulatively using substepDurationsMs and preserves currentTime when pausing mid-substep", () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    const durations = [5350, 6817, 5950];

    const { container, rerender } = render(
      <AnimationStage
        label="Step 1"
        caption="Cans"
        paused={false}
        videoSrc="/animations/step-1-en.mp4"
        posterSrc="/animations/step-1-en-poster.png"
        active={0}
        epoch={0}
        substepDurationsMs={durations}
        muted={false}
      />,
    );

    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video.muted).toBe(false);

    // Simulate natural video progression mid-substep 0 and then pause
    video.currentTime = 2.4;
    rerender(
      <AnimationStage
        label="Step 1"
        caption="Cans"
        paused={true}
        videoSrc="/animations/step-1-en.mp4"
        posterSrc="/animations/step-1-en-poster.png"
        active={0}
        epoch={0}
        substepDurationsMs={durations}
        muted={false}
      />,
    );
    expect(video.currentTime).toBeCloseTo(2.4, 3);

    // Advance to substep 1 -> cumulative start 5.35s
    rerender(
      <AnimationStage
        label="Step 1"
        caption="Paper"
        paused={false}
        videoSrc="/animations/step-1-en.mp4"
        posterSrc="/animations/step-1-en-poster.png"
        active={1}
        epoch={0}
        substepDurationsMs={durations}
        muted={false}
      />,
    );
    expect(video.currentTime).toBeCloseTo(5.35, 3);

    // Advance to substep 2 -> cumulative start 12.167s
    rerender(
      <AnimationStage
        label="Step 1"
        caption="Cardboard"
        paused={false}
        videoSrc="/animations/step-1-en.mp4"
        posterSrc="/animations/step-1-en-poster.png"
        active={2}
        epoch={0}
        substepDurationsMs={durations}
        muted={false}
      />,
    );
    expect(video.currentTime).toBeCloseTo(12.167, 3);

    // Reduced-motion manual jump to substep 1 settles near end of substep 1 (12.167 - 0.08)
    rerender(
      <AnimationStage
        label="Step 1"
        caption="Paper"
        paused={true}
        videoSrc="/animations/step-1-en.mp4"
        posterSrc="/animations/step-1-en-poster.png"
        active={1}
        epoch={1}
        reducedMotion={true}
        substepDurationsMs={durations}
        muted={false}
      />,
    );
    expect(video.currentTime).toBeCloseTo(12.087, 3);
  });

  it("falls back to muted playback and calls onAutoplayMuted when unmuted autoplay is blocked", async () => {
    const notAllowed = new DOMException("Not allowed", "NotAllowedError");
    const playSpy = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockRejectedValueOnce(notAllowed)
      .mockResolvedValueOnce(undefined);
    const onAutoplayMuted = vi.fn();

    const { container } = render(
      <AnimationStage
        label="Step 1"
        caption="Cans"
        paused={false}
        videoSrc="/animations/step-1-en.mp4"
        active={0}
        epoch={0}
        muted={false}
        onAutoplayMuted={onAutoplayMuted}
      />,
    );

    const video = container.querySelector("video") as HTMLVideoElement;
    await waitFor(() => {
      expect(onAutoplayMuted).toHaveBeenCalledTimes(1);
    });
    expect(video.muted).toBe(true);
    expect(playSpy).toHaveBeenCalledTimes(2);
  });
});
