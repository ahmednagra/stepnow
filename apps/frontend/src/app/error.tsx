// src/app/error.tsx
"use client";

import { useEffect } from "react";
import { Container } from "@/components/shared";
import { Button } from "@/components/ui";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[App error]", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center bg-cream">
      <Container className="text-center">
        <h1 className="font-serif text-section">Ein Fehler ist aufgetreten</h1>
        <p className="mx-auto mt-3 max-w-md text-body-lg text-mute">
          An error occurred. Please try again.
        </p>
        <Button onClick={reset} size="lg" className="mt-8">
          Erneut versuchen / Try again
        </Button>
      </Container>
    </main>
  );
}
