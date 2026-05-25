// apps/frontend/src/app/(public)/buchen/page.tsx

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getUiStringsServer } from "@/services/uiStrings";
import { listServicesServer } from "@/services/services";
import { getSettingsServer } from "@/services/settings";
import { createT } from "@/lib/i18n/t";
import { buildMetadata } from "@/lib/seo";
import { Container } from "@/components/shared";
import { WizardShell } from "@/components/features/booking/WizardShell";
import { pickT } from "@/lib/i18n/pick";

const BOOKING_BANNER_IMAGE =
  "/others/breadcrumb.jpg";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const stringsRes = await getUiStringsServer("de");
  const t = createT(stringsRes.strings, "de");
  return buildMetadata({
    title: t("booking.page.title"),
    description: t("booking.page.subhead"),
    path: "/buchen",
    locale: "de",
  });
}

export default async function BookingPageDe() {
  const [stringsRes, services, settings] = await Promise.all([
    getUiStringsServer("de"),
    listServicesServer("de"),
    getSettingsServer("de"),
  ]);
  const t = createT(stringsRes.strings, "de");

  return (
    <Suspense fallback={null}>
      <>
        <section className="relative overflow-hidden border-t border-[color:var(--color-border-soft)] bg-[var(--color-text-primary)]">
          <div className="absolute inset-0">
            <Image
              src={BOOKING_BANNER_IMAGE}
              alt="Private booking transport"
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
                <li className="text-[var(--color-text-on-strong)]">{t("booking.page.title")}</li>
              </ol>
            </nav>

            <div className="max-w-3xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-secondary)]">
                {pickT(t, "booking.page.eyebrow", "Anfrage")}
              </p>
              <h1 className="mt-3 font-serif text-[42px] leading-[0.98] tracking-tight text-[var(--color-text-on-strong)] md:text-[60px]">
                {t("booking.page.title")}
              </h1>
              <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[rgba(247,244,234,0.84)] md:text-[16px]">
                {t("booking.page.subhead")}
              </p>
            </div>
          </Container>
        </section>

        <section className="bg-[var(--color-bg-page)]">
          <WizardShell
            locale="de"
            services={services}
            confirmationPath="/buchen/bestaetigung"
            settings={settings}
          />
        </section>
      </>
    </Suspense>
  );
}
