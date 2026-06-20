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
      <Container className="py-4 md:py-6">
        <ScrollReveal
          as="header"
          className="mb-6 flex flex-col items-start gap-4 md:mb-7 md:flex-row md:items-end md:justify-between md:gap-8"
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

        <ScrollReveal as="ul" stagger className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {services.map((service, i) => {
            const Icon = getServiceIcon(service.icon, service.slug);
            const href = locale === "de" ? `/dienstleistungen/${service.slug}` : `/en/services/${service.slug}`;

            return (
              <li key={service.id}>
                <Link
                  href={href}
                  className="card-elevated group flex h-full flex-col gap-3 border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] p-5"
                >
                  <div className="flex items-start justify-between">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)] text-[var(--color-accent-primary)] transition-colors duration-base group-hover:border-[color:var(--color-accent-primary)] group-hover:bg-[color:rgba(168,134,90,0.12)]">
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden="true" />
                    </span>
                    <span className="font-serif text-[15px] leading-none text-[color:rgba(168,134,90,0.45)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-2">
                    <h3 className="min-h-[2.75em] text-[16px] font-semibold leading-snug tracking-tight text-[var(--color-text-primary)] md:text-[17px]">
                      {service.title}
                    </h3>
                    <p className="line-clamp-3 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                      {service.short_description}
                    </p>
                  </div>

                  <span className="mt-auto inline-flex items-center gap-1 border-t border-[color:var(--color-border-soft)] pt-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--color-accent-primary)] transition-colors duration-base group-hover:text-[var(--color-text-primary)]">
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
