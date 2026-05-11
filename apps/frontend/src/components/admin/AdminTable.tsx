// apps/frontend/src/components/admin/AdminTable.tsx
// Phase 3d polish — addresses audit M-2 (table empty/loading state).
//   • Empty state now has icon + helper text.
//   • Loading state shows a row skeleton stack.
//   • Refined column header tracking, sticky header support.

import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/utils/cn";

interface AdminTableProps {
  columns: string[];
  /** Apply sticky thead — useful for long tables. */
  stickyHeader?: boolean;
  className?: string;
  children: ReactNode;
}

export function AdminTable({
  columns,
  stickyHeader = false,
  className,
  children,
}: AdminTableProps) {
  return (
    <div className={cn("relative overflow-x-auto", className)}>
      <table className="w-full border-collapse text-left">
        <thead
          className={cn(
            "border-b border-slate-200 bg-slate-50",
            stickyHeader && "sticky top-0 z-10",
          )}
        >
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                scope="col"
                className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-slate-500"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

interface AdminTableRowProps {
  className?: string;
  children: ReactNode;
}

export function AdminTableRow({ className, children }: AdminTableRowProps) {
  return (
    <tr
      className={cn(
        "border-b border-slate-100 transition-colors hover:bg-slate-50/60",
        className,
      )}
    >
      {children}
    </tr>
  );
}

interface AdminTableCellProps {
  className?: string;
  children: ReactNode;
}

export function AdminTableCell({ className, children }: AdminTableCellProps) {
  return <td className={cn("px-4 py-3 text-[13px] text-slate-700", className)}>{children}</td>;
}

interface AdminTableEmptyProps {
  message?: string;
  loading?: boolean;
  /** Number of placeholder rows when loading. */
  rows?: number;
}

export function AdminTableEmpty({
  message = "No items.",
  loading = false,
  rows = 5,
}: AdminTableEmptyProps) {
  if (loading) {
    return (
      <>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i} className="border-b border-slate-100">
            <td colSpan={99} className="px-4 py-3">
              <div className="h-4 w-full max-w-md animate-pulse bg-slate-100" />
            </td>
          </tr>
        ))}
      </>
    );
  }
  return (
    <tr>
      <td colSpan={99} className="px-6 py-16 text-center">
        <Inbox
          className="mx-auto h-8 w-8 text-slate-300"
          strokeWidth={1.25}
          aria-hidden="true"
        />
        <p className="mt-3 text-[13px] font-medium text-slate-600">{message}</p>
      </td>
    </tr>
  );
}
