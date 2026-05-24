import { BrandMark } from "./BrandMark";
import { Container } from "./Container";

interface RouteLoaderProps {
  locale?: "de" | "en";
}

export function RouteLoader({ locale: _locale = "de" }: RouteLoaderProps) {
  return (
    <section aria-live="polite" aria-busy="true" className="bg-[var(--color-bg-page)]">
      <div className="route-loader-topbar h-[2px] w-full overflow-hidden bg-[rgba(85,133,24,0.1)]">
        <span className="route-loader-line block h-full w-[22%] bg-[var(--color-accent-primary)]" />
      </div>

      <Container className="py-16 md:py-20">
        <div className="route-loader-shell mx-auto flex min-h-[320px] max-w-[920px] items-center justify-center px-6 py-10 md:min-h-[380px]">
          <div className="flex w-full max-w-[560px] flex-col items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center md:h-24 md:w-24">
              <BrandMark size={34} className="route-loader-mark" />
            </div>

            <div className="mt-8 flex items-center gap-3">
              <span className="route-loader-dot h-2.5 w-12 bg-[var(--color-accent-primary)]/18" />
              <span className="route-loader-dot h-2.5 w-12 bg-[var(--color-accent-primary)]/18" />
              <span className="route-loader-dot h-2.5 w-12 bg-[var(--color-accent-primary)]/18" />
            </div>

            <div className="mt-10 grid w-full gap-3 md:grid-cols-3">
              <span className="route-loader-block h-16 border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)]" />
              <span className="route-loader-block h-16 border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)]" />
              <span className="route-loader-block h-16 border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)]" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
