import type { Metadata } from "next";
import { getUiStringsServer } from "@/services/uiStrings";
import { getSettingsServer } from "@/services/settings";
import { listVehiclesServer } from "@/services/vehicles";
import { createT } from "@/lib/i18n/t";
import { buildMetadata } from "@/lib/seo";
import { ConcessionBadge, Container } from "@/components/shared";
import {
  Credentials,
  ServiceAreaMap,
  StorySection,
  ValuesSection,
} from "@/components/features/about";
import { FleetPreview } from "@/components/features/home";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const stringsRes = await getUiStringsServer("en");
  const t = createT(stringsRes.strings, "en");
  return buildMetadata({
    title: t("about.page.title"),
    description: t("about.page.subhead"),
    path: "/en/about",
    locale: "en",
  });
}

export default async function AboutPageEn() {
  const [stringsRes, settings, vehicles] = await Promise.all([
    getUiStringsServer("en"),
    getSettingsServer("en"),
    listVehiclesServer("en"),
  ]);
  const t = createT(stringsRes.strings, "en");

  return (
    <>
      <section className="bg-cream">
        <Container className="pt-10 pb-6 md:pt-14 md:pb-8">
          <header className="max-w-3xl">
            <h1 className="font-serif text-section md:text-hero">{t("about.page.title")}</h1>
            <p className="mt-3 text-body-lg text-mute">{t("about.page.subhead")}</p>
            <div className="mt-6">
              <ConcessionBadge settings={settings} tone="light" />
            </div>
          </header>
        </Container>
      </section>
      <StorySection t={t} settings={settings} />
      <ValuesSection t={t} locale="en" />
      <FleetPreview t={t} vehicles={vehicles} />
      <Credentials t={t} settings={settings} locale="en" />
      <ServiceAreaMap settings={settings} />
    </>
  );
}
