// src/components/admin/Pagination.tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  /** Total record count for the small "X–Y of Z" label. Optional. */
  total?: number;
  size?: number;
}

/**
 * Numbered pagination. Shows: ← 1 … 4 5 [6] 7 8 … 20 →
 * Calls `onChange` with the new page (1-based). Disables prev/next at edges.
 */
export function Pagination({ page, totalPages, onChange, total, size }: PaginationProps) {
  if (totalPages <= 1) {
    return total != null ? (
      <p className="text-[11px] text-slate-500">
        {total === 0 ? "No items" : `${total} ${total === 1 ? "item" : "items"}`}
      </p>
    ) : null;
  }

  const window = buildWindow(page, totalPages);

  const rangeStart = (page - 1) * (size ?? 1) + 1;
  const rangeEnd = Math.min(page * (size ?? 1), total ?? page * (size ?? 1));

  return (
    <div className="flex items-center justify-between gap-3">
      {total != null && size != null ? (
        <p className="text-[11px] text-slate-500 tabular-nums">
          {rangeStart}–{rangeEnd} of {total}
        </p>
      ) : (
        <span />
      )}
      <nav aria-label="Pagination" className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="flex h-7 w-7 items-center justify-center border border-slate-300 bg-white text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
        >
          <ChevronLeft className="h-3 w-3" />
        </button>
        {window.map((p, idx) =>
          p === "…" ? (
            <span
              key={`gap-${idx}`}
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center text-[12px] text-slate-400"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={
                p === page
                  ? "flex h-7 min-w-7 items-center justify-center bg-slate-900 px-1.5 text-[12px] font-medium tabular-nums text-white"
                  : "flex h-7 min-w-7 items-center justify-center border border-slate-300 bg-white px-1.5 text-[12px] tabular-nums text-slate-700 transition-colors hover:bg-slate-100"
              }
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="flex h-7 w-7 items-center justify-center border border-slate-300 bg-white text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      </nav>
    </div>
  );
}

/**
 * Build the window of page numbers to show.
 * Always include: 1, last, current, current±1.
 * Use "…" for gaps.
 */
function buildWindow(current: number, total: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  const add = (v: number | "…") => {
    if (out[out.length - 1] !== v) out.push(v);
  };

  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - 1 && i <= current + 1)
    ) {
      add(i);
    } else if (i < current - 1 || i > current + 1) {
      add("…");
    }
  }
  return out;
}
