// src/hooks/queries/useContactMessages.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES, GC_TIMES } from "@/lib/react-query";
import {
  getAdminContactMessage,
  listAdminContactMessages,
  type ListAdminContactMessagesParams,
} from "@/services/contact/contact.admin.client";
import type { Paginated, ContactMessageAdmin } from "@/types";

/** Paginated contact messages list. */
export function useContactMessages(params: ListAdminContactMessagesParams = {}, opts: { enabled?: boolean } = {}) {
  return useQuery<Paginated<ContactMessageAdmin>>({
    queryKey: queryKeys.contactMessages.list(params as Record<string, unknown>),
    queryFn: async () => {
      console.log(`🔄 useContactMessages: Fetching contact messages`);
      const res = await listAdminContactMessages(params);
      console.log(`✅ useContactMessages: Fetched ${res.items.length} contact messages`);
      return res;
    },
    enabled: opts.enabled ?? true,
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: GC_TIMES.STANDARD,
    refetchOnWindowFocus: true,
  });
}

/** Single contact message by id. */
export function useContactMessage(id: string, opts: { enabled?: boolean } = {}) {
  return useQuery<ContactMessageAdmin>({
    queryKey: queryKeys.contactMessages.detail(id),
    queryFn: async () => {
      console.log(`🔄 useContactMessage: Fetching ${id}`);
      const m = await getAdminContactMessage(id);
      console.log(`✅ useContactMessage: Fetched ${id}`);
      return m;
    },
    enabled: (opts.enabled ?? true) && Boolean(id),
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: GC_TIMES.STANDARD,
    refetchOnWindowFocus: true,
  });
}
