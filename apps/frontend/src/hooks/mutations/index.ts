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

// ============================================
// CONTENT / ADMIN RESOURCE MUTATIONS
// ============================================
export { useCreateVehicle, useUpdateVehicle, useDeleteVehicle, useRestoreVehicle } from "./useVehicleMutations";
export { useCreateService, useUpdateService, useDeleteService, useRestoreService } from "./useServiceMutations";
export { useCreateFaq, useUpdateFaq, useDeleteFaq, useRestoreFaq } from "./useFaqMutations";
export { useCreateTestimonial, useUpdateTestimonial, useDeleteTestimonial, useRestoreTestimonial } from "./useTestimonialMutations";
export { useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from "./useCustomerMutations";
export { useCreateDriver, useUpdateDriver, useDeleteDriver, useRecordLicenseCheck } from "./useDriverMutations";
export { useUpdateBooking, useDeleteBooking } from "./useBookingMutations";
export { useUpdateContactMessage, useDeleteContactMessage } from "./useContactMessageMutations";
export { useCreateLegalPage, useSaveLegalPageDraft, usePublishLegalPage, useRollbackLegalPage } from "./useLegalPageMutations";
export {
  useCreatePricingCategory, useUpdatePricingCategory, useDeletePricingCategory, useRestorePricingCategory,
  useCreatePricingItem, useUpdatePricingItem, useDeletePricingItem, useRestorePricingItem,
} from "./usePricingMutations";
export { useCreateUiString, useUpdateUiString, useDeleteUiString, useRestoreUiString } from "./useUiStringMutations";
export { useUpdateSettings } from "./useSettingsMutations";
export { useCreateParcelOrder, useUpdateParcelOrder, useSetDeliveryStatus } from "./useCourierMutations";
