// apps/frontend/src/components/features/home/HeroBookingWidget.tsx
// Phase 3d polish — tightened spacing, accessible labels, premium border
// treatment. Layout retained per product decision (split hero).

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin } from "lucide-react";
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
    <div className="flex flex-col gap-6 border border-cream/15 bg-charcoal/50 p-7 backdrop-blur-sm md:p-8">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="block h-px w-8 bg-gold" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
          {t("hero_widget.heading")}
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
          <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-cream/60">
            {t("hero_widget.when_label")}
          </label>
          <input
            type="date"
            min={bounds?.min}
            max={bounds?.max}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 w-full border border-cream/20 bg-transparent px-3 text-[14px] text-cream transition-colors duration-base focus:border-gold focus:outline-none"
          />
        </div>
      </div>

      <Button
        size="lg"
        variant="inverse"
        onClick={submit}
        trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
        fullWidth
      >
        {t("hero_widget.cta")}
      </Button>

      <p className="text-[11px] leading-relaxed text-cream/50">
        {pickT(t, "hero_widget.note", "Festpreis-Antwort innerhalb von 30 Minuten.")}
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
      <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-cream/60">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <MapPin
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/35"
            aria-hidden="true"
            strokeWidth={1.5}
          />
        )}
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`h-11 w-full border border-cream/20 bg-transparent text-[14px] text-cream placeholder:text-cream/40 transition-colors duration-base focus:border-gold focus:outline-none ${
            icon ? "pl-9 pr-3" : "px-3"
          }`}
        />
      </div>
    </div>
  );
}
