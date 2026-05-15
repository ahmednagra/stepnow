// apps/frontend/src/components/admin/index.ts
// Public barrel — keep grouped & stable to avoid import churn across pages.
// Note: AdminLayout is intentionally NOT re-exported here. It's an async server
// component that pulls in `next/headers` via auth-utils. Importing it from this
// barrel would force every client component pulling anything from this file to
// also bundle AdminLayout, which triggers "next/headers in client component"
// build errors. Import AdminLayout directly from "@/components/admin/AdminLayout".

export { AdminSidebar } from "./AdminSidebar";
export { AdminTopbar } from "./AdminTopbar";
export { AdminPageHeader } from "./AdminPageHeader";
export { AdminCard } from "./AdminCard";
export { AdminFormField, adminInputClass, adminTextareaClass } from "./AdminFormField";
export { AdminTable, AdminTableRow, AdminTableCell, AdminTableEmpty } from "./AdminTable";
export { ConfirmDialog } from "./ConfirmDialog";
export { KpiTile } from "./KpiTile";
export { ToastHost, pushToast } from "./ToastHost";
export type { ToastAction } from "./ToastHost";
export { BilingualField } from "./BilingualField";
export { AdminMarkdownPreview } from "./AdminMarkdownPreview";
export { Pagination } from "./Pagination";
export { BookingStatusBadge, BOOKING_STATUS_LABELS, BOOKING_STATUS_TONES } from "./BookingStatusBadge";
export type { BookingStatus } from "./BookingStatusBadge";
export { ImageUploadField } from "./ImageUploadField";
export { CommandPalette } from "./CommandPalette";
export { PreviewButton } from "./preview/PreviewButton";
export { PreviewModal } from "./preview/PreviewModal";
export { FilterToolbar } from "./shared/FilterToolbar";
