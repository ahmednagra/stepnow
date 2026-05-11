// src/app/en/page.tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getUiStringsServer } from "@/services/uiStrings";
import { listServicesServer } from "@/services/services";
import { getSettingsServer } from "@/services/settings";
import { createT } from "@/lib/i18n/t";
import { Container } from "@/components/shared";
import { Button } from "@/components/ui";

export const revalidate = 300;

export default async function HomePageEn() {
  const [stringsRes, services, settings] = await Promise.all([
    getUiStringsServer("en"),
    listServicesServer("en"),
    getSettingsServer("en"),
  ]);
  const t = createT(stringsRes.strings, "en");

  return (
    <>
      <section className="bg-ink text-cream">
        <Container className="flex flex-col items-start gap-6 py-section md:py-32">
          <p className="label-eyebrow !text-gold">{t("home.hero.pre_heading")}</p>
          <h1 className="max-w-3xl font-serif text-section md:text-hero">
            {t("home.hero.headline")}
          </h1>
          <p className="max-w-2xl text-body-lg text-cream/80">{t("home.hero.subhead")}</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/en/book">
              <Button size="lg">{t("home.hero.cta_book")}</Button>
            </Link>
            <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}>
              <Button size="lg" variant="outline" className="border-cream text-cream hover:bg-cream hover:text-ink">
                {settings.phone}
              </Button>
            </a>
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-section">
          <header className="mb-12 max-w-3xl">
            <h2 className="font-serif text-section">{t("home.services.heading")}</h2>
            <p className="mt-3 text-body-lg text-mute">{t("home.services.subheading")}</p>
          </header>
          <div className="grid gap-6 md:grid-cols-2">
            {services.map((s) => (
              <Link
                key={s.id}
                href={`/en/services/${s.slug}`}
                className="group flex flex-col gap-3 border border-line bg-cream p-6 transition-colors duration-base hover:border-ink"
              >
                <h3 className="font-serif text-sub">{s.title}</h3>
                <p className="text-mute">{s.short_description}</p>
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-gold-dark group-hover:text-ink">
                  {t("services.card.learn_more")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-ink text-cream">
        <Container className="py-section text-center">
          <h2 className="mx-auto max-w-2xl font-serif text-section">
            {t("home.final_cta.heading")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-body-lg text-cream/80">
            {t("home.final_cta.subhead")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/en/book">
              <Button size="lg">{t("home.hero.cta_book")}</Button>
            </Link>
            <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}>
              <Button size="lg" variant="outline" className="border-cream text-cream hover:bg-cream hover:text-ink">
                {settings.phone}
              </Button>
            </a>
          </div>
          {settings.concession_number && (
            <p className="mt-12 text-xs text-cream/50">
              {settings.business_name} · {t("home.trust.licensed")} · {settings.concession_number}
            </p>
          )}
        </Container>
      </section>
    </>
  );
}
