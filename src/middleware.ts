import { NextResponse, type NextRequest } from "next/server";

/**
 * 1) Per-request nonce-based Content Security Policy: only scripts carrying this
 *    request's nonce (Next.js adds it to its own scripts) can run — no 'unsafe-inline'.
 * 2) Edge gate: cheap cookie-presence check to bounce anonymous users to sign-in.
 *    Real authentication/authorization happens server-side on every request
 *    (requireUser / requireTenant / requirePermission) — this is defense in depth only.
 */
const PUBLIC = [/^\/$/, /^\/login(\/.*)?$/, /^\/register(\/.*)?$/, /^\/forgot-password$/, /^\/reset-password$/, /^\/verify(\/.*)?$/, /^\/forbidden$/];
const COOKIES = ["__Host-chta_session", "chta_session"];

export function buildCsp(nonce: string, dev = process.env.NODE_ENV !== "production", https = false) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' https: blob:",
    "frame-src https://www.youtube-nocookie.com https://player.vimeo.com",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    ...(https ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  if (!isApi && !PUBLIC.some((r) => r.test(pathname)) && !COOKIES.some((c) => req.cookies.has(c))) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  if (isApi) return NextResponse.next();
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce, undefined, req.nextUrl.protocol === "https:");
  const headers = new Headers(req.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  // Scheduled jobs, webhooks and the key-authenticated API carry no session cookie.
  matcher: [{ source: "/((?!_next/static|_next/image|favicon.ico|api/health|api/cron/|api/webhooks/|api/v1/).*)", missing: [{ type: "header", key: "next-router-prefetch" }] }],
};
