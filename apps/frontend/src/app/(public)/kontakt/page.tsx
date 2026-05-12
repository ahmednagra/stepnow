import type { Metadata } from "next";
import { getUiStringsServer } from "@/services/uiStrings";
import { getSettingsServer } from "@/services/settings";
import { listFaqsServer } from "@/services/faqs";
import { createT } from "@/lib/i18n/t";
import { buildLocalBusinessJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/utils/json-ld";
import { Container } from "@/components/shared";
import { ContactForm, ContactMap, ContactMethods } from "@/components/features/contact";
import { FaqTeaser } from "@/components/features/home";
import { pickT } from "@/lib/i18n/pick";

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
        <Container className="pt-10 pb-6 md:pt-14 md:pb-8">
          <header className="max-w-3xl">
            <h1 className="font-serif text-section md:text-hero">{t("contact.page.title")}</h1>
            <p className="mt-3 text-body-lg text-mute">{t("contact.page.subhead")}</p>
          </header>
        </Container>
      </section>
      <section className="bg-cream">
        <Container className="grid gap-10 pt-2 pb-section md:grid-cols-12 md:gap-10">
          <aside className="md:col-span-5">
            <p className="label-eyebrow">{pickT(t, "contact.methods.eyebrow", "Direkt")}</p>
            <h2 className="mt-2 font-serif text-section">{t("contact.methods.heading")}</h2>
            <p className="mt-2 text-mute">{t("contact.methods.intro")}</p>
            <div className="mt-6">
              <ContactMethods t={t} settings={settings} />
            </div>
          </aside>
          <div className="md:col-span-7">
            <p className="label-eyebrow">{pickT(t, "contact.form.eyebrow", "Anfrage")}</p>
            <h2 className="mt-2 font-serif text-section">{t("contact.form.heading")}</h2>
            <p className="mt-2 text-mute">{t("contact.form.intro")}</p>
            <div className="mt-6">
              <ContactForm id="contact-form" />
            </div>
          </div>
        </Container>
      </section>
      <section className="border-t border-line bg-paper">
        <Container className="py-section">
          <header className="mb-6 max-w-3xl">
            <p className="label-eyebrow">{pickT(t, "contact.map.eyebrow", "Standort")}</p>
            <h2 className="mt-2 font-serif text-section">{t("contact.map.heading")}</h2>
          </header>
          <ContactMap settings={settings} />
        </Container>
      </section>
      <div id="faq">
        <FaqTeaser t={t} faqs={faqs} locale="de" />
      </div>
      <JsonLd data={buildLocalBusinessJsonLd(settings)} />
    </>
  );
}
