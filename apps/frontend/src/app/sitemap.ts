// src/app/sitemap.ts
// Dynamic sitemap. Includes the canonical DE/EN entry pairs and one entry per
// service slug (DE + EN). Static legal page URLs included too. hreflang alternates
// use the same codes as buildMetadata (lib/seo.ts): de-DE, en-GB, x-default → DE.

import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/config/site";
import { listServicesServer } from "@/services/services";

const STATIC_PATHS = [
  { de: "/", en: "/en", changeFrequency: "weekly" as const, priority: 1.0 },
  {
    de: "/dienstleistungen",
    en: "/en/services",
    changeFrequency: "monthly" as const,
    priority: 0.9,
  },
  { de: "/preise", en: "/en/pricing", changeFrequency: "monthly" as const, priority: 0.8 },
  { de: "/ueber-uns", en: "/en/about", changeFrequency: "monthly" as const, priority: 0.7 },
  { de: "/kontakt", en: "/en/contact", changeFrequency: "monthly" as const, priority: 0.7 },
  { de: "/faq", en: "/en/faq", changeFrequency: "monthly" as const, priority: 0.6 },
  { de: "/buchen", en: "/en/book", changeFrequency: "monthly" as const, priority: 0.9 },
  {
    de: "/impressum",
    en: "/en/legal-notice",
    changeFrequency: "yearly" as const,
    priority: 0.3,
  },
  {
    de: "/datenschutz",
    en: "/en/privacy",
    changeFrequency: "yearly" as const,
    priority: 0.3,
  },
  { de: "/agb", en: "/en/terms", changeFrequency: "yearly" as const, priority: 0.3 },
];

function alternates(dePath: string, enPath: string) {
  return {
    languages: {
      "de-DE": `${SITE_CONFIG.url}${dePath}`,
      "en-GB": `${SITE_CONFIG.url}${enPath}`,
      "x-default": `${SITE_CONFIG.url}${dePath}`,
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  for (const path of STATIC_PATHS) {
    entries.push({
      url: `${SITE_CONFIG.url}${path.de}`,
      lastModified: now,
      changeFrequency: path.changeFrequency,
      priority: path.priority,
      alternates: alternates(path.de, path.en),
    });
    entries.push({
      url: `${SITE_CONFIG.url}${path.en}`,
      lastModified: now,
      changeFrequency: path.changeFrequency,
      priority: path.priority,
      alternates: alternates(path.de, path.en),
    });
  }

  // Service detail pages — best-effort. If backend unreachable at build time,
  // skip them gracefully rather than failing the entire sitemap.
  try {
    const servicesDe = await listServicesServer("de");
    const servicesEn = await listServicesServer("en");
    const byIdEn = new Map(servicesEn.map((s) => [s.id, s.slug]));

    for (const svc of servicesDe) {
      const enSlug = byIdEn.get(svc.id) ?? svc.slug;
      const dePath = `/dienstleistungen/${svc.slug}`;
      const enPath = `/en/services/${enSlug}`;
      entries.push({
        url: `${SITE_CONFIG.url}${dePath}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: alternates(dePath, enPath),
      });
      entries.push({
        url: `${SITE_CONFIG.url}${enPath}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: alternates(dePath, enPath),
      });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[sitemap] Could not fetch services for sitemap:", err);
  }

  return entries;
}
