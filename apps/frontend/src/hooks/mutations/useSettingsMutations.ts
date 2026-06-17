// src/hooks/mutations/useSettingsMutations.ts
// React Query WRITE hook for site settings. Calls the existing settings admin client service,
// then invalidates the settings detail so the form re-fetches.

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import { updateAdminSettings, type SettingsUpdate } from "@/services/settings";

/** Update site settings. Invalidates the settings detail. */
export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SettingsUpdate) => updateAdminSettings(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.settings.detail() });
    },
  });
}
