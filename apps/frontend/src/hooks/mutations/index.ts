// src/hooks/mutations/index.ts
// Barrel for all React Query WRITE hooks, grouped by section.

// ============================================
// ORDERS MUTATIONS
// ============================================
export {
  useConvertBookingToOrder,
  useUpdateOrder,
  useDeleteOrder,
  useCreateOrderInvoice,
  useRecordOrderPayment,
} from "./useOrderMutations";

// ============================================
// NOTIFICATIONS MUTATIONS
// ============================================
export {
  useMarkNotificationsRead,
  useMarkAllNotificationsRead,
  useArchiveNotification,
} from "./useNotificationMutations";
