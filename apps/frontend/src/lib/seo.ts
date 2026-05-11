// src/lib/seo.ts
// Centralized SEO helpers — Metadata and JSON-LD structured data builders.
// Per docs/architecture/frontend.md §12.

import type { Metadata } from "next";
import { SITE_CONFIG } from "@/config/site";
import { getAlternateUrl } from "@/lib/i18n/routes";
import type { FaqPublic, Locale, ServicePublic, SettingsPublic } from "@/types";

interface BuildMetadataInput {
  title: string;
  description: string;
  /** Path of the current page (e.g. "/dienstleistungen"). */
  path: string;
  locale: Locale;
  /** Optional override for the alternate-locale path (for dynamic routes). */
  alternatePath?: string;
  ogImage?: string;
  /** Mark a page as noindex (e.g., booking confirmations). Default false. */
  noindex?: boolean;
}

/** Build Next.js Metadata with proper hreflang alternates and OG tags. */
export function buildMetadata({
  title,
  description,
  path,
  locale,
  alternatePath,
  ogImage,
  noindex = false,
}: BuildMetadataInput): Metadata {
  const siteUrl = SITE_CONFIG.url;
  const canonical = `${siteUrl}${path}`;
  const altPath = alternatePath ?? getAlternateUrl(path);
  const alternateUrl = `${siteUrl}${altPath}`;
  const image = ogImage ?? `${siteUrl}${SITE_CONFIG.ogImageDefault}`;

  // hreflang alternates: each locale + x-default pointing to DE
  const languages: Record<string, string> = {};
  if (locale === "de") {
    languages["de-DE"] = canonical;
    languages["en-GB"] = alternateUrl;
    languages["x-default"] = canonical;
  } else {
    languages["en-GB"] = canonical;
    languages["de-DE"] = alternateUrl;
    languages["x-default"] = alternateUrl;
  }

  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      locale: locale === "de" ? "de_DE" : "en_GB",
      siteName: "StepNow Rides & Movers",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: noindex ? { index: false, follow: false } : undefined,
  };
}

// --- JSON-LD builders -------------------------------------------------------

/** LocalBusiness schema for the homepage + contact page. */
export function buildLocalBusinessJsonLd(settings: SettingsPublic): Record<string, unknown> {
  // Same dev-suffix stripping as the visible header/footer — see Header.tsx.
  const businessName = settings.business_name.replace(/\s*\(Dev\)\s*$/i, "").trim();
  return {
    "@context": "https://schema.org",
    "@type": "TaxiService",
    name: businessName,
    description:
      "Vorbestellte Mietwagen-Fahrten in der Region Stuttgart, Esslingen und Deizisau. Konzessioniert nach § 49 PBefG.",
    url: SITE_CONFIG.url,
    telephone: settings.phone,
    email: settings.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address_street,
      postalCode: settings.address_postcode,
      addressLocality: settings.address_city,
      addressCountry: settings.address_country || "DE",
    },
    areaServed: [
      { "@type": "City", name: "Stuttgart" },
      { "@type": "City", name: "Esslingen" },
      { "@type": "City", name: "Deizisau" },
      { "@type": "City", name: "Plochingen" },
    ],
    priceRange: "€€",
    sameAs: [settings.social_facebook, settings.social_instagram].filter(Boolean),
  };
}

/** Service schema for service detail pages (Phase 3b). */
export function buildServiceJsonLd(
  service: ServicePublic,
  settings: SettingsPublic,
  path: string,
): Record<string, unknown> {
  const businessName = settings.business_name.replace(/\s*\(Dev\)\s*$/i, "").trim();
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.short_description,
    serviceType: service.title,
    url: `${SITE_CONFIG.url}${path}`,
    provider: {
      "@type": "TaxiService",
      name: businessName,
      telephone: settings.phone,
      address: {
        "@type": "PostalAddress",
        streetAddress: settings.address_street,
        postalCode: settings.address_postcode,
        addressLocality: settings.address_city,
        addressCountry: settings.address_country || "DE",
      },
    },
    areaServed: {
      "@type": "GeoCircle",
      geoMidpoint: { "@type": "GeoCoordinates", latitude: 48.7758, longitude: 9.1829 },
      geoRadius: "50000",
    },
  };
}

interface BreadcrumbCrumb {
  name: string;
  href: string;
}

/** BreadcrumbList JSON-LD for any non-homepage page. */
export function buildBreadcrumbJsonLd(crumbs: BreadcrumbCrumb[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, idx) => {
      const raw =
        (crumb as { href?: string; url?: string }).href ??
        (crumb as { href?: string; url?: string }).url ??
        "/";
      return {
        "@type": "ListItem",
        position: idx + 1,
        name: crumb.name,
        item: raw.startsWith("http") ? raw : `${SITE_CONFIG.url}${raw}`,
      };
    }),
  };
}

/** FAQPage JSON-LD for pages with FAQ content. */
export function buildFaqPageJsonLd(faqs: FaqPublic[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: stripMarkdown(faq.answer),
      },
    })),
  };
}

/** Crude markdown stripper for FAQ answers in JSON-LD (HTML in JSON-LD is allowed but cleaner without). */
function stripMarkdown(md: string): string {
  return md
    .replace(/[#*_`>]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n+/g, " ")
    .trim();
}
