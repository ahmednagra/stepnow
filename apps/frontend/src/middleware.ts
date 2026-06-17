// src/middleware.ts

import { NextResponse, type NextRequest } from "next/server";
import {
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME,
  isLocale,
} from "@/lib/i18n/config";
import { ROUTE_MAP, REVERSE_ROUTE_MAP } from "@/lib/i18n/routes";

/**
 * Build an absolute URL for a redirect using the PUBLIC origin as seen by
 * the browser, not the internal proxy origin (localhost:3000). nginx sends
 * X-Forwarded-Host / X-Forwarded-Proto; fall back to the Host header.
 */
function publicUrl(path: string, request: NextRequest): URL {
  const proto =
    request.headers.get("x-forwarded-proto") ??
    request.nextUrl.protocol.replace(":", "");
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    request.nextUrl.host;
  return new URL(path, `${proto}://${host}`);
}

function isEnglishPath(path: string): boolean {
  return path === "/en" || path.startsWith("/en/");
}

/**
 * Pass the request through while exposing the current path+query to server
 * components via the `x-pathname` request header. The authed admin layout reads
 * this to build `?next=` so a bookmarked deep link (e.g. /admin/orders/new)
 * survives the login redirect. Request headers are the reliable channel for
 * middleware → RSC data in the App Router.
 */
function passThrough(request: NextRequest): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

/**
 * Return the EN equivalent of a DE path ONLY when it's a known static
 * route (home, /preise, /kontakt, etc). For dynamic slug routes the
 * middleware has no way to translate the slug, so it returns null and
 * the caller passes through.
 */
function deToEnStaticOnly(path: string): string | null {
  return ROUTE_MAP[path] ?? null;
}

/**
 * Mirror of the above, EN → DE for static routes only.
 */
function enToDeStaticOnly(path: string): string | null {
  if (REVERSE_ROUTE_MAP[path]) return REVERSE_ROUTE_MAP[path];
  // /en (home) is a special case: it doesn't appear in REVERSE_ROUTE_MAP
  // as a key because ROUTE_MAP["/"]="/en" reverses to REVERSE_ROUTE_MAP["/en"]="/"
  // which IS covered above. No extra branch needed.
  return null;
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const englishPath = isEnglishPath(path);
  const cookieValue = request.cookies.get(LOCALE_COOKIE_NAME)?.value;

  // Cookie-driven redirect: only for paths that have a known mirror in
  // the other locale's static route table. Dynamic slug routes fall
  // through to passThrough(request) so the page renders in the URL's
  // locale.
  if (isLocale(cookieValue)) {
    if (cookieValue === "en" && !englishPath) {
      const target = deToEnStaticOnly(path);
      if (!target) return passThrough(request);
      return NextResponse.redirect(publicUrl(target, request));
    }
    if (cookieValue === "de" && englishPath) {
      const target = enToDeStaticOnly(path);
      if (!target) return passThrough(request);
      return NextResponse.redirect(publicUrl(target, request));
    }
    return passThrough(request);
  }

  // First visit (no cookie yet): German is the default locale. Respect an
  // explicit /en/* URL, otherwise serve the German site. We intentionally do
  // NOT auto-switch to English based on Accept-Language — DE is the default.
  const response = passThrough(request);
  response.cookies.set(LOCALE_COOKIE_NAME, englishPath ? "en" : "de", {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images|api).*)"],
};
