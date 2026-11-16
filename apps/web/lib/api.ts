/**
 * Minimal fetch wrapper for browser code: same-origin `/api`, cookies included.
 * The Next route handler at app/api/[...path] proxies these to the Go API.
 *
 *   const me = await api<Me>("/me");
 *   await api("/events", { method: "POST", json: batch });
 *
 * Server components can't use relative URLs; M1 adds a server-side helper.
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`API ${status}`);
    this.name = "ApiError";
  }
}

export interface ApiInit extends Omit<RequestInit, "body"> {
  /** Serialised as JSON with the matching Content-Type. */
  json?: unknown;
  body?: BodyInit | null;
}

/** Calls `/api${path}` and returns the parsed JSON (or undefined for 204). */
export async function api<T = unknown>(path: string, init: ApiInit = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const h = new Headers(headers);
  if (json !== undefined) h.set("Content-Type", "application/json");
  if (!h.has("Accept")) h.set("Accept", "application/json");

  const res = await fetch(`/api${path.startsWith("/") ? path : `/${path}`}`, {
    credentials: "include",
    ...rest,
    headers: h,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  const isJson = res.headers.get("Content-Type")?.includes("application/json") ?? false;
  const data: unknown = res.status === 204 ? undefined : isJson ? await res.json() : await res.text();
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}
