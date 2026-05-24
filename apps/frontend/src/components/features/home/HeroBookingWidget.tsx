// apps/frontend/src/components/features/home/HeroBookingWidget.tsx
// Phase 3d polish — tightened spacing, accessible labels, premium border
// treatment. Layout retained per product decision (split hero).

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { useUiStrings } from "@/hooks/useUiStrings";
import type { Locale } from "@/types";
import { Button } from "@/components/ui";
import { MAX_ADVANCE_DAYS } from "@/constants/booking-wizard";
import { pickT } from "@/lib/i18n/pick";

interface HeroBookingWidgetProps {
  locale: Locale;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
function dateOffsetStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function HeroBookingWidget({ locale }: HeroBookingWidgetProps) {
  const { t } = useUiStrings();
  const router = useRouter();
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [bounds, setBounds] = useState<{ min: string; max: string } | null>(null);
  useEffect(() => {
    setBounds({ min: todayStr(), max: dateOffsetStr(MAX_ADVANCE_DAYS) });
  }, []);

  const wizardPath = locale === "de" ? "/buchen" : "/en/book";

  function submit() {
    const params = new URLSearchParams();
    if (pickup.trim()) params.set("pickup", pickup.trim());
    if (destination.trim()) params.set("destination", destination.trim());
    if (date) params.set("date", date);
    const qs = params.toString();
    router.push(qs ? `${wizardPath}?${qs}` : wizardPath);
  }

  return (
    <div className="flex flex-col gap-6 border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] p-6 md:p-7">
      <div className="border-b border-[color:var(--color-border-soft)] pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-primary)]">
          {t("hero_widget.heading")}
        </p>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
          {pickT(
            t,
            "hero_widget.note",
            "Share your route and date. We prepare the booking flow with your details.",
          )}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <WidgetField
          label={t("hero_widget.from_label")}
          placeholder={t("hero_widget.from_placeholder")}
          value={pickup}
          onChange={setPickup}
          icon
        />
        <WidgetField
          label={t("hero_widget.to_label")}
          placeholder={t("hero_widget.to_placeholder")}
          value={destination}
          onChange={setDestination}
          icon
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
            {t("hero_widget.when_label")}
          </label>
          <div className="relative">
            <CalendarDays
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]/65"
              aria-hidden="true"
              strokeWidth={1.5}
            />
            <input
              type="date"
              min={bounds?.min}
              max={bounds?.max}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 w-full border border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)] pl-9 pr-3 text-[14px] text-[var(--color-text-primary)] transition-colors duration-base focus:border-[color:var(--color-accent-primary)] focus:outline-none"
            />
          </div>
        </div>
      </div>

      <Button
        size="lg"
        variant="primary"
        onClick={submit}
        trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
        fullWidth
        className="text-[12px] uppercase tracking-[0.16em]"
      >
        {t("hero_widget.cta")}
      </Button>

      <p className="border-t border-[color:var(--color-border-soft)] pt-4 text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
        {pickT(
          t,
          "hero_widget.note",
          "Fixed-price reply during our service hours.",
        )}
      </p>
    </div>
  );
}

interface WidgetFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
  icon?: boolean;
}

function WidgetField({ label, placeholder, value, onChange, icon }: WidgetFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <MapPin
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]/65"
            aria-hidden="true"
            strokeWidth={1.5}
          />
        )}
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`h-11 w-full border border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)] text-[14px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]/70 transition-colors duration-base focus:border-[color:var(--color-accent-primary)] focus:outline-none ${
            icon ? "pl-9 pr-3" : "px-3"
          }`}
        />
      </div>
    </div>
  );
}
