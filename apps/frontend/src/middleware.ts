// src/middleware.ts
// Detects locale from cookie or Accept-Language and redirects accordingly.
// Cross-locale redirects use ROUTE_MAP so DE-only paths (/buchen) map to
// the correct EN equivalent (/en/book), not the naive /en/buchen.

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

function deToEn(path: string): string | null {
  if (ROUTE_MAP[path]) return ROUTE_MAP[path];
  if (path.startsWith("/dienstleistungen/")) {
    return path.replace("/dienstleistungen/", "/en/services/");
  }
  if (path.startsWith("/buchen/")) {
    return ROUTE_MAP[path] ?? path.replace("/buchen/", "/en/book/");
  }
  return null;
}

function enToDe(path: string): string | null {
  if (REVERSE_ROUTE_MAP[path]) return REVERSE_ROUTE_MAP[path];
  if (path.startsWith("/en/services/")) {
    return path.replace("/en/services/", "/dienstleistungen/");
  }
  if (path.startsWith("/en/book/")) {
    return REVERSE_ROUTE_MAP[path] ?? path.replace("/en/book/", "/buchen/");
  }
  return path === "/en" ? "/" : path.replace(/^\/en/, "");
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const englishPath = isEnglishPath(path);
  const cookieValue = request.cookies.get(LOCALE_COOKIE_NAME)?.value;

  if (isLocale(cookieValue)) {
    if (cookieValue === "en" && !englishPath) {
      const target = deToEn(path);
      if (!target) return NextResponse.next();
      const url = request.nextUrl.clone();
      url.pathname = target;
      return NextResponse.redirect(url);
    }
    if (cookieValue === "de" && englishPath) {
      const target = enToDe(path);
      if (!target) return NextResponse.next();
      const url = request.nextUrl.clone();
      url.pathname = target;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const acceptLang = (request.headers.get("accept-language") || "").toLowerCase();
  const prefersGerman = acceptLang.startsWith("de");

  let response: NextResponse;
  if (!prefersGerman && !englishPath) {
    const target = deToEn(path);
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
