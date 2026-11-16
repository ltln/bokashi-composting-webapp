/**
 * Runtime proxy: /api/* → ${API_INTERNAL_URL}/api/*.
 *
 * API_INTERNAL_URL is read on every request (not baked in at build time), so
 * one web image runs in every environment. The browser only ever talks to the
 * web origin: cookies stay first-party and no CORS is needed.
 *
 * Forwards method, headers, body and query; passes back status, headers, every
 * Set-Cookie and redirects (Location is not followed).
 */
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// RFC 9110 §7.6.1 hop-by-hop headers, plus ones fetch() sets itself.
const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "proxy-connection",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

async function proxy(req: NextRequest): Promise<Response> {
  const base = process.env.API_INTERNAL_URL?.replace(/\/+$/, "");
  if (!base) {
    return Response.json({ error: "API_INTERNAL_URL is not set" }, { status: 502 });
  }
  // pathname already starts with /api; keep it so Go routes match openapi.yaml.
  const target = `${base}${req.nextUrl.pathname}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });
  headers.set("x-forwarded-host", req.headers.get("host") ?? req.nextUrl.host);
  headers.set("x-forwarded-proto", req.nextUrl.protocol.replace(/:$/, ""));

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
      redirect: "manual",
      cache: "no-store",
      // Required by Node's fetch when streaming a request body.
      ...(hasBody ? { duplex: "half" } : {}),
    } as RequestInit);
  } catch {
    return Response.json({ error: "upstream unavailable" }, { status: 502 });
  }

  const out = new Headers();
  upstream.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    // fetch() already decoded the body, so drop encoding/length; cookies are copied below.
    if (HOP_BY_HOP.has(k) || k === "content-encoding" || k === "set-cookie") return;
    out.set(key, value);
  });
  for (const cookie of upstream.headers.getSetCookie()) out.append("set-cookie", cookie);

  // Rewrite redirects that point at the internal API origin back to ours.
  const location = upstream.headers.get("location");
  if (location?.startsWith(base)) out.set("location", location.slice(base.length) || "/");

  const noBody = req.method === "HEAD" || [101, 204, 205, 304].includes(upstream.status);
  return new Response(noBody ? null : upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: out,
  });
}

export const GET = proxy;
export const HEAD = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
