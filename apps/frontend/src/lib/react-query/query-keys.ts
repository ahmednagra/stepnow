// src/lib/react-query/query-keys.ts
// Centralized query-key factory. Never inline an array literal in a hook — always go through
// this so invalidation is type-safe and consistent. Mirrors the section style from the
// React Query Implementation Guide (all / lists / list / detail).

import type { ListAdminOrdersParams } from "@/services/orders";

export const queryKeys = {
  // ============================================
  // ORDERS
  // ============================================
  orders: {
    all: ["orders"] as const,
    lists: () => [...queryKeys.orders.all, "list"] as const,
    list: (params?: ListAdminOrdersParams) =>
      params
        ? ([...queryKeys.orders.lists(), params] as const)
        : ([...queryKeys.orders.lists()] as const),
    details: () => [...queryKeys.orders.all, "detail"] as const,
    detail: (orderId: string) => [...queryKeys.orders.details(), orderId] as const,
    payments: (orderId: string) => [...queryKeys.orders.detail(orderId), "payments"] as const,
  },

  // ============================================
  // NOTIFICATIONS
  // ============================================
  notifications: {
    all: ["notifications"] as const,
    lists: () => [...queryKeys.notifications.all, "list"] as const,
    list: (unreadOnly?: boolean) =>
      [...queryKeys.notifications.lists(), { unreadOnly: Boolean(unreadOnly) }] as const,
    unreadCount: () => [...queryKeys.notifications.all, "unread-count"] as const,
  },
} as const;
