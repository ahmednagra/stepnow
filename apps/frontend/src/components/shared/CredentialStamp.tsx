// apps/frontend/src/components/shared/CredentialStamp.tsx
// Registration/licensing block styled like an official stamp — turns the
// Handelsregister + concession + tax data (already printed on every
// Transportauftrag/Rechnung) into a visible trust signal instead of
// footer fine print. Renders only the lines that have data.

import type { SettingsPublic } from "@/types";
import { cn } from "@/utils/cn";

interface CredentialStampProps {
  settings: SettingsPublic;
  tone?: "dark" | "light";
  className?: string;
}

export function CredentialStamp({ settings, tone = "dark", className }: CredentialStampProps) {
  const lines = [
    settings.concession_number && `§ 49 PBefG · ${settings.concession_number}`,
    settings.commercial_register &&
      [settings.commercial_register, settings.register_court].filter(Boolean).join(" · "),
    (settings.vat_id || settings.tax_number) &&
      `USt-IdNr. ${settings.vat_id ?? settings.tax_number}`,
  ].filter(Boolean) as string[];

  if (lines.length === 0) return null;

  const isDark = tone === "dark";

  return (
    <div
      className={cn(
        "inline-flex flex-col gap-1 border-y-[3px] border-double px-4 py-3",
        isDark
          ? "border-[var(--color-accent-secondary)] text-[var(--color-text-footer-muted)]"
          : "border-[var(--color-accent-primary)] text-[var(--color-text-secondary)]",
        className,
      )}
    >
      {lines.map((line) => (
        <span
          key={line}
          className="font-mono text-[10.5px] uppercase leading-relaxed tracking-[0.08em] tabular-nums"
        >
          {line}
        </span>
      ))}
    </div>
  );
}
