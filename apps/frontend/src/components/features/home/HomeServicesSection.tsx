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
  "https://images.unsplash.com/photo-1620227134464-f879b1b93807?auto=format&fit=crop&w=1600&q=80";

export function HomeServicesSection({ t, locale, services }: HomeServicesSectionProps) {
  return (
    <section className="bg-[var(--color-bg-page)]">
      <Container className="py-section">
        <ScrollReveal
          as="header"
          className="mb-7 flex flex-col items-start gap-5 md:mb-9 md:flex-row md:items-end md:justify-between md:gap-12"
        >
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-primary)]">
              {t("home.services.pre_heading")}
            </p>
            <h2 className="mt-2 font-serif text-[34px] leading-[1.05] tracking-tight text-[var(--color-text-primary)] md:text-[42px]">
              {t("home.services.heading")}
            </h2>
          </div>
          <p className="max-w-sm text-[13.5px] leading-relaxed text-[var(--color-text-secondary)] md:text-right">
            {t("home.services.subheading")}
          </p>
        </ScrollReveal>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
          <ScrollReveal
            as="div"
            className="relative min-h-[320px] overflow-hidden border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] md:min-h-[420px]"
          >
            <Image
              src={SERVICES_IMAGE}
              alt="Professional transport service vehicle"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(47,58,31,0.08),rgba(47,58,31,0.44))]" />
          </ScrollReveal>

          <ScrollReveal
            as="ul"
            stagger
            className="grid gap-px overflow-hidden border border-[color:var(--color-border-soft)] bg-[color:var(--color-border-soft)] md:grid-cols-2"
          >
            {services.map((service) => {
              const Icon = getServiceIcon(service.icon, service.slug);
              const href = locale === "de" ? `/dienstleistungen/${service.slug}` : `/en/services/${service.slug}`;

              return (
                <li key={service.id} className="bg-[var(--color-bg-surface)]">
                  <Link
                    href={href}
                    className="group flex h-full flex-col gap-5 p-7 transition-colors duration-base ease-out-premium hover:bg-[var(--color-bg-page)] md:p-9"
                  >
                    <div className="flex items-start gap-4">
                      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center border border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)] text-[var(--color-accent-primary)] transition-colors duration-base group-hover:border-[color:var(--color-accent-primary)] group-hover:text-[var(--color-accent-primary)]">
                        <Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col gap-3">
                      <h3 className="text-[22px] font-semibold tracking-tight text-[var(--color-text-primary)] md:text-[24px]">
                        {service.title}
                      </h3>
                      <p className="max-w-md text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
                        {service.short_description}
                      </p>
                    </div>

                    <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-primary)] transition-colors duration-base group-hover:text-[var(--color-text-primary)]">
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
        </div>
      </Container>
    </section>
  );
}
