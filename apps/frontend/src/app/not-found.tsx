// apps/frontend/src/app/not-found.tsx
// Phase 3d polish — restrained 404 page.

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { Container } from "@/components/shared";

export default function NotFound() {
  return (
    <Container className="py-section md:py-section-lg">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
          404
        </p>
        <h1 className="mt-6 font-serif text-display-md md:text-display-lg">
          Seite nicht gefunden
        </h1>
        <p className="mx-auto mt-5 max-w-md text-body-lg text-mute">
          Die gesuchte Seite existiert nicht oder wurde verschoben.
        </p>
        <div className="mt-10 flex justify-center">
          <Link href="/">
            <Button
              size="lg"
              variant="secondary"
              trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            >
              Zur Startseite
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
