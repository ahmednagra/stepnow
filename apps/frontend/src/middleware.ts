// src/middleware.ts
// Detects locale from cookie or Accept-Language and redirects the user.
// Skips API routes, static files, and Next.js internals.

import { NextResponse, type NextRequest } from "next/server";
import {
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME,
  isLocale,
} from "@/lib/i18n/config";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isEnglishPath = path === "/en" || path.startsWith("/en/");
  const cookieValue = request.cookies.get(LOCALE_COOKIE_NAME)?.value;

  // Cookie wins absolutely once it exists
  if (isLocale(cookieValue)) {
    if (cookieValue === "en" && !isEnglishPath) {
      const url = request.nextUrl.clone();
      url.pathname = `/en${path === "/" ? "" : path}`;
      return NextResponse.redirect(url);
    }
    if (cookieValue === "de" && isEnglishPath) {
      const url = request.nextUrl.clone();
      url.pathname = path === "/en" ? "/" : path.replace(/^\/en/, "");
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // First visit: detect from Accept-Language header
  const acceptLang = (request.headers.get("accept-language") || "").toLowerCase();
  const prefersGerman = acceptLang.startsWith("de");
  const response = !prefersGerman && !isEnglishPath
    ? NextResponse.redirect(new URL(`/en${path === "/" ? "" : path}`, request.url))
    : NextResponse.next();

  // Persist detected locale so the next request skips this branch
  const detectedLocale = isEnglishPath || !prefersGerman ? "en" : "de";
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
