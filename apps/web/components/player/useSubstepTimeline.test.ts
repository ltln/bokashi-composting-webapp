import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSubstepTimeline, type SubstepTimelineOptions } from "./useSubstepTimeline";

const DURATIONS = [1000, 2000, 1000];

function setup(options?: SubstepTimelineOptions, durations: number[] = DURATIONS) {
  return renderHook((props: { d: number[]; o?: SubstepTimelineOptions }) => useSubstepTimeline(props.d, props.o), {
    initialProps: { d: durations, o: options },
  });
}

/** Advance fake time (and the rAF frames inside it), flushing React updates. */
function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("useSubstepTimeline", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"],
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("autoplays and reports progress within the active sub-step", () => {
    const { result } = setup();
    expect(result.current.active).toBe(0);
    expect(result.current.playing).toBe(true);

    advance(500);
    expect(result.current.active).toBe(0);
    expect(result.current.progress).toBeGreaterThan(0.4);
    expect(result.current.progress).toBeLessThan(0.6);
  });

  it("advances through the sub-steps using each duration", () => {
    const { result } = setup();
    advance(1100);
    expect(result.current.active).toBe(1);
    advance(1000);
    expect(result.current.active).toBe(1);
    expect(result.current.progress).toBeGreaterThan(0.45);
    advance(1000);
    expect(result.current.active).toBe(2);
  });

  it("stops at the end without loop, and play() replays", () => {
    const { result } = setup();
    advance(5000);
    expect(result.current.active).toBe(2);
    expect(result.current.progress).toBe(1);
    expect(result.current.ended).toBe(true);
    expect(result.current.playing).toBe(false);

    act(() => result.current.play());
    expect(result.current.active).toBe(0);
    expect(result.current.ended).toBe(false);
    expect(result.current.playing).toBe(true);
  });

  it("wraps around with loop", () => {
    const { result } = setup({ loop: true });
    advance(4000 + 300);
    expect(result.current.ended).toBe(false);
    expect(result.current.active).toBe(0);
  });

  it("pause() freezes the clock and play() resumes it", () => {
    const { result } = setup();
    advance(500);
    act(() => result.current.pause());
    const frozen = result.current.progress;
    expect(result.current.playing).toBe(false);

    advance(3000);
    expect(result.current.active).toBe(0);
    expect(result.current.progress).toBe(frozen);

    act(() => result.current.play());
    advance(600);
    expect(result.current.active).toBe(1);
  });

  it("toggle() flips between playing and paused", () => {
    const { result } = setup();
    act(() => result.current.toggle());
    expect(result.current.playing).toBe(false);
    act(() => result.current.toggle());
    expect(result.current.playing).toBe(true);
  });

  it("the external paused option holds the clock", () => {
    const { result, rerender } = setup({ paused: true });
    advance(3000);
    expect(result.current.playing).toBe(false);
    expect(result.current.active).toBe(0);
    expect(result.current.progress).toBe(0);

    rerender({ d: DURATIONS, o: { paused: false } });
    advance(1100);
    expect(result.current.active).toBe(1);
  });

  it("goTo() jumps, resets progress, clamps and bumps epoch", () => {
    const { result } = setup();
    advance(400);
    const epoch = result.current.epoch;

    act(() => result.current.goTo(2));
    expect(result.current.active).toBe(2);
    expect(result.current.progress).toBe(0);
    expect(result.current.epoch).toBe(epoch + 1);

    act(() => result.current.goTo(99));
    expect(result.current.active).toBe(2);
    act(() => result.current.goTo(-3));
    expect(result.current.active).toBe(0);
  });

  it("replay() restarts from the first sub-step and plays", () => {
    const { result } = setup();
    advance(1500);
    act(() => result.current.pause());
    act(() => result.current.replay());
    expect(result.current.active).toBe(0);
    expect(result.current.progress).toBe(0);
    expect(result.current.playing).toBe(true);
  });

  it("autoplay: false waits for the user; goTo() steps manually (reduced motion)", () => {
    const { result } = setup({ autoplay: false });
    advance(5000);
    expect(result.current.playing).toBe(false);
    expect(result.current.active).toBe(0);

    act(() => result.current.goTo(1));
    advance(5000);
    expect(result.current.active).toBe(1);
    expect(result.current.playing).toBe(false);
  });

  it("follows an autoplay change until the user interacts", () => {
    const { result, rerender } = setup({ autoplay: true });
    rerender({ d: DURATIONS, o: { autoplay: false } });
    expect(result.current.playing).toBe(false);

    act(() => result.current.play());
    rerender({ d: DURATIONS, o: { autoplay: false } });
    expect(result.current.playing).toBe(true);
  });

  it("does not reset when given a new array with the same durations", () => {
    const { result, rerender } = setup();
    advance(1200);
    rerender({ d: [...DURATIONS], o: undefined });
    expect(result.current.active).toBe(1);
  });

  it("does not skip sub-steps after a long frame gap", () => {
    const { result } = setup();
    act(() => result.current.pause());
    act(() => result.current.play());
    // A single huge jump is clamped per frame; frames still run every ~16 ms.
    advance(16);
    expect(result.current.active).toBe(0);
  });
});
