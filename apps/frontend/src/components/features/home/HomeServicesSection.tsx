import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { Locale, ServicePublic } from "@/types";
import { Container, ScrollReveal } from "@/components/shared";
import { getServiceIcon } from "@/utils/service-icons";

interface HomeServicesSectionProps {
  t: TFunction;
  locale: Locale;
  services: ServicePublic[];
}

const SERVICES_IMAGE =
  "/others/services.avif";

export function HomeServicesSection({ t, locale, services }: HomeServicesSectionProps) {
  return (
    <section className="bg-[var(--color-bg-page)]">
      <Container className="py-10 md:py-12">
        <ScrollReveal
          as="header"
          className="mb-5 flex flex-col items-start gap-3 md:mb-6 md:flex-row md:items-end md:justify-between md:gap-12"
        >
          <div className="max-w-2xl">
            <h2 className="font-serif text-[26px] leading-[1.05] tracking-tight text-[var(--color-text-primary)] md:text-[32px]">
              {t("home.services.heading")}
            </h2>
          </div>
          <p className="max-w-sm text-balance text-[13px] leading-relaxed text-[var(--color-text-secondary)] md:max-w-md md:text-right">
            {t("home.services.subheading")}
          </p>
        </ScrollReveal>

        <ScrollReveal
          as="ul"
          stagger
          className="grid gap-px overflow-hidden border border-[color:var(--color-border-soft)] bg-[color:var(--color-border-soft)] sm:grid-cols-2 lg:grid-cols-6"
        >
          <li aria-hidden="true" className="relative hidden min-h-[200px] overflow-hidden bg-[var(--color-bg-surface)] lg:block">
            <Image
              src={SERVICES_IMAGE}
              alt="Professional transport service vehicle"
              fill
              sizes="16vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,17,21,0.08),rgba(15,17,21,0.44))]" />
          </li>

          {services.map((service) => {
            const Icon = getServiceIcon(service.icon, service.slug);
            const href = locale === "de" ? `/dienstleistungen/${service.slug}` : `/en/services/${service.slug}`;

            return (
              <li key={service.id} className="bg-[var(--color-bg-surface)]">
                <Link
                  href={href}
                  className="group flex h-full flex-col gap-3 p-5 transition-colors duration-base ease-out-premium hover:bg-[var(--color-bg-page)]"
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)] text-[var(--color-accent-primary)] transition-colors duration-base group-hover:border-[color:var(--color-accent-primary)] group-hover:text-[var(--color-accent-primary)]">
                    <Icon className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
                  </span>

                  <div className="flex flex-1 flex-col gap-1.5">
                    <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-[var(--color-text-primary)]">
                      {service.title}
                    </h3>
                    <p className="line-clamp-3 text-[12.5px] leading-relaxed text-[var(--color-text-secondary)]">
                      {service.short_description}
                    </p>
                  </div>

                  <span className="mt-auto inline-flex items-center gap-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-accent-primary)] transition-colors duration-base group-hover:text-[var(--color-text-primary)]">
                    {t("services.card.learn_more")}
                    <ArrowUpRight
                      className="h-3 w-3 transition-transform duration-base ease-out-premium group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ScrollReveal>
      </Container>
    </section>
  );
}
