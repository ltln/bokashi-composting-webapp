/**
 * Tracking client: STABLE PUBLIC API. Call it from any milestone.
 *
 *   track("page_view");
 *   track("switch_tab", "Tab_2_FAQ");
 *   track(EventType.View3DStep, FeatureTarget.SetupLayer1);
 *
 * Never hand-type strings outside the generated unions; import constants from
 * "@bokashi/contracts/events" when convenient. Calls on /login are ignored.
 *
 * Events go into a memory queue that is flushed every 3 s or at 10 events.
 * When the page is hidden or closed the queue is handed to sendBeacon. Failed
 * sends retry with exponential backoff, and unsent events are kept in
 * localStorage and resent on the next load.
 */
import type { EventType, FeatureTarget } from "@bokashi/contracts/events";
import { getSessionId } from "./session";

export type { EventType, FeatureTarget };

type QueuedEvent = {
  eventType: EventType;
  featureTarget?: FeatureTarget;
  clientTs: string;
  sessionId: string;
};

export const ENDPOINT = "/api/events";
export const STORAGE_KEY = "bokashi:pending-events";
export const FLUSH_INTERVAL_MS = 3000;
export const FLUSH_SIZE = 10;
export const MAX_BATCH = 50; // server limit
const MAX_QUEUE = 500; // drop the oldest beyond this so storage cannot grow forever
const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 60_000;

let queue: QueuedEvent[] = [];
let timer: ReturnType<typeof setTimeout> | undefined;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let failures = 0;
let sending = false;
let initialized = false;

export function track(eventType: EventType, featureTarget?: FeatureTarget): void {
  if (typeof window === "undefined") return;
  if (isLoginPath(window.location.pathname)) return;
  init();

  const event: QueuedEvent = {
    eventType,
    clientTs: new Date().toISOString(),
    sessionId: getSessionId(),
  };
  if (featureTarget !== undefined) event.featureTarget = featureTarget;
  queue.push(event);
  if (queue.length > MAX_QUEUE) queue.splice(0, queue.length - MAX_QUEUE);

  if (queue.length >= FLUSH_SIZE) {
    void flush();
  } else if (timer === undefined && retryTimer === undefined) {
    timer = setTimeout(() => void flush(), FLUSH_INTERVAL_MS);
  }
}

function isLoginPath(path: string): boolean {
  return path === "/login" || path.startsWith("/login/");
}

function init(): void {
  if (initialized) return;
  initialized = true;
  queue = [...readStored(), ...queue];
  clearStored();
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pagehide", flushWithBeacon);
  if (queue.length > 0) timer = setTimeout(() => void flush(), FLUSH_INTERVAL_MS);
}

function onVisibilityChange(): void {
  if (document.visibilityState === "hidden") flushWithBeacon();
}

function clearTimers(): void {
  if (timer !== undefined) clearTimeout(timer);
  if (retryTimer !== undefined) clearTimeout(retryTimer);
  timer = undefined;
  retryTimer = undefined;
}

async function flush(): Promise<void> {
  if (sending) return;
  clearTimers();
  if (queue.length === 0) return;

  sending = true;
  const batch = queue.slice(0, MAX_BATCH);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: batch }),
      credentials: "same-origin",
      keepalive: true,
    });
    if (res.ok || isPermanentFailure(res.status)) {
      // Accepted, or rejected for good (retrying an invalid or unauthenticated batch is pointless).
      queue.splice(0, batch.length);
      failures = 0;
    } else {
      failures++;
    }
  } catch {
    failures++;
  } finally {
    sending = false;
  }

  persist(); // keeps localStorage in step with the queue (clears it once drained)
  if (failures > 0) {
    retryTimer = setTimeout(() => void flush(), backoffDelay(failures));
  } else if (queue.length > 0) {
    void flush();
  }
}

function isPermanentFailure(status: number): boolean {
  return status >= 400 && status < 500 && status !== 408 && status !== 429;
}

export function backoffDelay(attempt: number): number {
  return Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** (attempt - 1));
}

/** Page is going away: hand everything to the browser, or keep it for next load. */
function flushWithBeacon(): void {
  if (queue.length === 0) return;
  clearTimers();
  // A fetch may be in flight with the head of the queue; it is kept alive by
  // the browser, so only the events after it would be new. Simplest safe rule:
  // while sending, persist instead of beaconing, to avoid duplicates.
  if (sending) {
    persist();
    return;
  }
  while (queue.length > 0) {
    const batch = queue.slice(0, MAX_BATCH);
    const blob = new Blob([JSON.stringify({ events: batch })], { type: "application/json" });
    let ok = false;
    try {
      ok = typeof navigator.sendBeacon === "function" && navigator.sendBeacon(ENDPOINT, blob);
    } catch {
      ok = false;
    }
    if (!ok) {
      persist();
      return;
    }
    queue.splice(0, batch.length);
  }
  clearStored();
}

function persist(): void {
  try {
    if (queue.length === 0) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // storage unavailable or full: events stay in memory only
  }
}

function clearStored(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function readStored(): QueuedEvent[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as QueuedEvent[]) : [];
  } catch {
    return [];
  }
}

/** Test hook: forget all module state and listeners. */
export function __resetTrackingForTests(): void {
  clearTimers();
  if (typeof document !== "undefined") {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pagehide", flushWithBeacon);
  }
  queue = [];
  failures = 0;
  sending = false;
  initialized = false;
}
