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

export function HomeServicesSection({ t, locale, services }: HomeServicesSectionProps) {
  return (
    <section className="bg-[var(--color-bg-page)]">
      <Container className="py-9 md:py-12">
        <ScrollReveal
          as="header"
          className="mb-6 flex flex-col items-start gap-4 md:mb-7 md:flex-row md:items-end md:justify-between md:gap-12"
        >
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-primary)]">
              {t("home.services.pre_heading")}
            </p>
            <h2 className="mt-2 font-serif text-[34px] leading-[1.05] tracking-tight text-[var(--color-text-primary)] md:text-[42px]">
              {t("home.services.heading")}
            </h2>
            <span className="accent-rule mt-4" aria-hidden="true" />
          </div>
          <p className="max-w-sm text-[13.5px] leading-relaxed text-[var(--color-text-secondary)] md:text-right">
            {t("home.services.subheading")}
          </p>
        </ScrollReveal>

        <ScrollReveal as="ul" stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = getServiceIcon(service.icon, service.slug);
            const href = locale === "de" ? `/dienstleistungen/${service.slug}` : `/en/services/${service.slug}`;

            return (
              <li key={service.id}>
                <Link
                  href={href}
                  className="card-elevated group flex h-full flex-col gap-4 border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] p-6 md:p-7"
                >
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center border border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)] text-[var(--color-accent-primary)] transition-colors duration-base group-hover:border-[color:var(--color-accent-primary)]">
                    <Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
                  </span>

                  <div className="flex flex-1 flex-col gap-2.5">
                    <h3 className="text-[20px] font-semibold tracking-tight text-[var(--color-text-primary)] md:text-[22px]">
                      {service.title}
                    </h3>
                    <p className="text-[14.5px] leading-relaxed text-[var(--color-text-secondary)]">
                      {service.short_description}
                    </p>
                  </div>

                  <span className="mt-auto inline-flex items-center gap-1.5 pt-1 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-primary)] transition-colors duration-base group-hover:text-[var(--color-text-primary)]">
                    {t("services.card.learn_more")}
                    <ArrowUpRight
                      className="h-3.5 w-3.5 transition-transform duration-base ease-out-premium group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
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
