// apps/frontend/src/app/error.tsx
// Phase 3d polish — restrained error boundary with retry CTA.

"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui";
import { Container } from "@/components/shared";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to logging in dev.
    if (process.env.NODE_ENV !== "production") {
      console.error("Global error:", error);
    }
  }, [error]);

  return (
    <Container className="py-section md:py-section-lg">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center border border-danger/30 bg-paper text-danger">
          <AlertTriangle className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-danger">
          Fehler
        </p>
        <h1 className="mt-3 font-serif text-section md:text-hero">
          Etwas ist schiefgelaufen
        </h1>
        <p className="mx-auto mt-5 max-w-md text-body-lg text-mute">
          Die Seite konnte nicht geladen werden. Bitte versuchen Sie es erneut.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-[11px] text-mute">Ref: {error.digest}</p>
        )}
        <div className="mt-10 flex justify-center">
          <Button
            size="lg"
            onClick={reset}
            leadingIcon={<RotateCw className="h-4 w-4" aria-hidden="true" />}
          >
            Erneut versuchen
          </Button>
        </div>
      </div>
    </Container>
  );
}
