/**
 * Optimistic auth redirects (Next.js 16 "proxy", formerly middleware.ts).
 *
 * Only checks that the `sid` cookie exists; the real session check happens in
 * the Go API and in server components that call /api/me.
 *
 * - no cookie on an app route → /login
 * - cookie on /login          → /setup/1 (unless /login?error=…, e.g. a stale
 *                                cookie sent to LOGIN_EXPIRED_PATH)
 */
import { NextResponse, type NextRequest } from "next/server";
import { AFTER_LOGIN_PATH, LOGIN_PATH, PUBLIC_PATHS, SESSION_COOKIE } from "@/components/auth/constants";

const isPublic = (pathname: string) => PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === LOGIN_PATH) {
    if (hasSession && !searchParams.has("error")) return redirectTo(req, AFTER_LOGIN_PATH);
    return NextResponse.next();
  }
  if (!hasSession && !isPublic(pathname)) return redirectTo(req, LOGIN_PATH);
  return NextResponse.next();
}

function redirectTo(req: NextRequest, pathname: string) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Skip /api/*, Next internals and any file with an extension (static assets).
  matcher: ["/((?!api/|_next/|.*\\.[^/]+$).*)"],
};
