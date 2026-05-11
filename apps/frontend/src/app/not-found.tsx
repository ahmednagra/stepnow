// src/app/not-found.tsx
// Global 404. Outside the locale layouts so we use critical-string fallbacks.

import Link from "next/link";
import { CRITICAL_FALLBACKS } from "@/constants/critical-ui-strings";
import { Container } from "@/components/shared";
import { Button } from "@/components/ui";

const fallback = (key: string, locale: "de" | "en" = "de") =>
  CRITICAL_FALLBACKS[key]?.[locale] ?? key;

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center bg-cream">
      <Container className="text-center">
        <p className="font-serif text-7xl text-gold">404</p>
        <h1 className="mt-6 font-serif text-section">{fallback("404.heading")}</h1>
        <p className="mx-auto mt-3 max-w-md text-body-lg text-mute">{fallback("404.body")}</p>
        <Link href="/" className="mt-8 inline-block">
          <Button size="lg">{fallback("404.cta")}</Button>
        </Link>
      </Container>
    </main>
  );
}
