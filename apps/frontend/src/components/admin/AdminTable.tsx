// src/components/admin/AdminTable.tsx
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface AdminTableProps {
  /** Column header labels. Pass empty string for unlabeled columns. */
  columns: string[];
  children: ReactNode;
  /** Total row width hint for very wide tables. */
  className?: string;
}

/**
 * Dense table for admin pages. Sticky header, hover row highlight, narrow
 * spacing. Use AdminTableRow / AdminTableCell for the body.
 */
export function AdminTable({ columns, children, className }: AdminTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full border-collapse", className)}>
        <thead className="sticky top-0 bg-slate-50">
          <tr className="border-b border-slate-200">
            {columns.map((col, idx) => (
              <th
                key={idx}
                scope="col"
                className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-[13px] text-slate-700">{children}</tbody>
      </table>
    </div>
  );
}

export function AdminTableRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr className={cn("border-b border-slate-100 transition-colors hover:bg-slate-50", className)}>
      {children}
    </tr>
  );
}

export function AdminTableCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={cn("px-4 py-2.5", className)}>{children}</td>;
}

export function AdminTableEmpty({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={99} className="px-4 py-8 text-center text-[12px] text-slate-500">
        {message}
      </td>
    </tr>
  );
}
