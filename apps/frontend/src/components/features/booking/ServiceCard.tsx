// src/components/features/booking/ServiceCard.tsx
"use client";

import { Check } from "lucide-react";
import type { ServicePublic } from "@/types";
import { cn } from "@/utils/cn";

interface ServiceCardProps {
  service: ServicePublic;
  selected: boolean;
  onSelect: (id: string) => void;
  name: string;
}

/**
 * Card-shaped radio for service selection. Keyboard-accessible via the hidden
 * native radio input; pointer-accessible via the surrounding label.
 */
export function ServiceCard({ service, selected, onSelect, name }: ServiceCardProps) {
  return (
    <label
      className={cn(
        "group relative flex cursor-pointer items-start gap-4 border bg-cream p-5 transition-all duration-base ease-out-premium",
        selected
          ? "border-ink shadow-md"
          : "border-line hover:border-mute hover:shadow-sm",
      )}
    >
      <input
        type="radio"
        name={name}
        value={service.id}
        checked={selected}
        onChange={() => onSelect(service.id)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border transition-colors duration-base",
          selected ? "border-ink bg-ink text-cream" : "border-line bg-cream text-transparent",
        )}
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
      <span className="flex flex-col gap-1">
        <span className="font-serif text-lg tracking-tight">{service.title}</span>
        <span className="text-sm leading-snug text-mute">{service.short_description}</span>
      </span>
    </label>
  );
}
