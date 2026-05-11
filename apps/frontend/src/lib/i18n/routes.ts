// src/lib/i18n/routes.ts
// Static DE↔EN route mapping. Dynamic routes (service detail pages) pass a
// per-page slug map at render time.

export const ROUTE_MAP: Record<string, string> = {
  "/": "/en",
  "/dienstleistungen": "/en/services",
  "/preise": "/en/pricing",
  "/ueber-uns": "/en/about",
  "/kontakt": "/en/contact",
  "/buchen": "/en/book",
  "/buchen/bestaetigung": "/en/book/confirmation",
  "/impressum": "/en/legal-notice",
  "/datenschutz": "/en/privacy",
  "/agb": "/en/terms",
};

export const REVERSE_ROUTE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(ROUTE_MAP).map(([de, en]) => [en, de]),
);

/**
 * Given a current path, return the equivalent path in the other locale.
 * If a dynamic slug map is provided (e.g., service detail pages), it wins.
 */
export function getAlternateUrl(
  currentPath: string,
  dynamicSlugMap?: Record<string, string>,
): string {
  if (dynamicSlugMap?.[currentPath]) return dynamicSlugMap[currentPath];
  if (ROUTE_MAP[currentPath]) return ROUTE_MAP[currentPath];
  if (REVERSE_ROUTE_MAP[currentPath]) return REVERSE_ROUTE_MAP[currentPath];

  // Fallback: toggle the /en prefix
  if (currentPath === "/en" || currentPath.startsWith("/en/")) {
    const stripped = currentPath === "/en" ? "/" : currentPath.replace(/^\/en/, "");
    return stripped || "/";
  }
  return currentPath === "/" ? "/en" : `/en${currentPath}`;
}
