// src/app/(public)/dienstleistungen/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getUiStringsServer } from "@/services/uiStrings";
import {
  getServiceBySlugServer,
  listServicesServer,
} from "@/services/services";
import { getPricingForServiceServer } from "@/services/pricing";
import { getSettingsServer } from "@/services/settings";
import { ApiError } from "@/lib/api-errors";
import { createT } from "@/lib/i18n/t";
import {
  buildBreadcrumbJsonLd,
  buildMetadata,
  buildServiceJsonLd,
} from "@/lib/seo";
import { JsonLd } from "@/utils/json-ld";
import { Breadcrumb, Container, Markdown } from "@/components/shared";
import {
  PricingSnapshot,
  RelatedServices,
  ServiceDetailHeader,
} from "@/components/features/services";

export const revalidate = 300;

interface PageParams {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const services = await listServicesServer("de");
    return services.map((s) => ({ slug: s.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [stringsRes, service] = await Promise.all([
      getUiStringsServer("de"),
      getServiceBySlugServer(slug, "de"),
    ]);
    const t = createT(stringsRes.strings, "de");
    const altPath = `/en/services/${service.slug_en}`;
    return buildMetadata({
      title: service.meta_title || `${service.title} — ${t("services.page.title")}`,
      description: service.meta_description || service.short_description,
      path: `/dienstleistungen/${service.slug_de}`,
      alternatePath: altPath,
      locale: "de",
      ogImage: service.og_image_url ?? service.hero_image_url ?? undefined,
    });
  } catch {
    return { title: "—" };
  }
}

export default async function ServiceDetailDe({ params }: PageParams) {
  const { slug } = await params;
  let stringsRes;
  let service;
  let allServices;
  let settings;
  try {
    [stringsRes, service, allServices, settings] = await Promise.all([
      getUiStringsServer("de"),
      getServiceBySlugServer(slug, "de"),
      listServicesServer("de"),
      getSettingsServer("de"),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  // Pricing can be empty for some services; failing here would be wrong.
  let pricing = [] as Awaited<ReturnType<typeof getPricingForServiceServer>>;
  try {
    pricing = await getPricingForServiceServer(slug, "de");
  } catch {
    pricing = [];
  }

  const t = createT(stringsRes.strings, "de");
  const path = `/dienstleistungen/${service.slug_de}`;
  const altPath = `/en/services/${service.slug_en}`;
  const crumbs = [
    { name: t("nav.home"), href: "/" },
    { name: t("services.page.title"), href: "/dienstleistungen" },
    { name: service.title, href: path },
  ];

  return (
    <>
      <ServiceDetailHeader
        service={service}
        settings={settings}
        bookingHref="/buchen"
        t={t}
        locale="de"
      />

      {/* Breadcrumb + long description */}
      <section className="bg-cream">
        <Container className="py-section">
          <Breadcrumb crumbs={crumbs} />
          <div className="prose-base mt-10">
            <Markdown source={service.long_description} />
          </div>
        </Container>
      </section>

      <PricingSnapshot
        t={t}
        categories={pricing}
        pricingHref="/preise"
        bookingHref="/buchen"
        locale="de"
      />

      <RelatedServices t={t} current={service} others={allServices} locale="de" />

      <JsonLd data={buildServiceJsonLd(service, settings, path)} />
      <JsonLd
        data={buildBreadcrumbJsonLd(crumbs)}
      />
      {/* Cross-locale alternate link surfaced for nav helpers */}
      <link rel="alternate" hrefLang="en" href={altPath} />
    </>
  );
}
