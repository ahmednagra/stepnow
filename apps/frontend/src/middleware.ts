// src/middleware.ts

import { NextResponse, type NextRequest } from "next/server";
import {
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME,
  isLocale,
} from "@/lib/i18n/config";
import { ROUTE_MAP, REVERSE_ROUTE_MAP } from "@/lib/i18n/routes";

function isEnglishPath(path: string): boolean {
  return path === "/en" || path.startsWith("/en/");
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
  // through to NextResponse.next() so the page renders in the URL's
  // locale.
  if (isLocale(cookieValue)) {
    if (cookieValue === "en" && !englishPath) {
      const target = deToEnStaticOnly(path);
      if (!target) return NextResponse.next();
      const url = request.nextUrl.clone();
      url.pathname = target;
      return NextResponse.redirect(url);
    }
    if (cookieValue === "de" && englishPath) {
      const target = enToDeStaticOnly(path);
      if (!target) return NextResponse.next();
      const url = request.nextUrl.clone();
      url.pathname = target;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // First-visit (no cookie yet): detect from Accept-Language, set the
  // cookie, and optionally redirect to the EN home for non-German users
  // landing on the DE root. Same static-only constraint applies.
  const acceptLang = (request.headers.get("accept-language") || "").toLowerCase();
  const prefersGerman = acceptLang.startsWith("de");

  let response: NextResponse;
  if (!prefersGerman && !englishPath) {
    const target = deToEnStaticOnly(path);
    response = target
      ? NextResponse.redirect(new URL(target, request.url))
      : NextResponse.next();
  } else {
    response = NextResponse.next();
  }

  const detectedLocale = englishPath || !prefersGerman ? "en" : "de";
  response.cookies.set(LOCALE_COOKIE_NAME, detectedLocale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images|api).*)"],
};