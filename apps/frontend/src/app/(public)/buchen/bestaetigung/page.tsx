// apps/frontend/src/app/(public)/buchen/bestaetigung/page.tsx
// Phase 3d polish — German booking confirmation page. Reads ?ref= from the
// URL and renders the premium BookingConfirmation surface.

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getUiStringsServer } from "@/services/uiStrings";
import { getSettingsServer } from "@/services/settings";
import { createT } from "@/lib/i18n/t";
import { buildMetadata } from "@/lib/seo";
import { Container } from "@/components/shared";
import { BookingConfirmation } from "@/components/features/booking/BookingConfirmation";
import { pickT } from "@/lib/i18n/pick";

const BOOKING_CONFIRMATION_BANNER_IMAGE =
  "/others/breadcrumb.jpg";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const stringsRes = await getUiStringsServer("de");
  const t = createT(stringsRes.strings, "de");
  return buildMetadata({
    title: t("booking.confirmation.heading"),
    description: t("booking.confirmation.body"),
    path: "/buchen/bestaetigung",
    locale: "de",
    noindex: true,
  });
}

interface PageProps {
  searchParams: Promise<{ ref?: string }>;
}

export default async function BookingConfirmationDe({ searchParams }: PageProps) {
  const sp = await searchParams;
  const stringsRes = await getUiStringsServer("de");
  const t = createT(stringsRes.strings, "de");
  const settings = await getSettingsServer("de");
  return (
    <>
      <section className="relative overflow-hidden border-t border-[color:var(--color-border-soft)] bg-[var(--color-text-primary)]">
        <div className="absolute inset-0">
          <Image
            src={BOOKING_CONFIRMATION_BANNER_IMAGE}
            alt="Booking confirmation"
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
              <li>
                <Link href="/buchen" className="transition-colors duration-base hover:text-[var(--color-text-on-strong)]">
                  {pickT(t, "booking.page.title", "Buchen")}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-[var(--color-text-on-strong)]">{t("booking.confirmation.heading")}</li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-secondary)]">
              {pickT(t, "booking.confirmation.eyebrow", "Anfrage erhalten")}
            </p>
            <h1 className="mt-3 font-serif text-[42px] leading-[0.98] tracking-tight text-[var(--color-text-on-strong)] md:text-[60px]">
              {t("booking.confirmation.heading")}
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[rgba(247,244,234,0.84)] md:text-[16px]">
              {pickT(
                t,
                "booking.confirmation.body",
                "Wir melden uns innerhalb von 30 Minuten mit einem Festpreis-Angebot.",
              )}
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-[var(--color-bg-page)]">
        <BookingConfirmation
          reference={sp.ref ?? null}
          settings={settings}
          homeHref="/"
        />
      </section>
    </>
  );
}
