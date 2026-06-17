// src/hooks/queries/useSettings.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES, GC_TIMES } from "@/lib/react-query";
import { fetchAdminSettings } from "@/services/settings/settings.admin.client";
import type { SettingsAdmin } from "@/types";

/** Site settings (singleton). */
export function useSettings(opts: { enabled?: boolean } = {}) {
  return useQuery<SettingsAdmin>({
    queryKey: queryKeys.settings.detail(),
    queryFn: async () => {
      console.log(`🔄 useSettings: Fetching settings`);
      const s = await fetchAdminSettings();
      console.log(`✅ useSettings: Fetched settings`);
      return s;
    },
    enabled: opts.enabled ?? true,
    staleTime: STALE_TIMES.STATIC,
    gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: false,
  });
}
