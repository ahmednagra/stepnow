// apps/frontend/src/app/(public)/ueber-uns/page.tsx
// Phase 3d polish — German About page.
// Adds eyebrow + concession-line to the header; the story + values + credentials
// sections are polished individually in their feature components.

import type { Metadata } from "next";
import { getUiStringsServer } from "@/services/uiStrings";
import { getSettingsServer } from "@/services/settings";
import { listVehiclesServer } from "@/services/vehicles";
import { createT } from "@/lib/i18n/t";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumb, ConcessionBadge, Container } from "@/components/shared";
import {
  Credentials,
  ServiceAreaMap,
  StorySection,
  ValuesSection,
} from "@/components/features/about";
import { FleetPreview } from "@/components/features/home";
import { pickT } from "@/lib/i18n/pick";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const stringsRes = await getUiStringsServer("de");
  const t = createT(stringsRes.strings, "de");
  return buildMetadata({
    title: t("about.page.title"),
    description: t("about.page.subhead"),
    path: "/ueber-uns",
    locale: "de",
  });
}

export default async function AboutPageDe() {
  const [stringsRes, settings, vehicles] = await Promise.all([
    getUiStringsServer("de"),
    getSettingsServer("de"),
    listVehiclesServer("de"),
  ]);
  const t = createT(stringsRes.strings, "de");

  return (
    <>
      <section className="bg-cream">
        <Container className="pt-12 pb-6 md:pt-16">
          <Breadcrumb
            crumbs={[
              { name: t("nav.home"), href: "/" },
              { name: t("about.page.title"), href: "/ueber-uns" },
            ]}
          />
          <header className="mt-8 max-w-3xl">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="block h-px w-10 bg-gold" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
                {pickT(t, "about.page.eyebrow", "Über uns")}
              </p>
            </div>
            <h1 className="mt-4 font-serif text-section md:text-hero">
              {t("about.page.title")}
            </h1>
            <p className="mt-4 text-body-lg text-mute">{t("about.page.subhead")}</p>
            <div className="mt-8">
              <ConcessionBadge settings={settings} tone="light" />
            </div>
          </header>
        </Container>
      </section>

      <StorySection t={t} settings={settings} />
      <ValuesSection t={t} locale="de" />
      <FleetPreview t={t} vehicles={vehicles} />
      <Credentials t={t} settings={settings} locale="de" />
      <ServiceAreaMap settings={settings} />
    </>
  );
}
