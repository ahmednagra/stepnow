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

  // ============================================
  // AUTH / SESSION
  // ============================================
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
  },

  // ============================================
  // DASHBOARD
  // ============================================
  dashboard: {
    all: ["dashboard"] as const,
  },

  // ============================================
  // SIDEBAR
  // ============================================
  sidebar: {
    all: ["sidebar"] as const,
    counts: () => [...queryKeys.sidebar.all, "counts"] as const,
  },

  // ============================================
  // CONTENT / ADMIN RESOURCES
  // ============================================
  vehicles: {
    all: ["vehicles"] as const,
    lists: () => [...queryKeys.vehicles.all, "list"] as const,
    list: (p?: Record<string, unknown>) => (p ? [...queryKeys.vehicles.lists(), p] as const : queryKeys.vehicles.lists()),
    detail: (id: string) => [...queryKeys.vehicles.all, "detail", id] as const,
  },
  faqs: {
    all: ["faqs"] as const,
    lists: () => [...queryKeys.faqs.all, "list"] as const,
    list: (p?: Record<string, unknown>) => (p ? [...queryKeys.faqs.lists(), p] as const : queryKeys.faqs.lists()),
    detail: (id: string) => [...queryKeys.faqs.all, "detail", id] as const,
  },
  services: {
    all: ["services"] as const,
    lists: () => [...queryKeys.services.all, "list"] as const,
    list: (p?: Record<string, unknown>) => (p ? [...queryKeys.services.lists(), p] as const : queryKeys.services.lists()),
    detail: (id: string) => [...queryKeys.services.all, "detail", id] as const,
    pricingCategories: (id: string) => [...queryKeys.services.detail(id), "pricing-categories"] as const,
  },
  testimonials: {
    all: ["testimonials"] as const,
    lists: () => [...queryKeys.testimonials.all, "list"] as const,
    list: (p?: Record<string, unknown>) => (p ? [...queryKeys.testimonials.lists(), p] as const : queryKeys.testimonials.lists()),
    detail: (id: string) => [...queryKeys.testimonials.all, "detail", id] as const,
  },
  settings: {
    all: ["settings"] as const,
    detail: () => [...queryKeys.settings.all, "detail"] as const,
  },
  bookings: {
    all: ["bookings"] as const,
    lists: () => [...queryKeys.bookings.all, "list"] as const,
    list: (p?: Record<string, unknown>) => (p ? [...queryKeys.bookings.lists(), p] as const : queryKeys.bookings.lists()),
    detail: (id: string) => [...queryKeys.bookings.all, "detail", id] as const,
  },
  contactMessages: {
    all: ["contact-messages"] as const,
    lists: () => [...queryKeys.contactMessages.all, "list"] as const,
    list: (p?: Record<string, unknown>) => (p ? [...queryKeys.contactMessages.lists(), p] as const : queryKeys.contactMessages.lists()),
    detail: (id: string) => [...queryKeys.contactMessages.all, "detail", id] as const,
  },
  legalPages: {
    all: ["legal-pages"] as const,
    lists: () => [...queryKeys.legalPages.all, "list"] as const,
    detail: (slug: string) => [...queryKeys.legalPages.all, "detail", slug] as const,
    versions: (slug: string) => [...queryKeys.legalPages.detail(slug), "versions"] as const,
  },
  customers: {
    all: ["customers"] as const,
    lists: () => [...queryKeys.customers.all, "list"] as const,
    list: (p?: Record<string, unknown>) => (p ? [...queryKeys.customers.lists(), p] as const : queryKeys.customers.lists()),
    detail: (id: string) => [...queryKeys.customers.all, "detail", id] as const,
    orders: (id: string) => [...queryKeys.customers.detail(id), "orders"] as const,
  },
  drivers: {
    all: ["drivers"] as const,
    lists: () => [...queryKeys.drivers.all, "list"] as const,
    list: (p?: Record<string, unknown>) => (p ? [...queryKeys.drivers.lists(), p] as const : queryKeys.drivers.lists()),
    detail: (id: string) => [...queryKeys.drivers.all, "detail", id] as const,
    orders: (id: string) => [...queryKeys.drivers.detail(id), "orders"] as const,
  },
  auditLog: {
    all: ["audit-log"] as const,
    lists: () => [...queryKeys.auditLog.all, "list"] as const,
    list: (p?: Record<string, unknown>) => (p ? [...queryKeys.auditLog.lists(), p] as const : queryKeys.auditLog.lists()),
  },
  uiStrings: {
    all: ["ui-strings"] as const,
    lists: () => [...queryKeys.uiStrings.all, "list"] as const,
    list: (p?: Record<string, unknown>) => (p ? [...queryKeys.uiStrings.lists(), p] as const : queryKeys.uiStrings.lists()),
    detail: (id: string) => [...queryKeys.uiStrings.all, "detail", id] as const,
  },
} as const;
