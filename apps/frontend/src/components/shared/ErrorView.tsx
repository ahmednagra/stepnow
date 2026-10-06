// apps/frontend/src/components/shared/ErrorView.tsx
// Restrained error panel with a retry CTA. Presentational: every error boundary passes its own copy
// (public roots from ui strings, admin in English, global-error from the critical fallbacks).

"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui";
import { useUiStrings } from "@/hooks/useUiStrings";
import { Container } from "./Container";

interface ErrorViewCopy {
  eyebrow: string;
  heading: string;
  body: string;
  retry: string;
}

interface ErrorViewProps {
  copy: ErrorViewCopy;
  error: Error & { digest?: string };
  reset: () => void;
}

const CHUNK_RELOAD_KEY = "stepnow_chunk_reload";

/** A tab open across a deploy requests chunks that no longer exist; reload once per URL to fetch the new build. */
function reloadOnceForChunkError(error: Error): boolean {
  if (error.name !== "ChunkLoadError" && !/Loading (CSS )?chunk .+ failed/i.test(error.message)) return false;
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === window.location.href) return false;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, window.location.href);
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

export function ErrorView({ copy, error, reset }: ErrorViewProps) {
  useEffect(() => {
    if (reloadOnceForChunkError(error)) return;
    if (process.env.NODE_ENV !== "production") {
      console.error("Route error:", error);
    }
  }, [error]);

  return (
    <Container className="py-section md:py-section-lg">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center border border-danger/30 bg-paper text-danger">
          <AlertTriangle className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-danger">{copy.eyebrow}</p>
        <h1 className="mt-3 font-serif text-section md:text-hero">{copy.heading}</h1>
        <p className="mx-auto mt-5 max-w-md text-body-lg text-mute">{copy.body}</p>
        {error.digest && <p className="mt-3 font-mono text-[11px] text-mute">Ref: {error.digest}</p>}
        <div className="mt-10 flex justify-center">
          <Button size="lg" onClick={reset} leadingIcon={<RotateCw className="h-4 w-4" aria-hidden="true" />}>
            {copy.retry}
          </Button>
        </div>
      </div>
    </Container>
  );
}

/** ErrorView with copy from the enclosing UiStringsProvider — for error.tsx inside the DE/EN roots. */
export function LocalizedErrorView({ error, reset }: Omit<ErrorViewProps, "copy">) {
  const { t } = useUiStrings();
  const copy = {
    eyebrow: t("errors.page.eyebrow"),
    heading: t("errors.page.heading"),
    body: t("errors.page.body"),
    retry: t("errors.page.retry"),
  };
  return <ErrorView copy={copy} error={error} reset={reset} />;
}
