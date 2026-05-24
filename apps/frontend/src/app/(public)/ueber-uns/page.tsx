import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getUiStringsServer } from "@/services/uiStrings";
import { getSettingsServer } from "@/services/settings";
import { listVehiclesServer } from "@/services/vehicles";
import { createT } from "@/lib/i18n/t";
import { buildMetadata } from "@/lib/seo";
import { ConcessionBadge, Container } from "@/components/shared";
import { Credentials, ServiceAreaMap, StorySection, ValuesSection } from "@/components/features/about";
import { FleetPreview } from "@/components/features/home";
import { pickT } from "@/lib/i18n/pick";

const ABOUT_IMAGE =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2000&q=80";

export const revalidate = 3600;

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
      <section className="relative overflow-hidden border-t border-[color:var(--color-border-soft)] bg-[var(--color-text-primary)]">
        <div className="absolute inset-0">
          <Image
            src={ABOUT_IMAGE}
            alt="Professional chauffeur vehicle"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(24,26,23,0.84),rgba(24,26,23,0.58))]" />
        </div>
        <Container className="relative py-16 md:py-20">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(247,244,234,0.72)]">
              <li>
                <Link href="/" className="transition-colors duration-base hover:text-[var(--color-text-on-strong)]">
                  {pickT(t, "nav.home", "Startseite")}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-[var(--color-text-on-strong)]">{t("about.page.title")}</li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-secondary)]">
              {pickT(t, "about.page.eyebrow", "Ueber uns")}
            </p>
            <h1 className="mt-3 font-serif text-[42px] leading-[0.98] tracking-tight text-[var(--color-text-on-strong)] md:text-[60px]">
              {t("about.page.title")}
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[rgba(247,244,234,0.84)] md:text-[16px]">
              {t("about.page.subhead")}
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-[var(--color-bg-page)]">
        <Container className="py-section">
          <div className="grid gap-8 lg:grid-cols-[1.14fr_0.86fr] lg:gap-10">
            <div className="border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] p-6 md:p-8">
              <StorySection t={t} settings={settings} />
            </div>
            <div className="border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] p-6 md:p-8">
              <ValuesSection t={t} locale="de" />
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[0.98fr_1.02fr] lg:gap-10">
            <div className="border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] p-6 md:p-8">
              <Credentials t={t} settings={settings} locale="de" />
            </div>
            <div className="border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] p-6 md:p-8">
              <ServiceAreaMap settings={settings} />
            </div>
          </div>
        </Container>
      </section>

      <FleetPreview t={t} vehicles={vehicles} locale="de" />

      <section className="border-t border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)]">
        <Container className="flex justify-center py-8 md:py-10">
          <ConcessionBadge settings={settings} tone="light" />
        </Container>
      </section>
    </>
  );
}
