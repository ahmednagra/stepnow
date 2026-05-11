// apps/frontend/src/app/(public)/kontakt/page.tsx
// Phase 3d polish — German contact page.
//   • Header eyebrow.
//   • Two-column polish (sidebar with contact methods + opening hours; form
//     on the right) per audit M-12.
//   • Map sits below in its own section with eyebrow.

import type { Metadata } from "next";
import { getUiStringsServer } from "@/services/uiStrings";
import { getSettingsServer } from "@/services/settings";
import { listFaqsServer } from "@/services/faqs";
import { createT } from "@/lib/i18n/t";
import { buildLocalBusinessJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/utils/json-ld";
import { Breadcrumb, Container } from "@/components/shared";
import {
  ContactForm,
  ContactMap,
  ContactMethods,
} from "@/components/features/contact";
import { FaqTeaser } from "@/components/features/home";

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

  return (
    <>
      <section className="bg-cream">
        <Container className="pt-12 pb-6 md:pt-16">
          <Breadcrumb
            crumbs={[
              { name: t("nav.home"), href: "/" },
              { name: t("contact.page.title"), href: "/kontakt" },
            ]}
          />
          <header className="mt-8 max-w-3xl">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="block h-px w-10 bg-gold" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
                {t("contact.page.eyebrow") || "Kontakt"}
              </p>
            </div>
            <h1 className="mt-4 font-serif text-section md:text-hero">
              {t("contact.page.title")}
            </h1>
            <p className="mt-4 text-body-lg text-mute">{t("contact.page.subhead")}</p>
          </header>
        </Container>
      </section>

      {/* Methods + form */}
      <section className="bg-cream">
        <Container className="grid gap-16 py-section md:grid-cols-12 md:gap-12">
          {/* Left column — methods + hours */}
          <aside className="md:col-span-5">
            <p className="label-eyebrow">{t("contact.methods.eyebrow") || "Direkt"}</p>
            <h2 className="mt-3 font-serif text-section">{t("contact.methods.heading")}</h2>
            <p className="mt-3 text-mute">{t("contact.methods.intro")}</p>
            <div className="mt-8">
              <ContactMethods t={t} settings={settings} />
            </div>
          </aside>
          {/* Right column — form */}
          <div className="md:col-span-7">
            <p className="label-eyebrow">{t("contact.form.eyebrow") || "Anfrage"}</p>
            <h2 className="mt-3 font-serif text-section">{t("contact.form.heading")}</h2>
            <p className="mt-3 text-mute">{t("contact.form.intro")}</p>
            <div className="mt-8">
              <ContactForm id="contact-form" />
            </div>
          </div>
        </Container>
      </section>

      {/* Map */}
      <section className="border-t border-line bg-paper">
        <Container className="py-section">
          <header className="mb-8 max-w-3xl">
            <p className="label-eyebrow">{t("contact.map.eyebrow") || "Standort"}</p>
            <h2 className="mt-3 font-serif text-section">{t("contact.map.heading")}</h2>
          </header>
          <ContactMap t={t} settings={settings} />
        </Container>
      </section>

      {/* FAQ */}
      <div id="faq">
        <FaqTeaser t={t} faqs={faqs} locale="de" />
      </div>

      <JsonLd data={buildLocalBusinessJsonLd(settings)} />
    </>
  );
}
