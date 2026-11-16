/** Auth constants shared by proxy.ts and server code. */

/** Server-side session cookie set by the Go API (HttpOnly). */
export const SESSION_COOKIE = "sid";

export const LOGIN_PATH = "/login";
export const AFTER_LOGIN_PATH = "/setup/1";

/**
 * Where to send a user whose `sid` cookie no longer maps to a session.
 * proxy.ts lets /login through when it carries an `error` param, even with a
 * (stale) cookie, so this can't loop back to /setup/1.
 */
export const LOGIN_EXPIRED_PATH = `${LOGIN_PATH}?error=expired`;

/** Pages reachable without a session (besides /api/* and static assets). */
export const PUBLIC_PATHS = [LOGIN_PATH, "/terms", "/privacy"] as const;
