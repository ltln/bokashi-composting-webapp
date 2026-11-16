/**
 * Server-side session helpers (server components / route handlers only).
 *
 *   const me = await getMe();        // null when anonymous or the session is dead
 *   if (!me?.isAdmin) notFound();
 *
 * Calls the Go API directly at API_INTERNAL_URL, forwarding the `sid` cookie.
 * The browser-side equivalent is `api<Me>("/me")` from "@/lib/api".
 */
import { cookies } from "next/headers";
import type { components } from "@bokashi/contracts/openapi";
import { SESSION_COOKIE } from "./constants";

export type Me = components["schemas"]["Me"];

/** Returns the current user, or null (no cookie, expired session, API down). */
export async function getMe(): Promise<Me | null> {
  const base = process.env.API_INTERNAL_URL?.replace(/\/+$/, "");
  const sid = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!base || !sid) return null;
  try {
    const res = await fetch(`${base}/api/me`, {
      headers: { cookie: `${SESSION_COOKIE}=${sid}`, accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as Me;
  } catch {
    return null;
  }
}
