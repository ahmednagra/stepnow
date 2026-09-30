// apps/frontend/src/app/global-error.tsx
// Last-resort boundary for errors thrown by a ROOT layout itself (e.g. its data fetch), where no
// layout — and so no ui strings — exists. Renders its own <html>; copy comes from the critical
// fallbacks, locale from the URL.

"use client";

import { usePathname } from "next/navigation";
import { createT } from "@/lib/i18n/t";
import { ErrorView } from "@/components/shared";
import { RootDocument } from "./root-document";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const pathname = usePathname() ?? "/";
  const locale = pathname === "/en" || pathname.startsWith("/en/") || pathname.startsWith("/admin") ? "en" : "de";
  const t = createT({}, locale);
  const copy = {
    eyebrow: t("errors.page.eyebrow"),
    heading: t("errors.page.heading"),
    body: t("errors.page.body"),
    retry: t("errors.page.retry"),
  };
  return (
    <RootDocument lang={locale}>
      <ErrorView copy={copy} error={error} reset={reset} />
    </RootDocument>
  );
}
