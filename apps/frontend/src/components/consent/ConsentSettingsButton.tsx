// apps/frontend/src/components/consent/ConsentSettingsButton.tsx
// Small footer link that re-opens the consent banner so users can change their decision later.
"use client";
import { memo } from "react";
import { useConsentStore } from "@/stores/useConsentStore";
import { useUiStrings } from "@/hooks/useUiStrings";
import { pickT } from "@/lib/i18n/pick";

function ConsentSettingsButtonImpl({ className }: { className?: string }) {
  const reopen = useConsentStore((s) => s.reopen);
  const { t } = useUiStrings();
  return (
    <button type="button" onClick={reopen} className={className ?? "text-[12px] text-mute underline decoration-line underline-offset-2 hover:text-ink"}>
      {pickT(t, "consent.footer_link", "Cookie-Einstellungen")}
    </button>
  );
}

export const ConsentSettingsButton = memo(ConsentSettingsButtonImpl);
