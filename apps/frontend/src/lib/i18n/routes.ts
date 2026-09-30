// src/lib/i18n/routes.ts
// Static DE↔EN route mapping. Dynamic routes (service detail pages) pass a
// per-page slug map at render time. A route missing here (e.g. the staff-only
// /auftrag-erstellen) has no mirror in the other locale.

export const ROUTE_MAP: Record<string, string> = {
  "/": "/en",
  "/dienstleistungen": "/en/services",
  "/preise": "/en/pricing",
  "/ueber-uns": "/en/about",
  "/kontakt": "/en/contact",
  "/faq": "/en/faq",
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
 * The equivalent path in the other locale, or null when the path has no known
 * mirror. A dynamic slug map (service detail pages) wins over the static table.
 */
export function getMirrorUrl(
  currentPath: string,
  dynamicSlugMap?: Record<string, string>,
): string | null {
  return dynamicSlugMap?.[currentPath] ?? ROUTE_MAP[currentPath] ?? REVERSE_ROUTE_MAP[currentPath] ?? null;
}

/**
 * Like getMirrorUrl, but never null: an unknown path falls back to toggling the
 * /en prefix. For hreflang on pages that pass their own path (buildMetadata);
 * navigation UI must use getMirrorUrl so it never links to a missing page.
 */
export function getAlternateUrl(
  currentPath: string,
  dynamicSlugMap?: Record<string, string>,
): string {
  const mirror = getMirrorUrl(currentPath, dynamicSlugMap);
  if (mirror) return mirror;

  // Fallback: toggle the /en prefix
  if (currentPath === "/en" || currentPath.startsWith("/en/")) {
    const stripped = currentPath === "/en" ? "/" : currentPath.replace(/^\/en/, "");
    return stripped || "/";
  }
  return currentPath === "/" ? "/en" : `/en${currentPath}`;
}
