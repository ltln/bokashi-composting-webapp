import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetTrackingForTests, backoffDelay, STORAGE_KEY, track } from "./tracking";
import { getSessionId } from "./session";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function sentBodies(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.map((c) => JSON.parse((c[1] as RequestInit).body as string));
}

let fetchMock: ReturnType<typeof vi.fn>;
let beaconMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.pushState({}, "", "/");
  __resetTrackingForTests();
  fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 202 });
  beaconMock = vi.fn().mockReturnValue(true);
  vi.stubGlobal("fetch", fetchMock);
  Object.defineProperty(navigator, "sendBeacon", { value: beaconMock, configurable: true });
});

afterEach(() => {
  __resetTrackingForTests();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("session id", () => {
  it("is a stable uuid per tab", () => {
    const id = getSessionId();
    expect(id).toMatch(UUID_RE);
    expect(getSessionId()).toBe(id);
    expect(window.sessionStorage.getItem("bokashi:session-id")).toBe(id);
  });
});

describe("batching", () => {
  it("flushes after 3 seconds", async () => {
    track("page_view");
    track("switch_tab", "Tab_2_FAQ");
    expect(fetchMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(3000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [body] = sentBodies(fetchMock);
    expect(body.events).toHaveLength(2);
    expect(body.events[0]).toMatchObject({ eventType: "page_view", sessionId: getSessionId() });
    expect(body.events[0]).not.toHaveProperty("featureTarget");
    expect(body.events[1]).toMatchObject({ eventType: "switch_tab", featureTarget: "Tab_2_FAQ" });
    expect(Number.isNaN(Date.parse(body.events[0].clientTs))).toBe(false);
  });

  it("flushes at 10 events without waiting", async () => {
    for (let i = 0; i < 10; i++) track("page_view");
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sentBodies(fetchMock)[0].events).toHaveLength(10);
    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("ignores /login", async () => {
    window.history.pushState({}, "", "/login");
    track("page_view");
    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("beacon flush", () => {
  it("sends the queue with sendBeacon when the page is hidden", async () => {
    track("page_view");
    track("view_3d_step", "3D_Setup_Layer1");
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(beaconMock).toHaveBeenCalledTimes(1);
    const [url, blob] = beaconMock.mock.calls[0] as [string, Blob];
    expect(url).toBe("/api/events");
    expect(blob.type).toBe("application/json");
    expect(JSON.parse(await blob.text()).events).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchMock).not.toHaveBeenCalled();
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
  });

  it("flushes on pagehide", () => {
    track("page_view");
    window.dispatchEvent(new Event("pagehide"));
    expect(beaconMock).toHaveBeenCalledTimes(1);
  });

  it("persists events when the beacon is refused", () => {
    beaconMock.mockReturnValue(false);
    track("page_view");
    window.dispatchEvent(new Event("pagehide"));
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)).toHaveLength(1);
  });
});

describe("retry and persistence", () => {
  it("retries with exponential backoff and keeps events in localStorage", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    track("page_view");
    await vi.advanceTimersByTimeAsync(3000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(backoffDelay(1));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(backoffDelay(2) - 1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    fetchMock.mockResolvedValue({ ok: true, status: 202 });
    await vi.advanceTimersByTimeAsync(backoffDelay(3));
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("retries on 5xx but drops a batch the server rejects with 400", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503 }).mockResolvedValue({ ok: false, status: 400 });
    track("page_view");
    await vi.advanceTimersByTimeAsync(3000);
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    await vi.advanceTimersByTimeAsync(backoffDelay(1));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("resends events persisted by a previous page load", async () => {
    const sessionId = getSessionId();
    const stored = [{ eventType: "page_view", clientTs: new Date().toISOString(), sessionId }];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    track("switch_tab", "Tab_1_Setup");
    await vi.advanceTimersByTimeAsync(3000);
    const [body] = sentBodies(fetchMock);
    expect(body.events.map((e: { eventType: string }) => e.eventType)).toEqual(["page_view", "switch_tab"]);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("backoffDelay", () => {
  it("doubles and caps", () => {
    expect(backoffDelay(1)).toBe(1000);
    expect(backoffDelay(2)).toBe(2000);
    expect(backoffDelay(3)).toBe(4000);
    expect(backoffDelay(20)).toBe(60_000);
  });
});
