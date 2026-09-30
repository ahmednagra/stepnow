// apps/frontend/src/components/shared/NotFoundView.tsx
// The public 404, localized from the enclosing UiStringsProvider — rendered by (public)/not-found.tsx
// and en/not-found.tsx, i.e. inside the DE or EN root layout (with header and footer).

"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { useUiStrings } from "@/hooks/useUiStrings";
import { Container } from "./Container";

export function NotFoundView() {
  const { t, locale } = useUiStrings();
  return (
    <Container className="py-section md:py-section-lg">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-deep">404</p>
        <h1 className="mt-6 font-serif text-display-md md:text-display-lg">{t("404.heading")}</h1>
        <p className="mx-auto mt-5 max-w-md text-body-lg text-mute">{t("404.body")}</p>
        <div className="mt-10 flex justify-center">
          <Link href={locale === "de" ? "/" : "/en"}>
            <Button size="lg" variant="secondary" trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}>
              {t("404.cta")}
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
