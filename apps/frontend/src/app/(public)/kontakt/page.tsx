import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getUiStringsServer } from "@/services/uiStrings";
import { getSettingsServer } from "@/services/settings";
import { listFaqsServer } from "@/services/faqs";
import { createT } from "@/lib/i18n/t";
import { buildLocalBusinessJsonLd, buildFaqPageJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/utils/json-ld";
import { Container } from "@/components/shared";
import {
  ContactForm,
  ContactMap,
  ContactMethods,
  ContactFaqGrid,
} from "@/components/features/contact";
import { pickT } from "@/lib/i18n/pick";

const CONTACT_IMAGE =
  "/others/contact.avif";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const stringsRes = await getUiStringsServer("de");
  const t = createT(stringsRes.strings, "de");
  return buildMetadata({
    title: t("contact.page.title"),
    description: t("contact.page.subhead"),
    path: "/kontakt",
    locale: "de",
  });
}

export default async function ContactPageDe() {
  const [stringsRes, settings, faqs] = await Promise.all([
    getUiStringsServer("de"),
    getSettingsServer("de"),
    listFaqsServer("de"),
  ]);
  const t = createT(stringsRes.strings, "de");
  const topFaqs = faqs.slice(0, 4);

  return (
    <>
      <section className="relative overflow-hidden border-t border-[color:var(--color-border-soft)] bg-[var(--color-text-primary)]">
        <div className="absolute inset-0">
          <Image
            src={CONTACT_IMAGE}
            alt="Professional customer contact"
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
              <li className="text-[var(--color-text-on-strong)]">
                {t("contact.page.title")}
              </li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-secondary)]">
              {pickT(t, "contact.page.eyebrow", "Kontakt")}
            </p>
            <h1 className="mt-3 font-serif text-[42px] leading-[0.98] tracking-tight text-[var(--color-text-on-strong)] md:text-[60px]">
              {t("contact.page.title")}
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[rgba(247,244,234,0.84)] md:text-[16px]">
              {t("contact.page.subhead")}
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-[var(--color-bg-page)]">
        <Container className="py-section">
          <div className="mb-7 flex flex-col items-start gap-5 md:mb-9 md:flex-row md:items-end md:justify-between md:gap-12">
            <div className="max-w-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-primary)]">
                {pickT(t, "contact.form.eyebrow", "Anfrage")}
              </p>
              <h2 className="mt-2 font-serif text-[34px] leading-[1.05] tracking-tight text-[var(--color-text-primary)] md:text-[42px]">
                {t("contact.form.heading")}
              </h2>
            </div>
            <p className="max-w-sm text-[13.5px] leading-relaxed text-[var(--color-text-secondary)] md:text-right">
              {pickT(
                t,
                "contact.form.lead",
                "Schreiben Sie uns Ihr Anliegen. Wir melden uns mit einer klaren Rueckmeldung waehrend unserer Servicezeiten.",
              )}
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10">
            <div className="border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] p-6 md:p-8">
              <ContactForm id="contact-form" />
            </div>

            <div className="border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] p-6 md:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-primary)]">
                {pickT(t, "contact.methods.eyebrow", "Direkt")}
              </p>
              <h2 className="mt-2 font-serif text-[26px] leading-tight tracking-tight text-[var(--color-text-primary)]">
                {t("contact.methods.heading")}
              </h2>
              <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
                {pickT(
                  t,
                  "contact.methods.lead",
                  "Telefon, E-Mail und Standort auf einen Blick. Fuer kurze Rueckfragen ist der direkte Kontakt meist der schnellste Weg.",
                )}
              </p>
              <div className="mt-6">
                <ContactMethods t={t} settings={settings} />
              </div>
            </div>
          </div>

          <div className="mt-8 border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] p-6 md:mt-10 md:p-8">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-primary)]">
                  {pickT(t, "contact.map.eyebrow", "Standort")}
                </p>
                <h2 className="mt-2 font-serif text-[24px] leading-tight tracking-tight text-[var(--color-text-primary)]">
                  {pickT(t, "contact.map.heading", "Hier finden Sie uns")}
                </h2>
              </div>
              <a
                href="#faq"
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-primary)] transition-colors duration-base hover:text-[var(--color-text-primary)]"
              >
                {pickT(t, "contact.faq.jump", "FAQ ansehen")}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
            <ContactMap settings={settings} compact />
          </div>

          {topFaqs.length > 0 && (
            <div id="faq" className="mt-12 border-t border-[color:var(--color-border-soft)] pt-10 md:mt-14 md:pt-12">
              <div className="mb-7 flex flex-col items-start gap-5 md:mb-9 md:flex-row md:items-end md:justify-between md:gap-12">
                <div className="max-w-2xl">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-primary)]">
                    {pickT(t, "contact.faq.eyebrow", "Haeufige Fragen")}
                  </p>
                  <h2 className="mt-2 font-serif text-[34px] leading-[1.05] tracking-tight text-[var(--color-text-primary)] md:text-[42px]">
                    {pickT(t, "home.faqs.heading", "Antworten auf einen Blick")}
                  </h2>
                </div>
                <p className="max-w-sm text-[13.5px] leading-relaxed text-[var(--color-text-secondary)] md:text-right">
                  {pickT(
                    t,
                    "contact.faq.lead",
                    "Die wichtigsten Antworten fuer Organisation, Ablauf und Erreichbarkeit auf einen Blick.",
                  )}
                </p>
              </div>
              <ContactFaqGrid faqs={topFaqs} />
            </div>
          )}
        </Container>
      </section>

      <JsonLd data={buildLocalBusinessJsonLd(settings)} />
      {topFaqs.length > 0 && <JsonLd data={buildFaqPageJsonLd(topFaqs)} />}
    </>
  );
}
