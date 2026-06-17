// src/hooks/queries/index.ts
// Barrel for all React Query READ hooks, grouped by section.

// ============================================
// ORDERS QUERIES
// ============================================
export { useOrders, useOrder, useOrderPayments } from "./useOrders";

// ============================================
// NOTIFICATIONS QUERIES
// ============================================
export { useNotifications, useUnreadNotificationCount } from "./useNotifications";

// ============================================
// SESSION / SHELL QUERIES
// ============================================
export { useCurrentAdmin } from "./useCurrentAdmin";
export { useSidebarCounts } from "./useSidebarCounts";
export { useDashboard } from "./useDashboard";

// ============================================
// CONTENT / ADMIN RESOURCE QUERIES
// ============================================
export { useVehicles, useVehicle } from "./useVehicles";
export { useFaqs, useFaq } from "./useFaqs";
export { useServices, useService, useServicePricingCategories } from "./useServices";
export { useTestimonials, useTestimonial } from "./useTestimonials";
export { useSettings } from "./useSettings";
export { useBookings, useBooking } from "./useBookings";
export { useContactMessages, useContactMessage } from "./useContactMessages";
export { useLegalPages, useLegalPage, useLegalPageVersions } from "./useLegalPages";
export { useCustomers, useCustomer, useCustomerOrders } from "./useCustomers";
export { useDrivers, useDriver, useDriverOrders } from "./useDrivers";
export { useAuditLog } from "./useAuditLog";
export { useUiStrings } from "./useUiStrings";
