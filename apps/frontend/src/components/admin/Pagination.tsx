// apps/frontend/src/components/admin/Pagination.tsx
// Phase 3d polish — restrained, ink/slate pagination controls.

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (next: number) => void;
  /** When set, shows the total item count next to the controls. */
  totalItems?: number;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
}: PaginationProps) {
  const canPrev = page > 1;
  const canNext = page < totalPages;
  return (
    <div className="flex items-center justify-between gap-4 border-t border-slate-200 bg-white px-4 py-3">
      <p className="text-[12px] text-slate-500">
        Page <span className="font-medium tabular-nums text-slate-700">{page}</span> of{" "}
        <span className="font-medium tabular-nums text-slate-700">{Math.max(totalPages, 1)}</span>
        {totalItems !== undefined && (
          <>
            {" "}
            ·{" "}
            <span className="tabular-nums">{totalItems}</span> items
          </>
        )}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => canPrev && onPageChange(page - 1)}
          disabled={!canPrev}
          className={cn(
            "inline-flex h-8 items-center gap-1 border border-slate-300 bg-white px-3 text-[12px] font-medium text-slate-700 transition-colors",
            canPrev ? "hover:bg-slate-100" : "cursor-not-allowed opacity-40",
          )}
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
          Prev
        </button>
        <button
          type="button"
          onClick={() => canNext && onPageChange(page + 1)}
          disabled={!canNext}
          className={cn(
            "inline-flex h-8 items-center gap-1 border border-slate-300 bg-white px-3 text-[12px] font-medium text-slate-700 transition-colors",
            canNext ? "hover:bg-slate-100" : "cursor-not-allowed opacity-40",
          )}
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
