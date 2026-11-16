/**
 * Anonymous tracking session id: a random UUID kept in sessionStorage, so it
 * is per tab, survives reloads and resets when the browser session ends. It is
 * never linked to the Google account on the client.
 */

const SESSION_KEY = "bokashi:session-id";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Fallback when storage is unavailable (private mode, blocked site data). */
let memoryId: string | undefined;

/** Returns a v4 UUID; uses getRandomValues where randomUUID is missing (plain http on a LAN). */
export function randomUUID(): string {
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === "function") return c.randomUUID();
  const b = new Uint8Array(16);
  c.getRandomValues(b);
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** The current tab's anonymous session id. Browser only. */
export function getSessionId(): string {
  try {
    const stored = window.sessionStorage.getItem(SESSION_KEY);
    if (stored && UUID_RE.test(stored)) return stored;
    const id = memoryId ?? randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, id);
    memoryId = id;
    return id;
  } catch {
    memoryId ??= randomUUID();
    return memoryId;
  }
}
